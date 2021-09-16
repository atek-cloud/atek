import { AtekRpcServer } from '@atek-cloud/node-rpc'
import { createServer, UserSession, UserCreds } from '@atek-cloud/user-sessions-api'
import { users } from '@atek-cloud/adb-tables'
import * as serverdb from '../serverdb/index.js'
import { verifyPassword } from '../lib/crypto.js'

export function setup (): AtekRpcServer  {
  return createServer({
    // Get the current session
    whoami (): UserSession {
      if (this.session.isUserAuthed()) {
        return {
          isActive: true,
          username: this.session.auth.username
        }
      }
      return {isActive: false}
    },
  
    // Create a new session
    async login (creds: UserCreds): Promise<UserSession> {
      const {records} = await users(serverdb.get()).list()
      const record = records.find((record: any) => record.value.username === creds.username)
      if (!record) throw new Error('Username or password was incorrect')
      if (!(await verifyPassword(creds.password, record.value.hashedPassword))) {
        throw new Error('Username or password was incorrect')
      }
      await this.session.create({
        userKey: record.key,
        username: record.value.username
      })
      return {
        isActive: true,
        username: record.value.username
      }
    },
  
    // End the current session
    async logout (): Promise<void> {
      await this.session.destroy()
    }
  })
}