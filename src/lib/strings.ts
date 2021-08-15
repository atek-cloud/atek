import { URL } from 'url'

export const HYPER_KEY = /([0-9a-f]{64})/i
export const HYPER_KEY_ONLY = /^([0-9a-f]{64})$/i

export function hyperUrlToKey (str: string): Buffer | undefined {
  let matches = HYPER_KEY.exec(str)
  return matches ? Buffer.from(matches[1], 'hex') : undefined
}

export function hyperUrlToKeyStr (str: string): string | undefined {
  let matches = HYPER_KEY.exec(str)
  return matches ? matches[1] : undefined
}

export function isUrl (str: string): boolean {
  return /^https?:\/\//.test(str)
}

export function isHyperUrl (str: string): boolean {
  return /^hyper:\/\//.test(str)
}

export function isHyperKey (str: string): boolean {
  return HYPER_KEY_ONLY.test(String(str))
}

export function toOrigin (url: string): string {
  const urlp = new URL(url)
  return `${urlp.protocol}//${urlp.hostname}/`
}

export function constructEntryPath (schemaId: string, key: string): string {
  return '/' + joinPath(schemaId, encodeURIComponent(key))
}

export function constructEntryUrl (origin: string, schemaId: string, key: string): string {
  return joinPath(origin, constructEntryPath(schemaId, key))
}

type ParsedEntryUrl = {
  origin: string
  dbId: string
  schemaId: string
  key: string
}

export function parseEntryUrl (url: string): ParsedEntryUrl {
  const urlp = new URL(url)
  const pathParts = urlp.pathname.split('/')
  return {
    origin: `hyper://${urlp.hostname}/`,
    dbId: urlp.hostname,
    schemaId: pathParts.slice(1, 3).join('/'),
    key: pathParts.slice(3).map(decodeURIComponent).join('/')
  }
}

export function joinPath (...args: string[]): string {
  var str = args[0]
  for (let v of args.slice(1)) {
    v = v && typeof v === 'string' ? v : ''
    let left = str.endsWith('/')
    let right = v.startsWith('/')
    if (left !== right) str += v
    else if (left) str += v.slice(1)
    else str += '/' + v
  }
  return str
}