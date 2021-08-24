import { ConfigValues } from './config.js'
import { InstallParams } from './services/index.js'
import { spawn, ChildProcess } from 'child_process'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import jsonrpc from 'jsonrpc-lite'
import { generateBearerToken } from './lib/crypto.js'

const INSPECTOR_ENABLED = false
const PORT = 10000

export class Config implements ConfigValues {
  domain?: string
  port?: number
  serverDbId?: string
  coreServices: InstallParams[] = [
    {
      sourceUrl: 'https://github.com/atek-cloud/hyper-daemon',
      config: {SIMULATE_HYPERSPACE: '1'}
    },
    {sourceUrl: 'https://github.com/atek-cloud/adb'}
  ]
  systemAuthTokens: string[] = []

  constructor (opts?: ConfigValues) {
    if (opts) {
      Object.assign(this, opts)
    }
  }

  addCoreService (desc: InstallParams) {
    this.coreServices.push(desc)
  }
}

export interface TestAPIs {
  [key: string]: (method: string, params: any[]) => Promise<any>
}

export class TestInstance {
  url: string
  apis: TestAPIs
  process: ChildProcess
  tmpdir: tmp.DirResult

  constructor (url: string, apis: TestAPIs, process: ChildProcess, tmpdir: tmp.DirResult) {
    this.url = url
    this.apis = apis
    this.process = process
    this.tmpdir = tmpdir
  }

  async close () {
    const p = new Promise(r => {
      if (this.process.exitCode !== null) r(undefined)
      this.process.on('exit', r)
    })
    this.process.kill()
    await p
    this.tmpdir.removeCallback()
  }
}

export async function startAtek (config: Config = new Config()) {
  const cfgDir = tmp.dirSync({unsafeCleanup: true})
  const cfgPath = path.join(cfgDir.name, 'config.json')
  const authToken = generateBearerToken()
  config.systemAuthTokens = [authToken]
  fs.writeFileSync(cfgPath, JSON.stringify(config))

  const binPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bin.js')
  const serverProcess = spawn(
    'node',
    [binPath, 'start', '--configDir', cfgDir.name, '--port', String(PORT)],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      env: INSPECTOR_ENABLED ? Object.assign({}, process.env, {NODE_OPTIONS: `--inspect=localhost:${PORT-1}`}) : undefined
    }
  )

  const apis = {
    inspect: createRpc('atek.cloud/inspect-api', authToken),
    adb: createRpc('atek.cloud/adb-api', authToken)
  }
  let isReady = false
  for (let i = 0; i < 100; i++) {
    isReady = await apis.inspect('isReady').then((v) => v, (err) => false)
    if (isReady) break
    await new Promise(r => setTimeout(r, 1e3))
  }
  if (!isReady) throw new Error('Server failed to start')

  return new TestInstance(`http://localhost:${PORT}/`, apis, serverProcess, cfgDir)
}

let _id = 1
function createRpc (api: string, authToken: string) {
  const url = `http://localhost:${PORT}/_api/gateway?api=${api}`

  return async (methodName: string, params: any[] = []): Promise<any> => {
    const responseBody = await (await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authentication': `Bearer ${authToken}`},
      body: JSON.stringify(jsonrpc.request(_id++, methodName, params))
    })).json()
    const parsed = jsonrpc.parseObject(responseBody)
    if (parsed.type === 'error') {
      throw parsed.payload.error
    } else if (parsed.type === 'success') {
      return parsed.payload.result
    }
  }
}