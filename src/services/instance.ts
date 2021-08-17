import { EventEmitter } from 'events'
import * as childProcess from 'child_process'
import * as path from 'path'
import { promises as fsp, createWriteStream, WriteStream } from 'fs'
import { fileURLToPath } from 'url'
import { Config } from '../lib/config.js'
import { generateBearerToken } from '../lib/crypto.js'
import lock from '../lib/lock.js'
import fetch from 'node-fetch'
import AtekService, { ServiceManifest, ApiExportDesc } from '../gen/atek.cloud/service'

const INSTALL_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DENO_PATH = path.join(INSTALL_PATH, 'bin', 'deno')

interface TODO {}

export interface ServiceConfig {
  [key: string]: string | undefined
}

export class ServiceInstance extends EventEmitter {
  settings: AtekService
  protected config: ServiceConfig
  protected process: childProcess.ChildProcess | undefined
  protected logFileStream: WriteStream | undefined
  bearerToken: string

  constructor (settings: AtekService) {
    super()
    this.settings = settings
    this.config = {}
    this.process = undefined
    this.logFileStream = undefined
    this.bearerToken = generateBearerToken()
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

  getScriptPath (ext: string): string {
    if (this.settings.package.sourceType === 'file') {
      const folderPath = fileURLToPath(this.settings.sourceUrl)
      return path.join(folderPath, `index.${ext}`)
    }
    if (this.settings.package.sourceType === 'git') {
      const cfg = Config.getActiveConfig()
      if (cfg) {
        const folderPath = cfg.packageInstallPath(this.id)
        return path.join(folderPath, `index.${ext}`)
      } else {
        throw new Error('No active configuration is set')
      }
    }
    throw new Error('Unknown package source type: ' + this.settings.package.sourceType)
  }

  lockServiceCtrl () {
    return lock(`service:${this.id}:process-ctrl`)
  }

  toJSON (): object {
    return {
      isActive: this.isActive,
      ...this.settings
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
      const hostcfg = Config.getActiveConfig()
      if (!hostcfg) throw new Error('No active host configuration set')

      let scriptPath = ''
      if (await fsp.stat(this.getScriptPath('ts')).catch(e => undefined)) {
        scriptPath = this.getScriptPath('ts')
      } else if (await fsp.stat(this.getScriptPath('js')).catch(e => undefined)) {
        scriptPath = this.getScriptPath('js')
      } else {
        throw new Error('Package issue: index.js and index.ts not found.')
      }
      const args = [
        'run',
        `--location=http://${this.id}.localhost:${this.settings.port}`,
        `--allow-net=0.0.0.0:${this.settings.port},localhost:${hostcfg.port}`,
        `--allow-env=SELF_ASSIGNED_PORT,SELF_HOST_PORT,SELF_HOST_BEARER_TOKEN`,
        '--reload', // TODO: more intelligent cache invalidation behavior (this is really only needed when remote imports are expected to change, ie when developing the host env api)
        scriptPath
      ]
      const opts = {
        env: Object.assign({}, this.config, {
          SELF_ASSIGNED_PORT: String(this.settings.port),
          SELF_HOST_PORT: String(hostcfg.port),
          SELF_HOST_BEARER_TOKEN: this.bearerToken
        }) as NodeJS.ProcessEnv
      }
      this.log('----------------------')
      this.log(`Starting service process ${this.id}`)
      this.log(`  Path: ${scriptPath}`)
      this.log(`  External port: ${this.port}`)
      this.log(`  Call: deno ${args.join(' ')}`)
      this.log(`  Env: ${JSON.stringify(opts.env)}`)
      this.log('----------------------')
      this.process = childProcess.spawn(DENO_PATH, args, opts)
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
      this.emit('start')
    } finally {
      release()
    }
  }

  async stop (): Promise<void> {
    this.log('Stop() triggered')
    const release = await this.lockServiceCtrl()
    try {
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

  // async handleRpc (callDesc: TODO, methodName: string, params: any[]): Promise<any> {
  //   const apiDesc = this.exportedApis.find(apiDesc => apiDesc.api === callDesc.api)
  //   if (!apiDesc) throw new TodoError('API not found')
  //   // TODO: json-rpc to the service
  // }
}

const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g
function stripANSICodes (str: string): string {
  return str.replace(ANSI_REGEX, '')
}