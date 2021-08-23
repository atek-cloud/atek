import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { InstallParams } from './services/index.js'

export const DEFAULT_REPL_PORT = 2999
export const DEFAULT_HOST_PORT = 3000
let _activeConfig: Config | undefined = undefined

const DEFAULT_CORE_SERVICES: InstallParams[] = [
  {
    sourceUrl: 'https://github.com/atek-cloud/hyper-daemon',
    config: {
      SIMULATE_HYPERSPACE: '0',
      HYPERSPACE_HOST: undefined,
      HYPERSPACE_STORAGE: undefined
    }
  },
  {
    sourceUrl: 'https://github.com/atek-cloud/adb'
  }
]

export interface ConfigValues {
  domain?: string
  port?: number
  debugMode?: boolean
  simulateHyperspace?: boolean
  hyperspaceHost?: string
  hyperspaceStorage?: string
  serverDbId?: string
  coreServices?: InstallParams[]
}

export class Config implements ConfigValues {
  configDir: string
  values: ConfigValues
  overrides: ConfigValues
  error: Error | undefined

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
    this.error = undefined
    this.read()

    this.overrides = opts
  }

  get filePath () {
    return path.join(this.configDir, 'config.json')
  }

  packageInstallPath (id: string): string {
    return path.join(this.configDir, 'packages', id)
  }

  serviceLogPath (id: string): string {
    return path.join(this.configDir, 'logs', `${id}.log`)
  }

  schemaInstallPath (domain: string): string {
    return path.join(this.configDir, 'schemas', domain)
  }

  get domain () {
    return this.overrides.domain || this.values.domain || undefined
  }

  get port () {
    return this.overrides.port || this.values.port || DEFAULT_HOST_PORT
  }

  get debugMode () {
    return this.overrides.debugMode || this.values.debugMode || false
  }

  get simulateHyperspace () {
    return this.overrides.simulateHyperspace || this.values.simulateHyperspace || undefined
  }

  get hyperspaceHost () {
    return this.overrides.hyperspaceHost || this.values.hyperspaceHost || undefined
  }

  get hyperspaceStorage () {
    return this.overrides.hyperspaceStorage || this.values.hyperspaceStorage || path.join(os.homedir(), '.hyperspace/storage')
  }

  get serverDbId () {
    return this.overrides.serverDbId || this.values.serverDbId || undefined
  }

  get coreServices () {
    return this.overrides.coreServices || this.values.coreServices || DEFAULT_CORE_SERVICES
  }

  isOverridden (key: string): boolean {
    return (key in this.overrides)
  }

  read () {
    this.error = undefined
    try {
      this.values = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
    } catch (e) {
      this.error = e
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