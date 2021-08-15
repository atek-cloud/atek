import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
// import { privateServerDb } from '../db/index.js' TODO
// import * as apps from '../apps/index.js' TODO

interface SessionAuth {
  sessionId?: string
  accountId?: string
  appId?: string
}

export interface RequestWithSession extends express.Request {
  session?: Session
}

class Session {
  req: express.Request
  res: express.Response
  auth: SessionAuth | undefined

  constructor (req: RequestWithSession, res: express.Response, auth: SessionAuth | undefined) {
    this.req = req
    this.res = res
    this.auth = auth
  }

  isAuthed (): boolean {
    return Boolean(this.auth && (this.auth.sessionId || this.auth.appId))
  }

  isAppAuthed (): boolean {
    return Boolean(this.auth && this.auth.appId)
  }

  isAccountAuthed (): boolean {
    return Boolean(this.auth && this.auth.accountId)
  }

  async create ({accountId}: {accountId: string}): Promise<void> {
    const sess = {
      sessionId: uuidv4(),
      accountId,
      createdAt: (new Date()).toISOString()
    }
    // await privateServerDb.accountSessions.put(sess.sessionId, sess) TODO
    this.auth = {
      sessionId: sess.sessionId,
      accountId
    }
    this.res.cookie('session', sess.sessionId, {
      httpOnly: true,
      sameSite: 'strict'
    })

  }

  async destroy (): Promise<void> {
    if (this.req.cookies.session) {
      // await privateServerDb.accountSessions.del(this.req.cookies.session) TODO
      this.res.clearCookie('session')
      this.auth = undefined
    }
  }
}

export function setup () {
  return async (req: RequestWithSession, res: express.Response, next: express.NextFunction) => {
    let auth = undefined
    if (req.cookies.session) {
      // TODO
      // const sessionRecord = await privateServerDb.accountSessions.get(req.cookies.session).catch(e => undefined)
      // if (sessionRecord) {
      //   auth = {
      //     sessionId: sessionRecord.value.sessionId,
      //     username: sessionRecord.value.username
      //   }
      // }
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // TODO
      // const app = apps.getByBearerToken(req.headers.authorization.split(' ')[1])
      // if (app) {
      //   auth = {
      //     appId: app.id
      //   }
      // }
    }
    req.session = new Session(req, res, auth)
    next()
  }
}
