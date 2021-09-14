import { Config } from '../config.js'
import adb, { AdbDatabase } from '@atek-cloud/adb-api'
import * as tables from '@atek-cloud/adb-tables'

// globals
// =

export let serverdb: AdbDatabase|undefined = undefined

// exported api
// =

export async function setup () {
  const cfg = Config.getActiveConfig()
  if (!cfg.serverDbId) throw new Error('Unable to setup host database: no server DB configured')
  serverdb = adb.db(cfg.serverDbId)
  await Promise.all([
    tables.databases(serverdb).isReady,
    tables.services(serverdb).isReady,
    tables.users(serverdb).isReady,
    tables.userSessions(serverdb).isReady
  ])
}

export function get (): AdbDatabase {
  if (!serverdb) throw new Error('Server Database not yet available')
  return serverdb
}