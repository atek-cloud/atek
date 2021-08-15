import { ServiceInstance } from './instance.js'
// import * as db from '../db/index.js' TODO
import * as git from '../lib/git.js'
import { fileURLToPath } from 'url'
import * as path from 'path'
import { promises as fsp } from 'fs'
import { Config } from '../lib/config.js'
import lock from '../lib/lock.js'
import { getAvailableId, getAvailablePort } from './util.js'
import { createValidator } from '../schemas/util.js'
import * as schemas from '../schemas/index.js'
import * as atekService from '../gen/atek.cloud/service'

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
  const srvRecords = []// await db.privateServerDb.apps.list() TODO
  for (let srvRecord of srvRecords) {
    await load(srvRecord.value)
  }
}

export async function install (params: InstallParams, authedUsername: string): Promise<atekService.Service> {
  if (!params.sourceUrl) {
    throw new Error('Source URL is required')
  }
  if (params.id && false /* TODO await db.privateServerDb.apps.get(params.id)*/) {
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
  // await db.privateServerDb.apps.put(params.id, recordValue) TODO
  await load(recordValue)
  return recordValue
}

export async function updateConfig (id: string, params: UpdateParams): Promise<void> {
  const record = undefined// TODO await db.privateServerDb.apps.get(id)
  if (!record) {
    throw new Error(`App ${id} not found`)
  }

  record.value.port = ('port' in params) ? params.port : record.value.port
  record.value.sourceUrl = ('sourceUrl' in params) ? params.sourceUrl : record.value.sourceUrl
  record.value.desiredVersion = ('desiredVersion' in params) ? params.desiredVersion : record.value.desiredVersion

  // await db.privateServerDb.apps.put(id, record.value) TODO
  get(id).settings = record.value
}

export async function uninstall (id: string): Promise<void> {
  const release = await lock(`services:${id}:ctrl`)
  try {
    const record = undefined// TODO await db.privateServerDb.apps.get(id)
    if (!record) {
      throw new Error(`App ${id} not found`)
    }

    get(id)?.stop()
    if (record.value.package.sourceType === 'git') {
      await fsp.rm(Config.getActiveConfig().packageInstallPath(id), {recursive: true})
    }
    // await db.privateServerDb.apps.del(id) TODO
    services.delete(id)
  } finally {
    release
  }
}

export async function load (settings: atekService.Service): Promise<ServiceInstance> {
  const id = settings.id
  const release = await lock(`services:${id}:ctrl`)
  try {
    if (!services.has(id)) {
      services.set(id, new ServiceInstance(settings))
      await loadSchemas(settings.manifest)
      await services.get(id).setup()
    }
    return services.get(id)
  } finally {
    release()
  }
}

export function get (id): ServiceInstance {
  return services.get(id)
}

export function list (): ServiceInstance[] {
  return Array.from(services.values())
}

export function getByBearerToken (bearerToken: string): ServiceInstance {
  return list().find(app => app.bearerToken === bearerToken)
}

export function stopAll (): void {
  for (let id in services) {
    get(id).stop()
  }
}

export async function checkForPackageUpdates (id: string): Promise<object> { // TODO
  const record = undefined// TODO await db.privateServerDb.apps.get(id)
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

export async function updatePackage (id: string): Promise<object> { // TODO
  const record = undefined// TODO await db.privateServerDb.apps.get(id)
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
  // await db.privateServerDb.apps.put(id, record.value) TODO
  get(id).settings = record.value

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

async function readManifestFile (id: string, sourceUrl: string): Promise<ServiceManifest> {
  try {
    const installPath = getInstallPath(id, sourceUrl)
    const obj = JSON.parse(await fsp.readFile(path.join(installPath, 'app.json'), 'utf8'))
    assertIsManifest(obj)
    return obj
  } catch (e) {
    console.error(`No valid app.json manifest file found for`, sourceUrl)
    console.error(e)
  }
}

function assertIsManifest (obj: any): asserts obj is ServiceManifest {
  manifestValidator.assert(obj)
}

async function loadSchemas (manifest: ServiceManifest): Promise<void> {
  if (!manifest?.protocols?.tables?.length) {
    return
  }
  for (let table of manifest.protocols.tables) {
    let domain, name, minRevision
    try {
      ;({domain, name, minRevision} = /(?<domain>.+)\/(?<name>[^@]+)(@(?<minRevision>[\d]+))?/.exec(table)?.groups)
    } catch (e) {
      throw new Error(`Invalid protocols.tables specifier: ${table}. Must be of shape {domain}/{name}@{minRevision}`)
    }
    await schemas.load(domain, name, Number(minRevision))
  }
}
