import path from 'path'
import getPort from 'get-port'
import { URL } from 'url'
import * as serverdb from '../serverdb/index.js'
import lock from '../lib/lock.js'
import { Config } from '../config.js'
import { Record } from '@atek-cloud/api-broker/dist/adb-client.js'
import Service from '../gen/atek.cloud/service.js'

export function sourceUrlToId (sourceUrl: string) {
  const urlp = new URL(sourceUrl)
  const pathname = urlp.pathname
  return path.basename(pathname) || 'service'
}

export async function getServiceRecordById (id: string): Promise<Record<Service>> {
  // TODO this should be a value that's automatically indexed by adb -prf
  const srvRecords = (await serverdb.services.list()).records
  const srvRecord = srvRecords.find(r => r.value.id === id)
  if (!srvRecord) throw new Error(`Service not found with id=${id}`)
  return srvRecord
}

export async function getAvailableId (sourceUrl: string): Promise<string> {
  const release = await lock('service:get-available-id')
  try {
    const srvRecords = await serverdb.services.list()
    const basename = sourceUrlToId(sourceUrl)
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

export async function getAvailablePort (isCore = false): Promise<number> {
  const cfg = Config.getActiveConfig()
  const basePort = Math.max(cfg.port, 1024)
  const release = await lock('service:get-available-port')
  try {
    const srvRecords = !isCore ? await serverdb.services.list() : {records: []}
    for (let i = 1; i < 1e9; i++) {
      const port = await getPort({port: isCore ? getPort.makeRange(basePort, basePort + 4999) : getPort.makeRange(basePort + 5000, 65535)})
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