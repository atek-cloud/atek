import path from 'path'
import { URL } from 'url'
import * as serverdb from '../serverdb/index.js'
import lock from '../lib/lock.js'
import { Record } from '@atek-cloud/adb-api'
import { services, Service } from '@atek-cloud/adb-tables'
import { Session } from '../httpapi/session-middleware.js'
import { getByKey } from './index.js'
import { User } from '@atek-cloud/adb-tables'

export function sourceUrlToId (sourceUrl: string) {
  const urlp = new URL(sourceUrl)
  const pathname = urlp.pathname
  return path.basename(pathname) || 'service'
}

export async function getServiceRecordById (id: string): Promise<Record<Service>> {
  // TODO this should be a value that's automatically indexed by adb -prf
  const srvRecords = (await services(serverdb.get()).list()).records
  const srvRecord = srvRecords.find((r: Record<Service>) => r.value.id === id)
  if (!srvRecord) throw new Error(`Service not found with id=${id}`)
  return srvRecord
}

export async function getAvailableId (sourceUrl: string): Promise<string> {
  const release = await lock('service:get-available-id')
  try {
    const srvRecords = await services(serverdb.get()).list()
    const basename = sourceUrlToId(sourceUrl)
    for (let i = 1; i < 1e9; i++) {
      const id = ((i === 1) ? basename : `${basename}-${i}`)
      if (!srvRecords.records.find((r: Record<Service>) => r.key == id)) {
        return id
      }
    }
    // yikes if this happens
    throw new Error('Unable to find an available ID for the app')
  } finally {
    release()
  }
}

interface Headers {
  [key: string]: string
}
export function getAuthHeaders (session?: Session): Headers {
  const authHeaders: Headers = {}
  if (session?.isAuthed()) {
    const auth = session?.auth
    if (auth?.serviceKey) {
      authHeaders['Atek-Auth-Service'] = auth.serviceKey
      const service = getByKey(auth.serviceKey)
      if (service) {
        authHeaders['Atek-Auth-User'] = service.owningUserKey
      }
    } else if (auth?.userKey) {
      authHeaders['Atek-Auth-User'] = auth.userKey
    }
  }
  return authHeaders
}