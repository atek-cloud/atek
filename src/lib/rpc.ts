import { URLSearchParams } from 'url'
import {fetch, CookieJar} from 'node-fetch-cookies'
import jsonrpc from 'jsonrpc-lite'
import { removeUndefinedsAtEndOfArray } from './functions.js'

let _id = 1
export function createApi (origin: string, apiDesc: string|NodeJS.Dict<string>, authToken: string) {
  const qp = new URLSearchParams(typeof apiDesc === 'string' ? {api: apiDesc} : apiDesc)
  const url = `${origin}/_atek/gateway?${qp.toString()}`
  const cookieJar = new CookieJar()

  return async (methodName: string, params: any[] = []): Promise<any> => {
    const responseBody = await (await fetch(cookieJar, url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
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