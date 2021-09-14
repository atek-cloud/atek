import * as inspect from './inspect.js'
import * as services from './services.js'
import * as users from './users.js'
import * as userSessions from './user-sessions.js'
import * as apiBroker from '../broker/index.js'

const APIs = [
  {id: 'atek.cloud/inspect-api', api: inspect.setup()},
  {id: 'atek.cloud/services-api', api: services.setup()},
  {id: 'atek.cloud/users-api', api: users.setup()},
  {id: 'atek.cloud/user-sessions-api', api: userSessions.setup()}
]

export function setup () {
  const systemApiProvider = {
    id: 'system',
    handleRpc (callDesc: apiBroker.CallDescription, methodName: string, params: any[], ctx: apiBroker.CallContext): Promise<any> {
      const item = APIs.find(item => item.id === callDesc.api)
      if (item) {
        return item.api.handlers[methodName](ctx, params)
      }
      throw new Error('API not found')
    }
  }
  for (const api of APIs) {
    apiBroker.registerProvider(systemApiProvider, apiBroker.TransportEnum.RPC, api.id)
  }
}