import { URLSearchParams } from 'url'
import fetch from 'node-fetch'
import jsonrpc from 'jsonrpc-lite'
import { removeUndefinedsAtEndOfArray } from './functions.js'

let _id = 1
export function createApi (origin: string, apiDesc: string|NodeJS.Dict<string>, authToken: string) {
  const qp = new URLSearchParams(typeof apiDesc === 'string' ? {api: apiDesc} : apiDesc)
  const url = `${origin}/_atek/gateway?${qp.toString()}`

  return async (methodName: string, params: any[] = []): Promise<any> => {
    const responseBody = await (await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authentication': `Bearer ${authToken}`},
      body: JSON.stringify(jsonrpc.request(_id++, methodName, removeUndefinedsAtEndOfArray(params)))
    })).json()
    const parsed = jsonrpc.parseObject(responseBody)
    if (parsed.type === 'error') {
      throw parsed.payload.error
    } else if (parsed.type === 'success') {
      return parsed.payload.result
    }
  }
}