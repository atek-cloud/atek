import { ConfigValues, DEFAULT_CORE_SERVICES } from './config.js'
import { InstallParams } from './services/index.js'
import { spawn, ChildProcess } from 'child_process'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { generateBearerToken } from './lib/crypto.js'
import { createApi } from './lib/rpc.js'

const INSPECTOR_ENABLED = false
const PORT = 10000

export class Config implements ConfigValues {
  domain?: string
  port?: number
  serverDbId?: string
  coreServices: InstallParams[] = [
    Object.assign({},
      DEFAULT_CORE_SERVICES.find(c => c.id === 'core.hyper-daemon'),
      {config: {SIMULATE_HYPERSPACE: '1'}}
    ),
    Object.assign({}, DEFAULT_CORE_SERVICES.find(c => c.id === 'core.adb'))
  ]
  defaultMainService = ''
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

export class TestInstance {
  url: string
  process: ChildProcess
  tmpdir: tmp.DirResult
  authToken: string

  constructor (url: string, process: ChildProcess, tmpdir: tmp.DirResult, authToken: string) {
    this.url = url
    this.process = process
    this.tmpdir = tmpdir
    this.authToken = authToken
  }

  api (apiDesc: string|NodeJS.Dict<string>, {noAuth} = {noAuth: false}) {
    return createApi(this.url, apiDesc, noAuth ? undefined : this.authToken)
  }

  async close () {
    const p = new Promise(r => {
      if (this.process.exitCode !== null) r(undefined)
      this.process.on('exit', r)
    })
    this.process.kill()
    await p
    this.tmpdir.removeCallback()
    await new Promise(r => setTimeout(r, 1e3))
  }
}

export async function startAtek (config: Config = new Config()) {
  const cfgDir = tmp.dirSync({unsafeCleanup: true})
  const cfgPath = path.join(cfgDir.name, 'config.json')
  const authToken = generateBearerToken()
  config.port = PORT
  config.systemAuthTokens = [authToken]
  fs.writeFileSync(cfgPath, JSON.stringify(config))

  const binPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bin.js')
  const env = Object.assign({}, process.env)
  env.CI = '1' // disables "interactive" CLI output
  if (INSPECTOR_ENABLED) env.NODE_OPTIONS = `--inspect=localhost:${PORT-1}`
  const serverProcess = spawn(
    'node',
    [binPath, 'run', '--configDir', cfgDir.name, '--port', String(PORT)],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      env
    }
  )

  const inspect = createApi(`http://localhost:${PORT}`, 'atek.cloud/inspect-api', authToken)
  let isReady = false
  for (let i = 0; i < 100; i++) {
    isReady = await inspect.call('isReady').then((v) => v, (err) => false)
    if (isReady) break
    await new Promise(r => setTimeout(r, 1e3))
  }
  if (!isReady) throw new Error('Server failed to start')

  return new TestInstance(`http://localhost:${PORT}`, serverProcess, cfgDir, authToken)
}
