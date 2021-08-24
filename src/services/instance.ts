import { EventEmitter } from 'events'
import * as childProcess from 'child_process'
import * as path from 'path'
import { promises as fsp, createWriteStream, WriteStream } from 'fs'
import { fileURLToPath } from 'url'
import { Config } from '../config.js'
import { generateBearerToken } from '../lib/crypto.js'
import { joinPath } from '../lib/strings.js'
import lock from '../lib/lock.js'
import fetch from 'node-fetch'
import WebSocket, { createWebSocketStream } from 'ws'
import jsonrpc from 'jsonrpc-lite'
import { ServiceConfig } from './index.js'
import AtekService, { ServiceManifest, ApiExportDesc, RuntimeEnum } from '../gen/atek.cloud/service.js'
import { ServiceInfo, StatusEnum } from '../gen/atek.cloud/services-api.js'
import * as apiBroker from '@atek-cloud/api-broker'

const INSTALL_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DENO_PATH = path.join(INSTALL_PATH, 'bin', 'deno')
const NODE_PATH = process.execPath

let _id = 1 // json-rpc ID incrementer

export class ServiceInstance extends EventEmitter {
  settings: AtekService
  protected config: ServiceConfig
  protected process: childProcess.ChildProcess | undefined
  protected logFileStream: WriteStream | undefined
  bearerToken: string

  constructor (settings: AtekService, config?: ServiceConfig) {
    super()
    this.settings = settings
    this.config = {}
    this.process = undefined
    this.logFileStream = undefined
    this.bearerToken = generateBearerToken()
    if (config) this.setConfig(config)
  }

  get isActive (): boolean {
    return !!this.process
  }

  get id (): string {
    return this.settings.id
  }

  get port (): number {
    return this.settings.port
  }

  get manifest (): ServiceManifest {
    return this.settings.manifest || {}
  }

  get exportedApis (): ApiExportDesc[] {
    return Array.isArray(this.manifest?.exports) ? this.manifest?.exports : []
  }

  setConfig (config: ServiceConfig) {
    config = Object.assign({}, config)
    for (const k in config) {
      if (k.toUpperCase() !== k) {
        const v = config[k]
        config[k.toUpperCase()] = v
        delete config[k]
      }
    }
    this.config = config
  }

  getConfig (): ServiceConfig {
    return this.config
  }

  getPackagePath (str: string): string {
    if (this.settings.package.sourceType === 'file') {
      const folderPath = fileURLToPath(this.settings.sourceUrl)
      return path.join(folderPath, str)
    }
    if (this.settings.package.sourceType === 'git') {
      const folderPath = Config.getActiveConfig().packageInstallPath(this.id)
      return path.join(folderPath, str)
    }
    throw new Error('Unknown package source type: ' + this.settings.package.sourceType)
  }

  lockServiceCtrl () {
    return lock(`service:${this.id}:process-ctrl`)
  }

  toJSON (): ServiceInfo {
    return {
      status: this.isActive ? StatusEnum.active : StatusEnum.inactive,
      settings: this.settings
    }
  }

  log (str: string, tag = 'SYS') {
    if (!this.logFileStream) {
      const cfg = Config.getActiveConfig()
      if (cfg) {
        this.logFileStream = createWriteStream(cfg.serviceLogPath(this.id), {flags: 'a', encoding: 'utf8'})
      }
    }
    console.log(`[${tag} ${this.id}] ${str.replace(/(\n)+$/g, '')}`)
    this.logFileStream?.write(`[${tag} ${(new Date()).toLocaleString()}] ${str}\n`)
  }

  async setup (): Promise<void> {
    // TODO needed?
  }

  async start (): Promise<void> {
    this.log('Start() triggered')
    const release = await this.lockServiceCtrl()
    try {
      if (this.process) return

      if (this.manifest.runtime === RuntimeEnum.node) {
        this.process = await this.startNodeProcess()
      } else {
        this.process = await this.startDenoProcess()
      }
      if (!this.process) throw new Error('Failed to start process')

      this.process
        .on('error', (...args) => this.emit('error', ...args))
        .on('close', () => {
          this.log('Service process closed')
          this.process = undefined
          this.emit('stop')
        })
      if (this.process.stdout) {
        this.process.stdout.on('data', data => this.log(stripANSICodes(data.toString('utf8')), 'LOG'))
      }
      if (this.process.stderr) {
        this.process.stderr.on('data', data => this.log(stripANSICodes(data.toString('utf8')), 'ERR'))
      }
      await this.awaitServerActive()

      for (const apiDesc of this.exportedApis) {
        apiBroker.registerProvider(this, (apiDesc.transport || 'rpc') as apiBroker.TransportEnum, apiDesc.api)
      }

      this.emit('start')
    } finally {
      release()
    }
  }

  async stop (): Promise<void> {
    this.log('Stop() triggered')
    const release = await this.lockServiceCtrl()
    try {
      apiBroker.unregisterProviderAll(this)
      if (this.process) {
        let p = new Promise(r => {
          this.once('stop', r)
        })
        this.process.kill()
        await p
      }
    } finally {
      release()
    }
  }

  async restart (): Promise<void> {
    this.log('Restart() triggered')
    await this.stop()
    await this.start()
  }

  async awaitServerActive (): Promise<boolean> {
    for (let i = 0; i < 100; i++) {
      try {
        let res = await fetch(`http://localhost:${this.settings.port}/`, {method: 'HEAD'})
        await res.text()
        if (res.ok) return true
      } catch (e) {}
      await new Promise(r => setTimeout(r, 100))
    }
    return false
  }

  async handleRpc (callDesc: apiBroker.CallDescription, methodName: string, params: unknown[]): Promise<unknown> {
    const apiDesc = this.exportedApis.find(apiDesc => apiDesc.api === callDesc.api && (!apiDesc.transport || apiDesc.transport === 'rpc'))
    if (apiDesc) {
      const path = apiDesc.path || '/'
      const url = joinPath(`http://localhost:${this.port}`, path)
      const responseBody = await (await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(jsonrpc.request(_id++, methodName, params))
      })).json()
      const parsed = jsonrpc.parseObject(responseBody)
      if (parsed.type === 'error') {
        throw parsed.payload.error
      } else if (parsed.type === 'success') {
        return parsed.payload.result
      } else {
        return undefined
      }
    }
    throw new apiBroker.ServiceNotFound('API not found')
  }

  handleProxy (callDesc: apiBroker.CallDescription, socket: WebSocket) {
    const apiDesc = this.exportedApis.find(apiDesc => apiDesc.api === callDesc.api && apiDesc.transport === 'proxy')
    if (apiDesc) {
      const remoteSocket = new WebSocket(`ws://localhost:${this.port}${apiDesc.path || '/'}`)
      const s1 = createWebSocketStream(socket)
      const s2 = createWebSocketStream(remoteSocket)
      s1.pipe(s2).pipe(s1)
    } else {
      throw new apiBroker.ServiceNotFound('API not found')
    }
  }

  async startDenoProcess (): Promise<childProcess.ChildProcess> {
    const hostcfg = Config.getActiveConfig()

    let scriptPath = ''
    if (await fsp.stat(this.getPackagePath('index.ts')).catch(e => undefined)) {
      scriptPath = this.getPackagePath('index.ts')
    } else if (await fsp.stat(this.getPackagePath('index.js')).catch(e => undefined)) {
      scriptPath = this.getPackagePath('index.js')
    } else {
      throw new Error('Package issue: index.js and index.ts not found.')
    }
    const args = [
      'run',
      `--location=http://${this.id}.localhost:${this.settings.port}`,
      `--allow-net=0.0.0.0:${this.settings.port},localhost:${hostcfg.port}`,
      `--allow-env=ATEK_ASSIGNED_PORT,ATEK_HOST_PORT,ATEK_HOST_BEARER_TOKEN`,
      '--reload', // TODO: more intelligent cache invalidation behavior (this is really only needed when remote imports are expected to change, ie when developing the host env api)
      scriptPath
    ]
    const opts = {
      env: Object.assign({}, this.config, {
        ATEK_ASSIGNED_PORT: String(this.settings.port),
        ATEK_HOST_PORT: String(hostcfg.port),
        ATEK_HOST_BEARER_TOKEN: this.bearerToken
      }) as NodeJS.ProcessEnv
    }
    this.log('----------------------')
    this.log(`Starting service process ${this.id}`)
    this.log(`  Path: ${scriptPath}`)
    this.log(`  External port: ${this.port}`)
    this.log(`  Call: ${DENO_PATH} ${args.join(' ')}`)
    this.log(`  Env: ${JSON.stringify(opts.env)}`)
    this.log('----------------------')
    return childProcess.spawn(DENO_PATH, args, opts)
  }

  async startNodeProcess (): Promise<childProcess.ChildProcess> {
    const hostcfg = Config.getActiveConfig()

    let packageJson
    try {
      packageJson = JSON.parse(await fsp.readFile(this.getPackagePath('package.json'), 'utf8'))
    } catch (e) {}

    let scriptPath = ''
    if (packageJson?.main && await fsp.stat(this.getPackagePath(packageJson?.main)).catch(e => undefined)) {
      scriptPath = this.getPackagePath(packageJson?.main)
    } else if (await fsp.stat(this.getPackagePath('index.js')).catch(e => undefined)) {
      scriptPath = this.getPackagePath('index.js')
    } else {
      throw new Error('Package issue: neither package.json "main" nor /index.js could be found.')
    }
    const args = [
      scriptPath
    ]
    const opts = {
      env: Object.assign({}, this.config, {
        ATEK_ASSIGNED_PORT: String(this.settings.port),
        ATEK_HOST_PORT: String(hostcfg.port),
        ATEK_HOST_BEARER_TOKEN: this.bearerToken
      }) as NodeJS.ProcessEnv
    }
    this.log('----------------------')
    this.log(`Starting service process ${this.id}`)
    this.log(`  WARNING: No sandbox is present. This application has full access to the host system.`)
    this.log(`  Path: ${scriptPath}`)
    this.log(`  External port: ${this.port}`)
    this.log(`  Call: ${NODE_PATH} ${args.join(' ')}`)
    this.log(`  Env: ${JSON.stringify(opts.env)}`)
    this.log('----------------------')
    return childProcess.spawn(NODE_PATH, args, opts)
  }
}

const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
function stripANSICodes (str: string): string {
  return str.replace(ANSI_REGEX, '')
}