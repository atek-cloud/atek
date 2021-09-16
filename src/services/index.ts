import { ServiceInstance } from './instance.js'
import adb from '@atek-cloud/adb-api'
import { services, Service, SourceTypeEnum, ServiceConfig, users, User, Role as UserRole } from '@atek-cloud/adb-tables'
import * as serverdb from '../serverdb/index.js'
import * as git from '../lib/git.js'
import * as npm from '../lib/npm.js'
import { fileURLToPath } from 'url'
import * as path from 'path'
import { promises as fsp } from 'fs'
import * as cli from '../lib/cli.js'
import chalk from 'chalk'
import { Config } from '../config.js'
import lock from '../lib/lock.js'
import { sourceUrlToId, getAvailableId, getServiceRecordById } from './util.js'
import { createValidator } from '../schemas/util.js'

const manifestValidator = createValidator({
  type: 'object',
  properties: {
    title: {type: 'string'},
    description: {type: 'string'},
    author: {type: 'string'},
    license: {type: 'string'},
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
  desiredVersion?: string
  config?: ServiceConfig
}

export interface UpdateParams {
  sourceUrl?: string
  id?: string
  desiredVersion?: string
  config?: ServiceConfig
}

export interface ServiceManifest {
  title?: string
  description?: string
  author?: string
  license?: string
  protocols?: {
    tables?: string[]
  }
}

// globals
// =

const activeServices = new Map<string, ServiceInstance>()

// exported api
// =

export function setup (): void {
  process.on('exit', () => stopAll())
}

export async function loadCoreServices (): Promise<void> {
  const cfg = Config.getActiveConfig()
  cli.status('Loading core services')
  let i = 0
  for (const serviceParams of cfg.coreServices) {
    cli.status('Loading core services', cli.genProgress(i++, cfg.coreServices.length), 'Now loading:', chalk.green(serviceParams.sourceUrl))
    await loadCoreService(serviceParams)
  }
  cli.endStatus('Loaded core services')

  await adb.api.init({serverDbId: cfg.serverDbId || ''})
  const {serverDbId} = await adb.api.getConfig()
  if (!cfg.isOverridden('serverDbId') && cfg.serverDbId !== serverDbId) {
    console.log('HOST: Created new server database, id:', serverDbId)
    cfg.update({serverDbId})
  }
}

export async function loadUserServices (): Promise<void> {
  cli.status('Loading installed services')
  let i = 0
  const srvRecords = (await services(serverdb.get()).list()).records
  for (const srvRecord of srvRecords) {
    cli.status('Loading installed services', cli.genProgress(i++, srvRecords.length), 'Now loading:', chalk.green(srvRecord.value.sourceUrl))
    await load(srvRecord.key, srvRecord.value)
  }
  cli.endStatus('Loaded installed services')
}

export async function install (params: InstallParams, authedUserKey: string): Promise<ServiceInstance> {
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

  let recordKey = undefined
  const release = await lock(`services:${params.id}:ctrl`)
  try {
    const {sourceType, installedVersion} = await fetchPackage(params)
    const manifest = await readManifestFile(params.id, params.sourceUrl)
    if (sourceType !== 'file') {
      await npm.setupPackage(params.id, getInstallPath(params.id, params.sourceUrl))
    }

    recordValue = {
      id: params.id,
      owningUserKey: authedUserKey,
      sourceUrl: params.sourceUrl,
      desiredVersion: params.desiredVersion,
      package: {
        sourceType: sourceType as SourceTypeEnum,
        installedVersion
      },
      manifest,
      config: params.config
    }
    const res = await services(serverdb.get()).create(recordValue)
    recordKey = res.key
  } finally {
    release()
  }
  const inst = await load(recordKey, recordValue)
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
    if (typeof params.sourceUrl === 'string') record.value.sourceUrl = params.sourceUrl
    if (typeof params.desiredVersion === 'string') record.value.desiredVersion = params.desiredVersion
    if (params.config) {
      record.value.config = record.value.config ?? {}
      Object.assign(record.value.config, params.config)
    }

    await services(serverdb.get()).put(record.key, record.value)

    const inst = get(id)
    if (inst && isIdChanged && params.id) {
      activeServices.delete(id)
      activeServices.set(params.id, inst)
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
      await fsp.rm(Config.getActiveConfig().packageInstallPath(id), {recursive: true}).catch(e => undefined)
    }
    await services(serverdb.get()).delete(record.key)
    activeServices.delete(id)
  } finally {
    release()
  }
}

export async function load (serviceKey: string, settings: Service, config: ServiceConfig = {}): Promise<ServiceInstance| undefined> {
  const id = settings.id
  const release = await lock(`services:${id}:ctrl`)
  try {
    if (!activeServices.has(id)) {
      activeServices.set(id, new ServiceInstance(serviceKey, settings, Object.assign({}, settings.config, config)))
      await activeServices.get(id)?.setup()
      await activeServices.get(id)?.start()
    }
    return activeServices.get(id)
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

  console.log('Loading core service', params)
  const {sourceType, installedVersion, didChange} = await fetchPackage(params)
  const manifest = await readManifestFile(params.id, params.sourceUrl)
  if (sourceType !== 'file' && didChange) {
    await npm.setupPackage(params.id, getInstallPath(params.id, params.sourceUrl))
  }

  const recordValue = {
    id: params.id,
    owningUserKey: 'system',
    sourceUrl: params.sourceUrl,
    desiredVersion: params.desiredVersion,
    package: {
      sourceType: sourceType as SourceTypeEnum,
      installedVersion
    },
    manifest
  }
  const inst = await load(genCoreServiceKey(), recordValue, params.config)
  if (!inst) throw new Error('Failed to load core service')
  return inst
}

export function get (id: string): ServiceInstance | undefined {
  return activeServices.get(id)
}

export function getByKey (serviceKey: string): ServiceInstance | undefined {
  return list().find(srv => srv.serviceKey === serviceKey)
}

export function list (): ServiceInstance[] {
  return Array.from(activeServices.values())
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
  if (record.value.package.sourceType !== SourceTypeEnum.file) {
    await npm.setupPackage(id, getInstallPath(id, record.value.sourceUrl))
  }

  const oldVersion = record.value.package.installedVersion || ''
  record.value.manifest = manifest
  record.value.package.installedVersion = latestVersion
  await services(serverdb.get()).put(record.key, record.value)

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
  let didChange = false
  if (params?.sourceUrl && !params.sourceUrl.startsWith('file://')) {
    const prevVersion = await git.getCurrentVersion(params.id).catch(e => undefined)
    try {
      await git.clone(params.id, params.sourceUrl)
    } catch (e: any) {
      if (e.name !== 'CheckoutConflictError') {
        throw new Error(`Failed to install app. Is it a Git repo? ${e.toString()}`)
      }
      console.log('Git clone failed due to a conflict in the package directory. Reinstalling package...')
      await fsp.rm(Config.getActiveConfig().packageInstallPath(params.id), {recursive: true})
      try {
        await git.clone(params.id, params.sourceUrl)
      } catch (e: any) {
        throw new Error(`Failed to install app. Is it a Git repo? ${e.toString()}`)
      }
    }
    sourceType = 'git'
    installedVersion = await git.getLatestVersion(params.id, params.desiredVersion || 'latest')
    if (!installedVersion) {
      throw new Error(`This git repo has not published any releases.`)
    }
    await git.checkout(params.id, installedVersion)
    didChange = prevVersion !== installedVersion
    console.log({didChange, prevVersion, installedVersion})
  }

  return {sourceType, installedVersion, didChange}
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

let _genCoreServiceKey = 1000
function genCoreServiceKey () {
  return `${_genCoreServiceKey++}`
}
