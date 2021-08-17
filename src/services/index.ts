import { ServiceInstance } from './instance.js'
// import * as db from '../db/index.js' TODO
import * as git from '../lib/git.js'
import { URL, fileURLToPath } from 'url'
import * as path from 'path'
import { promises as fsp } from 'fs'
import { Config } from '../lib/config.js'
import lock from '../lib/lock.js'
import { getAvailableId, getAvailablePort } from './util.js'
import { createValidator } from '../schemas/util.js'
import AtekService, {SourceTypeEnum} from '../gen/atek.cloud/service.js'
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

// exported api
// =

export async function setup (): Promise<void> {
}

export async function loadCoreServices (): Promise<void> {
  const cfg = Config.getActiveConfig()
  services.set('core.hyper', new HyperServiceInstance({
    id: 'core.hyper',
    port: 0,
    sourceUrl: new URL('https://atek.cloud'), // TODO
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
    port: 0,
    sourceUrl: new URL(`file://${INSTALL_ADB_PATH}`),
    package: {
      sourceType: SourceTypeEnum.file
    },
    system: {appPort: 12345}, // TODO
    installedBy: 'system'
  })
  await services.get('core.adb')?.start()

  // TODO load the adb service with the configured hostdb
}

/*export async function loadUserServices (): Promise<void> {
  // TODO
  const srvRecords = await db.privateServerDb.apps.list()
  for (let srvRecord of srvRecords) {
    await load(srvRecord.value)
  }
}

export async function install (params: InstallParams, authedUsername: string): Promise<AtekService> {
  // TODO
  if (!params.sourceUrl) {
    throw new Error('Source URL is required')
  }
  if (params.id && await db.privateServerDb.apps.get(params.id)) {
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
    installedVersion = await git.getLatestVersion(params.id, params.desiredVersion)
    if (!installedVersion) {
      throw new Error(`This git repo has not published any releases.`)
    }
    await git.checkout(params.id, installedVersion)
  }

  const manifest = await readManifestFile(params.id, params.sourceUrl)
  await loadSchemas(manifest)

  const recordValue = {
    id: params.id,
    port: params.port,
    sourceUrl: params.sourceUrl,
    desiredVersion: params.desiredVersion,
    package: {
      sourceType: sourceType as (("file" | "git") & string),
      installedVersion
    },
    manifest,
    system: {
      appPort: await getAvailablePort()
    },
    installedBy: authedUsername
  }
  await db.privateServerDb.apps.put(params.id, recordValue)
  await load(recordValue)
  return recordValue
}

export async function updateConfig (id: string, params: UpdateParams): Promise<void> {
  // TODO
  const record = await db.privateServerDb.apps.get(id)
  if (!record) {
    throw new Error(`App ${id} not found`)
  }

  record.value.port = ('port' in params) ? params.port : record.value.port
  record.value.sourceUrl = ('sourceUrl' in params) ? params.sourceUrl : record.value.sourceUrl
  record.value.desiredVersion = ('desiredVersion' in params) ? params.desiredVersion : record.value.desiredVersion

  await db.privateServerDb.apps.put(id, record.value)
  get(id).settings = record.value
}

export async function uninstall (id: string): Promise<void> {
  // TODO
  const release = await lock(`services:${id}:ctrl`)
  try {
    const record = await db.privateServerDb.apps.get(id)
    if (!record) {
      throw new Error(`App ${id} not found`)
    }

    get(id)?.stop()
    if (record.value.package.sourceType === 'git') {
      await fsp.rm(Config.getActiveConfig().packageInstallPath(id), {recursive: true})
    }
    await db.privateServerDb.apps.del(id)
    services.delete(id)
  } finally {
    release
  }
}*/

export async function load (settings: AtekService): Promise<ServiceInstance| undefined> {
  const id = settings.id
  const release = await lock(`services:${id}:ctrl`)
  try {
    if (!services.has(id)) {
      services.set(id, new ServiceInstance(settings))
      if (settings.manifest) {
        // TODO needed?
        // await loadSchemas(settings.manifest)
      }
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

/*
export async function checkForPackageUpdates (id: string): Promise<object> {
  // TODO
  const record = await db.privateServerDb.apps.get(id)
  if (!record) {
    throw new Error(`App ${id} not found`)
  }
  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion)
  return {
    hasUpdate: latestVersion !== record.value.package.installedVersion,
    installedVersion: record.value.package.installedVersion,
    latestVersion
  }
}

export async function updatePackage (id: string): Promise<object> {
  // TODO
  const record = await db.privateServerDb.apps.get(id)
  if (!record) {
    throw new Error(`App ${id} not found`)
  }

  await git.fetch(id)
  const latestVersion = await git.getLatestVersion(id, record.value.desiredVersion)
  if (latestVersion === record.value.package.installedVersion) {
    return {installedVersion: latestVersion, oldVersion: latestVersion}
  }
  await git.checkout(id, latestVersion)

  const manifest = await readManifestFile(id, record.value.sourceUrl)
  await loadSchemas(manifest)

  const oldVersion = record.value.package.installedVersion
  record.value.manifest = manifest
  record.value.package.installedVersion = latestVersion
  await db.privateServerDb.apps.put(id, record.value)
  get(id).settings = record.value

  return {installedVersion: latestVersion, oldVersion}
}*/

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

/*
async function loadSchemas (manifest: ServiceManifest): Promise<void> {
  if (!manifest?.protocols?.tables?.length) {
    return
  }
  for (const table of manifest.protocols.tables) {
    let domain, name, minRevision
    try {
      const groups = /(?<domain>.+)\/(?<name>[^@]+)(@(?<minRevision>[\d]+))?/.exec(table)?.groups
      if (groups) {
        domain = groups.domain
        name = groups.name
        minRevision = groups.minRevision
      }
    } catch (e) {
      throw new Error(`Invalid protocols.tables specifier: ${table}. Must be of shape {domain}/{name}@{minRevision}`)
    }
    if (domain && name) {
      await schemas.load(domain, name, Number(minRevision))
    }
  }
}
*/