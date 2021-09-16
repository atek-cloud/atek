import { AtekRpcServer } from '@atek-cloud/node-rpc'
import { createServer, User, NewUser, UserUpdate, UserSettings, UserSettingsUpdate } from '@atek-cloud/users-api'
import { users } from '@atek-cloud/adb-tables'
import * as serverdb from '../serverdb/index.js'
import { getUser, createUser, updateUser, deleteUser, getUserSettings, updateUserSettings } from '../users/index.js'

export function setup (): AtekRpcServer  {
  return createServer({
    // List current users
    async list (): Promise<{users: User[]}> {
      this.session.assertIsAdminAuthed()
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
    get (userKey: string): Promise<User> {
      if (!this.session.isAdminAuthed()) {
        if (this.session.auth?.userKey !== userKey) {
          throw new Error('Not authorized')
        }
      }
      return getUser(userKey)
    },
  
    // Create a user
    create (user: NewUser): Promise<User> {
      this.session.assertIsAdminAuthed()
      return createUser(user)
    },
  
    // Update a user
    update (userKey: string, user: UserUpdate): Promise<User> {
      this.session.assertIsAdminAuthed()
      return updateUser(userKey, user)
    },
  
    // Delete a user
    delete (userKey: string): Promise<void> {
      this.session.assertIsAdminAuthed()
      return deleteUser(userKey)
    },

    // Get a user's settings
    getSettings (userKey: string): Promise<UserSettings> {
      if (!this.session.isAdminAuthed()) {
        if (this.session.auth?.userKey !== userKey) {
          throw new Error('Not authorized')
        }
      }
      return getUserSettings(userKey)
    },
    
    // Get a user's settings
    updateSettings (userKey: string, settings: UserSettingsUpdate): Promise<UserSettings> {
      if (!this.session.isAdminAuthed()) {
        if (this.session.auth?.userKey !== userKey) {
          throw new Error('Not authorized')
        }
      }
      return updateUserSettings(userKey, settings)
    }
  })
}