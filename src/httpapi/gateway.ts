import * as express from 'express'
import { RequestWithSession } from './session-middleware.js'
import * as apiBroker from '@atek-cloud/api-broker'
import jsonrpc from 'jsonrpc-lite'
import { ParsedQs } from 'qs'

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
    const callDesc = {api: queryParamToString(req.query.api)}
    const parsed = jsonrpc.parseObject(req.body)
    if (parsed.type === 'error') {
      return res.status(200).json(parsed.payload)
    } else if (parsed.type === 'request') {
      try {
        const params = Array.isArray(parsed.payload.params) ? parsed.payload.params : []
        const apiRes = await apiBroker.routeCall(callDesc, parsed.payload.method, params)
        return res.status(200).json(jsonrpc.success(parsed.payload.id, apiRes))
      } catch (e) {
        return res.status(200).json(jsonrpc.error(e.code || -32000, e.toString()))
      }
    }
    return res.status(200).json({})
  })
}


function queryParamToString (v: undefined | string | string[] | ParsedQs | ParsedQs[]): string | undefined {
  if (!v) return undefined
  if (Array.isArray(v)) return queryParamToString(v[0])
  if (typeof v === 'string') return v
  return undefined
}