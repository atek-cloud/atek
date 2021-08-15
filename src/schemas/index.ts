import path from 'path'
import { promises as fsp } from 'fs'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import { Schema, APDLSchema } from './schema.js'
import { Config } from '../lib/config.js'
import { createValidator } from './util.js'

const SYSTEM_SCHEMAS = [
  'ctzn.network/account',
  'ctzn.network/account-session',
  'ctzn.network/app-profile-session',
  'ctzn.network/application',
  'ctzn.network/database',
  'ctzn.network/index-state'
]

const schemas = new Map<string, Schema>()
const schemaValidator = createValidator({
  type: 'object',
  required: ['id', 'title', 'type'],
  properties: {
    id: {type: 'string'},
    rev: {type: 'number'},
    title: {type: 'string'},
    type: {type: 'string', enum: ['api', 'adb-record']}
  }
})

// exported api
// =

export const getCached: (string) => Schema = schemas.get.bind(schemas)

export async function setup (): Promise<void> {
  for (let systemSchema of SYSTEM_SCHEMAS) {
    const [domain, name] = systemSchema.split('/')
    await load(domain, name)
  }
}

export async function load (domain: string, name: string, minRevision = 1): Promise<Schema> {
  const id = `${domain}/${name}`

  if (schemas.get(id)?.rev >= minRevision) {
    return schemas.get(id)
  }

  let obj = await readSchemaFile(domain, name)
  if (!obj || !isSchemaValid(obj) || obj.rev < minRevision) {
    try {
      await downloadSchemaFile(domain, name)
    } catch (e) {
      console.error(`Failed to download schema ${domain}/${name}`)
      console.error(e)
      throw e
    }
    obj = await readSchemaFile(domain, name)
  }

  try {
    assertSchemaValid(obj)
  } catch (e) {
    console.error(`Failed to load schema ${domain}/${name}`)
    console.error(e)
    throw e
  }

  if (obj.rev < minRevision && minRevision !== 1) {
    console.error(`Unable to find schema ${domain}/${name} that satisfies minimum revision ${minRevision}`)
    console.error(`Highest revision found: ${obj.rev}`)
    throw new Error(`Unable to find schema ${domain}/${name} that satisfies minimum revision ${minRevision}`)
  }

  schemas.set(id, new Schema(obj))
  return schemas.get(id)
}

// internal methods
// =

async function readSchemaFile (domain: string, name: string): Promise<object> {
  try {
    const installPath = (domain === 'ctzn.network' /* TEMP */)
      ? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'schemas', `${name}.json`)
      : path.join(Config.getActiveConfig().schemaInstallPath(domain), `${name}.json`)
    const str = await fsp.readFile(installPath, 'utf8')
    return JSON.parse(str)
  } catch (e) {
    return undefined
  }
}

function isSchemaValid (obj: any): obj is APDLSchema {
  try {
    schemaValidator.assert(obj)
    return true
  } catch (e) {
    return false
  }
}

function assertSchemaValid (obj: any): asserts obj is APDLSchema {
  schemaValidator.assert(obj)
}

async function downloadSchemaFile (domain: string, name: string): Promise<void> {
  const obj = await (await fetch(`https://${domain}/.well-known/apdl/${name}.json`)).json()
  const installFolderPath = Config.getActiveConfig().schemaInstallPath(domain)
  await fsp.mkdir(installFolderPath, {recursive: true})
  await fsp.writeFile(path.join(installFolderPath, `${name}.json`), JSON.stringify(obj, null, 2), 'utf8')
}