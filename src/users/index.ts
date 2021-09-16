import { Config } from '../config.js'
import { User, NewUser, UserUpdate, UserSettings, UserSettingsUpdate } from '@atek-cloud/users-api'
import { users } from '@atek-cloud/adb-tables'
import { hashPassword } from '../lib/crypto.js'
import { install } from '../services/index.js'
import * as serverdb from '../serverdb/index.js'
import lock from '../lib/lock.js'

export async function getUser (userKey: string): Promise<User> {
  const record = await users(serverdb.get()).get(userKey)
  if (!record) throw new Error(`User not found under key ${userKey}`)
  return {
    key: record.key,
    username: record.value.username,
    role: record.value.role
  }
}

export async function createUser ({username, password, role}: NewUser): Promise<User> {
  const release = await lock('users:mutation')
  try {
    const {records} = await users(serverdb.get()).list()
    if (records.find((r: any) => r.value.username === username)) {
      throw new Error(`This username has already been taken`)
    }
    assertNotReserved(username)
    const record = await users(serverdb.get()).create({
      username,
      hashedPassword: await hashPassword(password),
      role,
      settings: {}
    })
    if (Config.getActiveConfig().defaultMainService) {
      try {
        const mainService = await install({
          sourceUrl: Config.getActiveConfig().defaultMainService
        }, record.key)
        record.value.settings.mainServiceId = mainService.id
        await users(serverdb.get()).put(record.key, record.value)
      } catch (e) {
        console.error('Failed to install main service for', username, 'during user creation')
        console.error(e)
      }
    }
    return {
      key: record.key,
      username: record.value.username,
      role: record.value.role
    }
  } finally {
    release()
  }
}

export async function updateUser (userKey: string, user: UserUpdate): Promise<User> {
  const release = await lock('users:mutation')
  try {
    const record = await users(serverdb.get()).get(userKey)
    if (!record) throw new Error(`User not found under key ${userKey}`)
    if (typeof user.username === 'string') {
      const {records} = await users(serverdb.get()).list()
      if (records.find((r: any) => r.value.username === user.username)) {
        throw new Error(`This username has already been taken`)
      }
      assertNotReserved(user.username)
      record.value.username = user.username
    }
    if (typeof user.password === 'string') record.value.hashedPassword = await hashPassword(user.password)
    if (typeof user.role === 'string') record.value.role = user.role
    await users(serverdb.get()).put(record.key, record.value)
    return {
      key: record.key,
      username: record.value.username,
      role: record.value.role
    }
  } finally {
    release()
  }
}

export async function deleteUser (userKey: string) {
  const release = await lock('users:mutation')
  try {
    await users(serverdb.get()).delete(userKey)
  } finally {
    release()
  }
}
export async function getUserSettings (userKey: string): Promise<UserSettings> {
  const record = await users(serverdb.get()).get(userKey)
  if (!record) throw new Error(`User not found under key ${userKey}`)
  return record.value.settings || {}
}

export async function updateUserSettings (userKey: string, settings: UserSettingsUpdate): Promise<UserSettings> {
  const release = await lock('users:mutation')
  try {
    const record = await users(serverdb.get()).get(userKey)
    if (!record) throw new Error(`User not found under key ${userKey}`)
    record.value.settings = record.value.settings || {}
    if (typeof settings.mainServiceId === 'string') record.value.settings.mainServiceId = settings.mainServiceId
    await users(serverdb.get()).put(record.key, record.value)
    return record.value.settings
  } finally {
    release()
  }
}

const RESERVED_USERNAMES = ['system']
function assertNotReserved (username: string) {
  if (RESERVED_USERNAMES.includes(username)) {
    throw new Error(`The username ${username} is reserved`)
  }
}
