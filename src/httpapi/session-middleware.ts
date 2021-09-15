import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { Config } from '../config.js'
import * as serverdb from '../serverdb/index.js'
import { userSessions } from '@atek-cloud/adb-tables'
import * as services from '../services/index.js'

const bindSessionTokens = new Map<string, string>()

export interface SessionAuth {
  sessionId?: string
  userKey?: string
  username?: string
  serviceKey?: string
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
    return Boolean(this.auth && (this.auth.sessionId || this.auth.serviceKey))
  }

  isAppAuthed (): boolean {
    return Boolean(this.auth && this.auth.serviceKey)
  }

  isAccountAuthed (): boolean {
    return Boolean(this.auth && this.auth.userKey)
  }

  async create ({userKey, username}: {userKey: string, username: string}): Promise<void> {
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
      username
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
    this.res.cookie('session', sessionId, {
      httpOnly: true,
      sameSite: 'strict'
    })
    this.auth = {
      sessionId: sessionRecord.value.sessionId,
      userKey: sessionRecord.value.userKey,
      username: sessionRecord.value.username
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
      auth = {
        sessionId: sessionRecord.value.sessionId,
        userKey: sessionRecord.value.userKey,
        username: sessionRecord.value.username
      }
    }
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    const srv = services.getByBearerToken(token)
    if (srv) {
      auth = {serviceKey: srv.serviceKey}
    } else if (Config.getActiveConfig().systemAuthTokens.includes(token)){
      auth = {serviceKey: 'system'}
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