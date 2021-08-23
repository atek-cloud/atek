import { ServiceInstance, ServiceConfig } from './instance.js'
import * as serverdb from '../serverdb/index.js'
import * as git from '../lib/git.js'
import { fileURLToPath } from 'url'
import * as path from 'path'
import { promises as fsp } from 'fs'
import { Config } from '../lib/config.js'
import lock from '../lib/lock.js'
import { getAvailableId, getAvailablePort } from './util.js'
import { createValidator } from '../schemas/util.js'
import AtekService, { SourceTypeEnum, RuntimeEnum } from '../gen/atek.cloud/service.js'
import AdbCtrlApi from '../gen/atek.cloud/adb-ctrl-api.js'
import { HyperServiceInstance } from '../hyper/service.js'

const INSTALL_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const INSTALL_ADB_PATH = path.join(INSTALL_PATH, 'adb')

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

interface InstallParams {
  sourceUrl: string
  id?: string
  port?: number
  desiredVersion?: string
}

interface UpdateParams {
  sourceUrl?: string
  port?: number
  desiredVersion?: string
}

interface ServiceManifest {
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

const services = new Map<string, ServiceInstance>()
const adbCtrlApi = new AdbCtrlApi()

// exported api
// =

export async function setup (): Promise<void> {
}

export async function loadCoreServices (): Promise<void> {
  const cfg = Config.getActiveConfig()
  services.set('core.hyper', new HyperServiceInstance({
    id: 'core.hyper',
    port: 0,
    sourceUrl: 'https://atek.cloud', // TODO
    package: {
      sourceType: SourceTypeEnum.file
    },
    system: {appPort: 0},
    installedBy: 'system'
  }, {
    SIMULATE_HYPERSPACE: cfg?.simulateHyperspace ? '1' : '',
    HYPERSPACE_HOST: cfg?.hyperspaceHost,
    HYPERSPACE_STORAGE: cfg?.hyperspaceStorage
  }))
  await services.get('core.hyper')?.setup()
  await services.get('core.hyper')?.start()

  await load({
    id: 'core.adb',
    port: 12345, // TODO
    sourceUrl: `file://${INSTALL_ADB_PATH}`,
    package: {
      sourceType: SourceTypeEnum.file
    },
    manifest: {
      runtime: RuntimeEnum.node,
      "exports": [
        {"api": "atek.cloud/adb-api", "path": "/_api/adb"},
        {"api": "atek.cloud/adb-ctrl-api", "path": "/_api/adb-ctrl"}
      ]
    },
    system: {appPort: 12345}, // TODO
    installedBy: 'system'
  }, {
    ATEK_SERVER_DBID: cfg.serverDbId,
    ATEK_SERVER_DB_CREATE_NEW: cfg.serverDbId ? '' : '1'
  })
  await services.get('core.adb')?.start()

  const serverDbId = await adbCtrlApi.getServerDatabaseId()
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

export async function install (params: InstallParams, authedUsername: string): Promise<AtekService> {
  if (!params.sourceUrl) {
    throw new Error('Source URL is required')
  }
  if (params.id && await serverdb.services.get(params.id)) {
    throw new Error('App already exists under the name: ' + params.id)
  }

  if (!params.id) {
    params.id = await getAvailableId(params.sourceUrl)
  }
  if (!params.port) {
    params.port = await getAvailablePort()
  }

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

  const manifest = await readManifestFile(params.id, params.sourceUrl)

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
    system: {
      appPort: await getAvailablePort()
    },
    installedBy: authedUsername
  }
  await serverdb.services.put(params.id, recordValue)
  await load(recordValue)
  return recordValue
}

export async function updateConfig (id: string, params: UpdateParams): Promise<void> {
  const record = await serverdb.services.get(id)
  if (!record?.value) {
    throw new Error(`App ${id} not found`)
  }

  if (typeof params.port === 'number') record.value.port = params.port
  if (typeof params.sourceUrl === 'string') record.value.sourceUrl = params.sourceUrl
  if (typeof params.desiredVersion === 'string') record.value.desiredVersion = params.desiredVersion

  await serverdb.services.put(id, record.value)
  const inst = get(id)
  if (inst) inst.settings = record.value
}

export async function uninstall (id: string): Promise<void> {
  const release = await lock(`services:${id}:ctrl`)
  try {
    const record = await serverdb.services.get(id)
    if (!record) {
      throw new Error(`App ${id} not found`)
    }

    get(id)?.stop()
    if (record.value?.package.sourceType === 'git') {
      await fsp.rm(Config.getActiveConfig().packageInstallPath(id), {recursive: true})
    }
    await serverdb.services.delete(id)
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
      services.set(id, new ServiceInstance(settings, config))
      await services.get(id)?.setup()
    }
    return services.get(id)
  } finally {
    release()
  }
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

export async function checkForPackageUpdates (id: string): Promise<object> {
  const record = await serverdb.services.get(id)
  if (!record?.value) {
    throw new Error(`App ${id} not found`)
  }
  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion || 'latest')
  return {
    hasUpdate: latestVersion !== record.value.package.installedVersion,
    installedVersion: record.value.package.installedVersion,
    latestVersion
  }
}

export async function updatePackage (id: string): Promise<object> {
  const record = await serverdb.services.get(id)
  if (!record?.value) {
    throw new Error(`App ${id} not found`)
  }

  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion || 'latest')
  if (latestVersion === record.value.package.installedVersion) {
    return {installedVersion: latestVersion, oldVersion: latestVersion}
  }
  await git.checkout(id, latestVersion)

  const manifest = await readManifestFile(id, record.value.sourceUrl)

  const oldVersion = record.value.package.installedVersion
  record.value.manifest = manifest
  record.value.package.installedVersion = latestVersion
  await serverdb.services.put(id, record.value)

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

async function readManifestFile (id: string, sourceUrl: string): Promise<ServiceManifest | undefined> {
  try {
    const installPath = getInstallPath(id, sourceUrl)
    const obj = JSON.parse(await fsp.readFile(path.join(installPath, 'app.json'), 'utf8'))
    assertIsManifest(obj)
    return obj
  } catch (e) {
    console.error(`No valid app.json manifest file found for`, sourceUrl)
    console.error(e)
    return undefined
  }
}

function assertIsManifest (obj: any): asserts obj is ServiceManifest {
  manifestValidator.assert(obj)
}
