import * as express from 'express'
import { RequestWithSession } from './session-middleware.js'
import * as apiBroker from '@atek-cloud/api-broker'
import jsonrpc from 'jsonrpc-lite'
import { ParsedQs } from 'qs'
import { IncomingMessage } from 'http'
import WebSocket from 'ws'
import { URL } from 'url'

export function setup (app: express.Application) {
  console.log('Enabling /_api/gateway endpoints')

  app.use('/_api/gateway', (req: RequestWithSession, res: express.Response, next: express.NextFunction) => {
    // if (!req.session?.isAppAuthed()) { // TODO
    //   res.status(401).json({error: true, message: 'Not authorized'})
    //   return
    // }
    next()
  })

  app.post('/_api/gateway', async (req: RequestWithSession, res: express.Response) => {
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
        const apiRes = await apiBroker.routeRpc(callDesc, parsed.payload.method, params)
        return res.status(200).json(jsonrpc.success(parsed.payload.id, apiRes))
      } catch (e) {
        const rpcErr = e instanceof jsonrpc.JsonRpcError ? e : new jsonrpc.JsonRpcError(e.message || e.toString(), e.code || -32000, e.data)
        return res.status(200).json(jsonrpc.error(parsed.payload.id, rpcErr))
      }
    }
    return res.status(200).json({})
  })
}

export function handleWebSocket (ws: WebSocket, req: IncomingMessage) {
  const urlp = new URL(req.url || '/', 'http://localhost/') // the domain isn't important, we just need to parse the query params
  const callDesc = {
    transport: apiBroker.TransportEnum.PROXY,
    api: urlp.searchParams.get('api') || ''
  }

  try {
    apiBroker.routeProxy(callDesc, ws)
  } catch (e) {
    console.error('Failed to route call', callDesc)
    console.error(e)
    ws.close()
  }

  // ws.on('message', function incoming(message) {
  //   console.log('received: %s', message);
  // });

  // ws.send(JSON.stringify(callDesc));
}


function queryParamToString (v: undefined | string | string[] | ParsedQs | ParsedQs[]): string | undefined {
  if (!v) return undefined
  if (Array.isArray(v)) return queryParamToString(v[0])
  if (typeof v === 'string') return v
  return undefined
}