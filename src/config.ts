import * as path from 'path'
import * as fs from 'fs'
import { InstallParams } from './services/index.js'

export const DEFAULT_HOST_PORT = 80
let _activeConfig: Config | undefined = undefined

export const DEFAULT_CORE_SERVICES: InstallParams[] = [
  {id: 'core.hyper-daemon', sourceUrl: 'https://github.com/atek-cloud/hyper-daemon', desiredVersion: '2.0.0'},
  {id: 'core.adb',          sourceUrl: 'https://github.com/atek-cloud/adb',          desiredVersion: '1.0.1'}
]
const DEFAULT_DEFAULT_MAIN_SERVICE = 'https://github.com/atek-cloud/lonestar' // that's right. default default. it's the default for the default.

export interface ConfigValues {
  domain?: string
  port?: number
  serverDbId?: string
  coreServices?: InstallParams[]
  defaultMainService?: string
  systemAuthTokens?: string[]
}

export class Config implements ConfigValues {
  configDir: string
  values: ConfigValues
  overrides: ConfigValues

  static setActiveConfig (cfg: Config) {
    _activeConfig = cfg
  }

  static getActiveConfig (): Config {
    if (!_activeConfig) throw new Error('No active host environment config set')
    return _activeConfig
  }

  constructor (configDir: string, opts: ConfigValues) {
    this.configDir = configDir
    this.values = <ConfigValues>{}
    this.read()
    this.overrides = opts
  }

  get filePath () {
    return path.join(this.configDir, 'config.json')
  }

  packageInstallPath (id: string): string {
    return path.join(this.configDir, 'packages', id)
  }

  serviceSocketFilePath (id: string): string {
    return path.join(this.configDir, 'sockets', `${id}.sock`)
  }

  serviceLogPath (id: string): string {
    return path.join(this.configDir, 'logs', `${id}.log`)
  }

  get domain () {
    return fallbacks(this.overrides.domain, this.values.domain, 'localhost')
  }

  get port () {
    return fallbacks(this.overrides.port, this.values.port, DEFAULT_HOST_PORT)
  }

  get serverDbId () {
    return fallbacks(this.overrides.serverDbId, this.values.serverDbId, undefined)
  }

  get coreServices () {
    return fallbacks(this.overrides.coreServices, this.values.coreServices, DEFAULT_CORE_SERVICES)
  }

  get defaultMainService () {
    return fallbacks(this.overrides.defaultMainService, this.values.defaultMainService, DEFAULT_DEFAULT_MAIN_SERVICE)
  }

  get systemAuthTokens () {
    return fallbacks(this.overrides.systemAuthTokens, this.values.systemAuthTokens, [])
  }

  isOverridden (key: string): boolean {
    return (key in this.overrides)
  }

  read () {
    let str
    try {
      str = fs.readFileSync(this.filePath, 'utf8')
    } catch (e) {
      // config doesnt exist, create it
      this.values = {}
      return
    }
    try {
      this.values = JSON.parse(str)
    } catch (e: any) {
      console.error('Failed to read config file', this.filePath)
      console.error(e)
      process.exit(1)
    }
  }

  update (values: ConfigValues) {
    Object.assign(this.values, values)
    this.write()
  }

  write () {
    try { fs.mkdirSync(this.configDir) } catch (e) {}
    fs.writeFileSync(this.filePath, JSON.stringify(this.values, null, 2), 'utf8')
  }
}

function fallbacks (...params: any[]): any {
  for (const param of params) {
    if (typeof param !== 'undefined') {
      return param
    }
  }
  return undefined
}