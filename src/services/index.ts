import { ServiceInstance } from './instance.js'
import * as serverdb from '../serverdb/index.js'
import * as git from '../lib/git.js'
import * as npm from '../lib/npm.js'
import { fileURLToPath } from 'url'
import * as path from 'path'
import { promises as fsp } from 'fs'
import { Config } from '../config.js'
import lock from '../lib/lock.js'
import { sourceUrlToId, getAvailableId, getAvailablePort, getServiceRecordById } from './util.js'
import { createValidator } from '../schemas/util.js'
import AtekService, { SourceTypeEnum, RuntimeEnum, ServiceConfig } from '../gen/atek.cloud/service.js'
import AdbCtrlApi from '../gen/atek.cloud/adb-ctrl-api.js'

const manifestValidator = createValidator({
  type: 'object',
  properties: {
    title: {type: 'string'},
    description: {type: 'string'},
    author: {type: 'string'},
    license: {type: 'string'},
    runtime: {type: 'string', enum: ['node', 'deno']},
    protocols: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: {type: 'string'}
        }
      }
    },
    permissions: {
      type: 'array',
      items: {type: 'string'}
    }
  }
})

export interface InstallParams {
  sourceUrl: string
  id?: string
  port?: number
  desiredVersion?: string
  config?: ServiceConfig
}

export interface UpdateParams {
  sourceUrl?: string
  id?: string
  port?: number
  desiredVersion?: string
  config?: ServiceConfig
}

export interface ServiceManifest {
  title?: string
  description?: string
  author?: string
  license?: string
  runtime?: RuntimeEnum
  protocols?: {
    tables?: string[]
  }
}

// globals
// =

const services = new Map<string, ServiceInstance>()
const adbCtrlApi = new AdbCtrlApi()

// exported api
// =

export async function setup (): Promise<void> {
}

export async function loadCoreServices (): Promise<void> {
  const cfg = Config.getActiveConfig()
  for (const serviceParams of cfg.coreServices) {
    await loadCoreService(serviceParams)
  }

  await adbCtrlApi.init({serverDbId: cfg.serverDbId || ''})
  const {serverDbId} = await adbCtrlApi.getConfig()
  if (!cfg.isOverridden('serverDbId') && cfg.serverDbId !== serverDbId) {
    console.log('HOST: Created new server database, id:', serverDbId)
    cfg.update({serverDbId})
  }
}

export async function loadUserServices (): Promise<void> {
  const srvRecords = (await serverdb.services.list()).records
  for (const srvRecord of srvRecords) {
    if (srvRecord.value) await load(srvRecord.value)
  }
}

export async function install (params: InstallParams, authedUsername: string): Promise<ServiceInstance> {
  let recordValue
  if (!params.sourceUrl) {
    throw new Error('Source URL is required')
  }
  if (params.id && await getServiceRecordById(params.id).catch(e => undefined)) {
    throw new Error('App already exists under the ID: ' + params.id)
  }

  if (!params.id) {
    params.id = await getAvailableId(params.sourceUrl)
  }

  const release = await lock(`services:${params.id}:ctrl`)
  try {
    if (!params.port) {
      params.port = await getAvailablePort()
    }

    const {sourceType, installedVersion} = await fetchPackage(params)
    const manifest = await readManifestFile(params.id, params.sourceUrl)
    if (manifest?.runtime === 'node' && sourceType !== 'file') {
      await npm.setupPackage(params.id, getInstallPath(params.id, params.sourceUrl))
    }

    recordValue = {
      id: params.id,
      port: params.port,
      sourceUrl: params.sourceUrl,
      desiredVersion: params.desiredVersion,
      package: {
        sourceType: sourceType as SourceTypeEnum,
        installedVersion
      },
      manifest,
      config: params.config,
      installedBy: authedUsername
    }
    await serverdb.services.create(recordValue)
  } finally {
    release()
  }
  const inst = await load(recordValue)
  if (!inst) throw new Error('Failed to load installed service')
  return inst
}

export async function updateConfig (id: string, params: UpdateParams): Promise<void> {
  const release = await lock(`services:${id}:ctrl`)
  try {
    const record = await getServiceRecordById(id)

    const isIdChanged = typeof params.id === 'string' && params.id && params.id !== id
    if (isIdChanged && params.id) {
      if (await getServiceRecordById(params.id).catch(e => undefined)) {
        throw new Error('App already exists under the ID: ' + params.id)
      }
      record.value.id = params.id
    }
    if (typeof params.port === 'number') record.value.port = params.port
    if (typeof params.sourceUrl === 'string') record.value.sourceUrl = params.sourceUrl
    if (typeof params.desiredVersion === 'string') record.value.desiredVersion = params.desiredVersion
    if (params.config) {
      record.value.config = record.value.config ?? {}
      Object.assign(record.value.config, params.config)
    }

    await serverdb.services.put(record.key, record.value)

    const inst = get(id)
    if (inst && isIdChanged && params.id) {
      services.delete(id)
      services.set(params.id, inst)
    }

    if (inst) {
      inst.settings = record.value
      if (record.value.config) inst.setConfig(record.value.config)
    }
  } finally {
    release()
  }
}

export async function uninstall (id: string): Promise<void> {
  const release = await lock(`services:${id}:ctrl`)
  try {
    const record = await getServiceRecordById(id)

    get(id)?.stop()
    if (record.value?.package.sourceType === 'git') {
      await fsp.rm(Config.getActiveConfig().packageInstallPath(id), {recursive: true})
    }
    await serverdb.services.delete(record.key)
    services.delete(id)
  } finally {
    release
  }
}

export async function load (settings: AtekService, config: ServiceConfig = {}): Promise<ServiceInstance| undefined> {
  const id = settings.id
  const release = await lock(`services:${id}:ctrl`)
  try {
    if (!services.has(id)) {
      services.set(id, new ServiceInstance(settings, Object.assign({}, settings.config, config)))
      await services.get(id)?.setup()
      await services.get(id)?.start()
    }
    return services.get(id)
  } finally {
    release()
  }
}

export async function loadCoreService (params: InstallParams): Promise<ServiceInstance> {
  if (!params.sourceUrl) {
    throw new Error('Source URL is required')
  }

  if (!params.id) {
    params.id = `core.${sourceUrlToId(params.sourceUrl)}`
  }
  if (!params.port) {
    params.port = await getAvailablePort(true)
  }

  const {sourceType, installedVersion} = await fetchPackage(params)
  const manifest = await readManifestFile(params.id, params.sourceUrl)
  if (manifest?.runtime === 'node' && sourceType !== 'file') {
    await npm.setupPackage(params.id, getInstallPath(params.id, params.sourceUrl))
  }

  const recordValue = {
    id: params.id,
    port: params.port,
    sourceUrl: params.sourceUrl,
    desiredVersion: params.desiredVersion,
    package: {
      sourceType: sourceType as SourceTypeEnum,
      installedVersion
    },
    manifest,
    installedBy: 'system'
  }
  const inst = await load(recordValue, params.config)
  if (!inst) throw new Error('Failed to load core service')
  return inst
}

export function get (id: string): ServiceInstance | undefined {
  return services.get(id)
}

export function list (): ServiceInstance[] {
  return Array.from(services.values())
}

export function getByBearerToken (bearerToken: string): ServiceInstance | undefined {
  return list().find(app => app.bearerToken === bearerToken)
}

export function stopAll (): void {
  for (const id in services) {
    get(id)?.stop()
  }
}

export async function checkForPackageUpdates (id: string): Promise<{hasUpdate: boolean, installedVersion: string, latestVersion: string}> {
  const record = await getServiceRecordById(id)
  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion || 'latest')
  return {
    hasUpdate: latestVersion !== record.value.package.installedVersion,
    installedVersion: record.value.package.installedVersion || 'latest',
    latestVersion
  }
}

export async function updatePackage (id: string): Promise<{installedVersion: string, oldVersion: string}> {
  const record = await getServiceRecordById(id)

  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion || 'latest')
  if (latestVersion === record.value.package.installedVersion) {
    return {installedVersion: latestVersion, oldVersion: latestVersion}
  }
  await git.checkout(id, latestVersion)

  const manifest = await readManifestFile(id, record.value.sourceUrl)
  if (manifest?.runtime === 'node' && record.value.package.sourceType !== SourceTypeEnum.file) {
    await npm.setupPackage(id, getInstallPath(id, record.value.sourceUrl))
  }

  const oldVersion = record.value.package.installedVersion || ''
  record.value.manifest = manifest
  record.value.package.installedVersion = latestVersion
  await serverdb.services.put(record.key, record.value)

  const inst = get(id)
  if (inst) inst.settings = record.value

  return {installedVersion: latestVersion, oldVersion}
}

export function getInstallPath (id: string, sourceUrl: string): string {
  if (sourceUrl.startsWith('file://')) {
    return fileURLToPath(sourceUrl)
  } else {
    return Config.getActiveConfig().packageInstallPath(id)
  }
}

// internal methods
// =

async function fetchPackage (params: InstallParams) {
  if (!params.id) throw new Error('ID is required')

  let sourceType = 'file'
  let installedVersion = undefined
  if (params?.sourceUrl && !params.sourceUrl.startsWith('file://')) {
    try {
      await git.clone(params.id, params.sourceUrl)
    } catch (e) {
      throw new Error(`Failed to install app. Is it a Git repo? ${e.toString()}`)
    }
    sourceType = 'git'
    installedVersion = await git.getLatestVersion(params.id, params.desiredVersion || 'latest')
    if (!installedVersion) {
      throw new Error(`This git repo has not published any releases.`)
    }
    await git.checkout(params.id, installedVersion)
  }

  return {sourceType, installedVersion}
}

async function readManifestFile (id: string, sourceUrl: string): Promise<ServiceManifest | undefined> {
  try {
    const installPath = getInstallPath(id, sourceUrl)
    const obj = JSON.parse(await fsp.readFile(path.join(installPath, 'atek.json'), 'utf8'))
    assertIsManifest(obj)
    return obj
  } catch (e) {
    console.error(`No valid atek.json manifest file found for`, sourceUrl)
    console.error(e)
    return undefined
  }
}

function assertIsManifest (obj: any): asserts obj is ServiceManifest {
  manifestValidator.assert(obj)
}
