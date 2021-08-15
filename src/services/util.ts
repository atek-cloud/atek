import path from 'path'
import getPort from 'get-port'
// import * as db from '../db/index.js' TODO
import lock from '../lib/lock.js'

export async function getAvailableId (sourceUrl: string): Promise<string> {
  const release = await lock('service:get-available-id')
  try {
    const srvRecords = []//await db.privateServerDb.apps.list() TODO
    const urlp = new URL(sourceUrl)
    const pathname = urlp.pathname
    const basename = path.basename(pathname) || 'app'
    for (let i = 1; i < 1e9; i++) {
      let id = ((i === 1) ? basename : `${basename}-${i}`)
      if (!srvRecords.find(r => r.key == id)) {
        return id
      }
    }
    // yikes if this happens
    throw new Error('Unable to find an available ID for the app')
  } finally {
    release()
  }
}

export async function getAvailablePort (): Promise<number> {
  const release = await lock('service:get-available-port')
  try {
    const srvRecords = []//await db.privateServerDb.apps.list() TODO
    for (let i = 1; i < 1e9; i++) {
      let port = await getPort()
      if (!srvRecords.find(r => r.value.port == port)) {
        return port
      }
    }
    // also yikes if this happens
    throw new Error('Unable to find an available port for the app')
  } finally {
    release()
  }
}