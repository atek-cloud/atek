import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Config } from '../config.js'
import * as serverdb from '../serverdb/index.js'
import { users, userSessions } from '@atek-cloud/adb-tables'
import * as services from '../services/index.js'

const bindSessionTokens = new Map<string, string>()

export interface SessionAuth {
  sessionId?: string
  userKey?: string
  username?: string
  serviceKey?: string
  role?: string
}

export interface RequestWithSession extends express.Request {
  session?: Session
}

export class Session {
  req: express.Request | undefined
  res: express.Response | undefined
  auth: SessionAuth | undefined

  constructor (req: RequestWithSession | undefined, res: express.Response | undefined, auth: SessionAuth | undefined) {
    this.req = req
    this.res = res
    this.auth = auth
  }

  isAuthed (): boolean {
    return Boolean(this.auth && (this.auth.userKey || this.auth.serviceKey))
  }
  
  assertIsAuthed () {
    if (!this.isAuthed()) throw new Error('Not authorized')
  }

  isAppAuthed (): boolean {
    return Boolean(this.auth && this.auth.serviceKey)
  }
  
  assertIsAppAuthed () {
    if (!this.isAppAuthed()) throw new Error('Not authorized')
  }

  isAccountAuthed (): boolean {
    return Boolean(this.auth && this.auth.userKey)
  }
  
  assertIsAccountAuthed () {
    if (!this.isAccountAuthed()) throw new Error('Not authorized')
  }

  isAdminAuthed (): boolean {
    return this.isAccountAuthed() && (this.auth?.userKey === 'system' || this.auth?.role === 'admin')
  }
  
  assertIsAdminAuthed () {
    if (!this.isAdminAuthed()) throw new Error('Not authorized')
  }

  async create ({userKey, username, role}: {userKey: string, username: string, role: string}): Promise<void> {
    if (!this.req || !this.res) throw new Error('Unable to create session on this request')
    const sess = {
      sessionId: uuidv4(),
      userKey,
      username
    }
    await userSessions(serverdb.get()).create(sess)
    this.auth = {
      sessionId: sess.sessionId,
      userKey,
      username,
      role
    }
    this.res.cookie('session', sess.sessionId, {
      httpOnly: true,
      sameSite: 'lax' // must be lax to enable the /_atek/bind-session redirects
    })
  }

  async bind (sessionId: string): Promise<boolean> {
    if (!this.req || !this.res) throw new Error('Unable to create session on this request')
    const sessionRecord = await userSessions(serverdb.get()).get(sessionId).catch((e: any) => undefined)
    if (!sessionRecord) return false
    const userRecord = await users(serverdb.get()).get(sessionRecord.value.userKey)
    if (!userRecord) return false
    this.res.cookie('session', sessionId, {
      httpOnly: true,
      sameSite: 'lax'
    })
    this.auth = {
      sessionId: sessionRecord.value.sessionId,
      userKey: sessionRecord.value.userKey,
      username: userRecord.value.username,
      role: userRecord.value.role
    }
    return true
  }

  async destroy (): Promise<void> {
    if (!this.req || !this.res) throw new Error('Unable to destroy session on this request')
    if (this.req.cookies.session) {
      this.res.clearCookie('session')
      this.auth = undefined
      await userSessions(serverdb.get()).delete(this.req.cookies.session)
    }
  }
}

export function setup () {
  return async (req: RequestWithSession, res: express.Response, next: express.NextFunction) => {
    const auth = await getSessionAuth(req.headers.authorization, req.cookies.session)
    req.session = new Session(req, res, auth)
    next()
  }
}

export async function getSessionAuth (authHeader: string|undefined, sessionCookie: string|undefined): Promise<SessionAuth|undefined> {
  let auth = undefined
  if (sessionCookie) {
    const sessionRecord = await userSessions(serverdb.get()).get(sessionCookie).catch((e: any) => undefined)
    if (sessionRecord?.value) {
      const userRecord = await users(serverdb.get()).get(sessionRecord.value.userKey)
      if (userRecord?.value) {
        auth = {
          sessionId: sessionRecord.value.sessionId,
          userKey: sessionRecord.value.userKey,
          username: userRecord.value.username,
          role: userRecord.value.role
        }
      }
    }
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const srv = services.getByBearerToken(token)
    if (srv) {
      auth = {serviceKey: srv.serviceKey}
    } else if (Config.getActiveConfig().systemAuthTokens.includes(token)){
      auth = {userKey: 'system', username: 'system', role: 'admin'}
    }
  }
  return auth
}

export function genBindSessionToken (sessionId: string) {
  const token = uuidv4()
  bindSessionTokens.set(token, sessionId)
  return token
}

export async function attemptBindSession (req: RequestWithSession, res: express.Response): Promise<boolean> {
  if (typeof req.query.bst === 'string') {
    const sessionId = bindSessionTokens.get(req.query.bst)
    if (sessionId) {
      bindSessionTokens.delete(req.query.bst)
      return (await req.session?.bind(sessionId)) || false
    }
  }
  return false
}