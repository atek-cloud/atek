import InspectApiServer from '../gen/atek.cloud/inspect-api.server.js'
import { Config } from '../config.js'

export function setup () {
  return new InspectApiServer({
    isReady: () => true,
    getConfig: () => Config.getActiveConfig().values
  })
}