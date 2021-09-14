import WebSocket from 'ws'
import { TransportEnum, ApiProvider, CallDescription, CallContext, ServiceNotFound } from './types.js'
export * from './types.js'

class Registration {
  transport: TransportEnum
  api: string
  provider: ApiProvider

  constructor (transport: TransportEnum, api: string, provider: ApiProvider) {
    this.transport = transport
    this.api = api
    this.provider = provider
  }
}

// globals
// =

const registry: Registration[] = []

// exported api
// =

export function registerProvider (provider: ApiProvider, transport: TransportEnum, api: string): void {
  registry.push(new Registration(transport, api, provider))
}

export function unregisterProvider (provider: ApiProvider, transport: TransportEnum, api: string): void {
  const i = registry.findIndex(p => p.provider === provider && p.api === api && p.transport === transport)
  if (i !== -1) registry.splice(i, 1)
}

export function unregisterProviderAll (provider: ApiProvider): void {
  let i
  do {
    i = registry.findIndex(p => p.provider === provider)
    if (i !== -1) registry.splice(i, 1)
  } while (i !== -1)
}

export function findProvider (callDesc: CallDescription): Registration|undefined {
  return registry.find(p => {
    if (p.transport !== callDesc.transport) return false
    if (callDesc.service && p.provider.id !== callDesc.service) return false
    if (callDesc.api && p.api !== callDesc.api) return false
    return true
  })
}

export function routeRpc (callDesc: CallDescription, methodName: string, params: any[], ctx: CallContext): Promise<any> {
  const reg = findProvider(callDesc)
  if (!reg?.provider?.handleRpc) throw new ServiceNotFound(`No service available which matches ${JSON.stringify(callDesc)}`)
  return reg.provider.handleRpc(callDesc, methodName, params, ctx)
}

export function routeProxy (callDesc: CallDescription, socket: WebSocket, ctx: CallContext): void {
  const reg = findProvider(callDesc)
  if (!reg?.provider?.handleProxy) throw new ServiceNotFound(`No service available which matches ${JSON.stringify(callDesc)}`)
  reg.provider.handleProxy(callDesc, socket, ctx)
}
