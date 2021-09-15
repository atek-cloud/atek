import * as express from 'express'
import { RequestWithSession, Session } from './session-middleware.js'
import * as apiBroker from '../broker/index.js'
import jsonrpc from 'jsonrpc-lite'
import { ParsedQs } from 'qs'
import { IncomingMessage } from 'http'
import WebSocket from 'ws'
import { URL } from 'url'

export function setup (app: express.Application) {
  console.log('Enabling /_atek/gateway endpoints')

  app.use('/_atek/gateway', (req: RequestWithSession, res: express.Response, next: express.NextFunction) => {
    if (!req.session?.isAuthed()) {
      if (queryParamToString(req.query.api) === 'atek.cloud/user-sessions-api' && req.body.method === 'login') {
        return next() // allow this call only
      }
      res.status(401).json({error: true, message: 'Not authorized'})
      return
    }
    next()
  })

  app.post('/_atek/gateway', async (req: RequestWithSession, res: express.Response) => {
    const callDesc = {
      transport: apiBroker.TransportEnum.RPC,
      api: queryParamToString(req.query.api)
    }
    const parsed = jsonrpc.parseObject(req.body)
    if (parsed.type === 'error') {
      return res.status(200).json(parsed.payload)
    } else if (parsed.type === 'request') {
      try {
        const params = Array.isArray(parsed.payload.params) ? parsed.payload.params : []
        let apiRes = await apiBroker.routeRpc(callDesc, parsed.payload.method, params, {session: req.session})
        if (typeof apiRes === 'undefined') apiRes = 0
        return res.status(200).json(jsonrpc.success(parsed.payload.id, apiRes))
      } catch (e: any) {
        const rpcErr = e instanceof jsonrpc.JsonRpcError ? e : new jsonrpc.JsonRpcError(e.message || e.toString(), e.code || -32000, e.data)
        return res.status(200).json(jsonrpc.error(parsed.payload.id, rpcErr))
      }
    }
    return res.status(200).json({})
  })
}

export function handleWebSocket (ws: WebSocket, req: IncomingMessage, session: Session) {
  const urlp = new URL(req.url || '/', 'http://localhost/') // the domain isn't important, we just need to parse the query params
  const callDesc = {
    transport: apiBroker.TransportEnum.PROXY,
    api: urlp.searchParams.get('api') || ''
  }

  try {
    apiBroker.routeProxy(callDesc, ws, {session})
  } catch (e) {
    console.error('Failed to route call', callDesc)
    console.error(e)
    ws.close()
  }
}


function queryParamToString (v: undefined | string | string[] | ParsedQs | ParsedQs[]): string | undefined {
  if (!v) return undefined
  if (Array.isArray(v)) return queryParamToString(v[0])
  if (typeof v === 'string') return v
  return undefined
}