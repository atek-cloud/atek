import path from 'path'
import getPort from 'get-port'
import { URL } from 'url'
import * as serverdb from '../serverdb/index.js'
import lock from '../lib/lock.js'

export async function getAvailableId (sourceUrl: string): Promise<string> {
  const release = await lock('service:get-available-id')
  try {
    const srvRecords = await serverdb.services.list()
    const urlp = new URL(sourceUrl)
    const pathname = urlp.pathname
    const basename = path.basename(pathname) || 'app'
    for (let i = 1; i < 1e9; i++) {
      const id = ((i === 1) ? basename : `${basename}-${i}`)
      if (!srvRecords.records.find(r => r.key == id)) {
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
    const srvRecords = await serverdb.services.list()
    for (let i = 1; i < 1e9; i++) {
      const port = await getPort()
      if (!srvRecords.records.find(r => r.value?.port == port)) {
        return port
      }
    }
    // also yikes if this happens
    throw new Error('Unable to find an available port for the app')
  } finally {
    release()
  }
}