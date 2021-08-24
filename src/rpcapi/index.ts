import * as inspect from './inspect.js'
import * as services from './services.js'
import * as apiBroker from '@atek-cloud/api-broker'

const APIs = [inspect.setup(), services.setup()]

export function setup () {
  const systemApiProvider = {
    id: 'system',
    handleRpc (callDesc: apiBroker.CallDescription, methodName: string, params: any[]): Promise<any> {
      const api = APIs.find(api => api.ID === callDesc.api)
      if (api) {
        return api.handle(callDesc, methodName, params)
      }
      throw new Error('API not found')
    }
  }
  for (const api of APIs) {
    apiBroker.registerProvider(systemApiProvider, apiBroker.TransportEnum.RPC, api.ID)
  }
}