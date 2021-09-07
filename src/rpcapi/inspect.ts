import { createServer } from '@atek-cloud/inspect-api'
import { Config } from '../config.js'

export function setup () {
  return createServer({
    isReady: () => true,
    getConfig: () => Config.getActiveConfig().values
  })
}