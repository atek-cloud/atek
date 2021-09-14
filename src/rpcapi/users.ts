import { AtekRpcServer } from '@atek-cloud/node-rpc'
import { createServer, User, NewUser, UserUpdate } from '@atek-cloud/users-api'
import { users } from '@atek-cloud/adb-tables'
import * as serverdb from '../serverdb/index.js'
import { hashPassword } from '../lib/crypto.js'
import lock from '../lib/lock.js'

// TODO auth

export function setup (): AtekRpcServer  {
  return createServer({
    // List current users
    async list (): Promise<{users: User[]}> {
      const {records} = await users(serverdb.get()).list()
      return {
        users: records.map((record: any) => ({
          key: record.key,
          username: record.value.username,
          role: record.value.role
        }))
      }
    },
  
    // Get a user
    async get (userKey: string): Promise<User> {
      const record = await users(serverdb.get()).get(userKey)
      if (!record) throw new Error(`User not found under key ${userKey}`)
      return {
        key: record.key,
        username: record.value.username,
        role: record.value.role
      }
    },
  
    // Create a user
    async create (user: NewUser): Promise<User> {
      const release = await lock('users-api:mutation')
      try {
        const {records} = await users(serverdb.get()).list()
        if (records.find((r: any) => r.value.username === user.username)) {
          throw new Error(`This username has already been taken`)
        }
        const record = await users(serverdb.get()).create({
          username: user.username,
          hashedPassword: await hashPassword(user.password),
          role: user.role
        })
        return {
          key: record.key,
          username: record.value.username,
          role: record.value.role
        }
      } finally {
        release()
      }
    },
  
    // Update a user
    async update (userKey: string, user: UserUpdate): Promise<User> {
      const release = await lock('users-api:mutation')
      try {
        const record = await users(serverdb.get()).get(userKey)
        if (!record) throw new Error(`User not found under key ${userKey}`)
        if (typeof user.username === 'string') record.value.username = user.username
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
    },
  
    // Delete a user
    async delete (userKey: string): Promise<void> {
      const release = await lock('users-api:mutation')
      try {
        await users(serverdb.get()).delete(userKey)
      } finally {
        release()
      }
    }
  })
}