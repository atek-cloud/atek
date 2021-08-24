import { ConfigValues } from '../../src/config.js'
import { spawn } from 'child_process'
import tmp from 'tmp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'
import jsonrpc from 'jsonrpc-lite'
import { generateBearerToken } from '../../src/lib/crypto.js'

const INSPECTOR_ENABLED = false
const PORT = 10000

export async function startAtek (config: ConfigValues = {}) {
  const cfgDir = tmp.dirSync({unsafeCleanup: true})
  const cfgPath = path.join(cfgDir.name, 'config.json')
  const authToken = generateBearerToken()
  config.systemAuthTokens = [authToken]
  fs.writeFileSync(cfgPath, JSON.stringify(config))

  const binPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'dist', 'bin.js')
  const serverProcess = spawn(
    'node',
    [binPath, 'start', '--configDir', cfgDir.name, '--port', String(PORT)],
    {
      stdio: [process.stdin, process.stdout, process.stderr],
      env: INSPECTOR_ENABLED ? Object.assign({}, process.env, {NODE_OPTIONS: `--inspect=localhost:${PORT-1}`}) : undefined
    }
  )

  const apis = {
    inspect: createRpc('atek.cloud/inspect-api', authToken)
  }
  let isReady = false
  for (let i = 0; i < 100; i++) {
    isReady = await apis.inspect('isReady').then((v) => v, (err) => false)
    if (isReady) break
    await new Promise(r => setTimeout(r, 1e3))
  }
  if (!isReady) throw new Error('Server failed to start')

  return {
    url: `http://localhost:${PORT}/`,
    apis,
    process: serverProcess,
    close: async () => {
      const p = new Promise(r => {
        if (serverProcess.exitCode !== null) r(undefined)
        serverProcess.on('exit', r)
      })
      serverProcess.kill()
      await p
      cfgDir.removeCallback()
    }
  }
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