import { Config } from '../lib/config.js'
import AdbApiClient from '../gen/atek.cloud/adb-api.js'
import { AccountTable } from '../gen/atek.cloud/account.js'
import { AccountSessionTable } from '../gen/atek.cloud/account-session.js'
import { DatabaseTable } from '../gen/atek.cloud/database.js'
import { ServiceTable } from '../gen/atek.cloud/service.js'

// globals
// =

export const api = new AdbApiClient()
export const accounts = new AccountTable(api)
export const accountSessions = new AccountSessionTable(api)
export const databases = new DatabaseTable(api)
export const services = new ServiceTable(api)

// exported api
// =

export async function setup () {
  const cfg = Config.getActiveConfig()
  if (!cfg.serverDbId) throw new Error('Unable to setup host database: no server DB configured')
  await Promise.all([
    accounts.register(cfg.serverDbId),
    accountSessions.register(cfg.serverDbId),
    databases.register(cfg.serverDbId),
    services.register(cfg.serverDbId)
  ])
}