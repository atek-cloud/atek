import {
  Client as HyperspaceClient,
  Server as HyperspaceServer,
  RemoteHypercore
} from 'hyperspace'
// @ts-ignore We dont need types for getNetworkOptions
import getNetworkOptions from '@hyperspace/rpc/socket.js'
import QuickLRU from 'quick-lru'
import { EventEmitter } from 'events'
import net from 'net'
import dht from '@hyperswarm/dht'
import ram from 'random-access-memory'
import WebSocket, { createWebSocketStream } from 'ws'
import { ServiceInstance, ServiceConfig } from '../services/instance.js'
import AtekService, { ServiceManifest } from '../gen/atek.cloud/service.js'
import * as apiBroker from '@atek-cloud/api-broker'

interface HyperDHT extends EventEmitter {
  listen: () => void
  address: () => {port: number}
  destroy: () => void
}

export class HyperServiceInstance extends ServiceInstance {
  server?: HyperspaceServer
  client?: HyperspaceClient
  dht?: HyperDHT
  hypers: QuickLRU<string, RemoteHypercore>

  constructor (settings: AtekService, config: ServiceConfig) {
    super(settings)
    this.setConfig(config)
    this.hypers = new QuickLRU({maxSize: 1000})
  }

  get manifest (): ServiceManifest {
    return {
      name: 'Hyperspace',
      description: 'The hypercore protocol service',
      license: 'MIT',
      exports: [
        {api: 'atek.cloud/hypercore-api'},
      ]
    }
  }

  get hyperspaceHost (): string | undefined {
    if (this.config.SIMULATE_HYPERSPACE) {
      return `hyperspace-simulator-${process.pid}`
    } else {
      return this.config.HYPERSPACE_HOST
    }
  }

  async start (): Promise<void> {
    this.log('Start() triggered')
    const release = await this.lockServiceCtrl()
    try {
      if (this.client) return

      this.log('----------------------')
      this.log(`Starting Hyperspace service process ${this.id}`)
      this.log(`  Path: <internal>`)
      this.log('----------------------')

      const simulateHyperspace = this.config.SIMULATE_HYPERSPACE
      const hyperspaceStorage = this.config.HYPERSPACE_STORAGE
      
      if (simulateHyperspace) {
        const dhtInst = this.dht = dht({
          bootstrap: false
        })
        dhtInst.listen()
        await new Promise(resolve => {
          return dhtInst.once('listening', resolve)
        })
        const bootstrapPort = dhtInst.address().port
        const bootstrapOpt = [`localhost:${bootstrapPort}}`]

        this.server = new HyperspaceServer({
          host: this.hyperspaceHost,
          storage: ram,
          network: {
            bootstrap: bootstrapOpt,
            preferredPort: 0
          },
          noMigrate: true
        })
        await this.server.open()
        this.client = new HyperspaceClient({host: this.hyperspaceHost})
      } else {
        try {
          this.client = new HyperspaceClient({host: this.hyperspaceHost})
          await this.client.ready()
        } catch (e) {
          // no daemon, start it in-process
          this.server = new HyperspaceServer({host: this.hyperspaceHost, storage: hyperspaceStorage})
          await this.server.ready()
          this.client = new HyperspaceClient({host: this.hyperspaceHost})
          await this.client.ready()
        }

        this.log('Hyperspace daemon connected, status:')
        this.log(JSON.stringify(await this.client.status()))

        apiBroker.registerProvider(this, apiBroker.TransportEnum.RPC, 'atek.cloud/hypercore-api')
        apiBroker.registerProvider(this, apiBroker.TransportEnum.PROXY, 'atek.cloud/hypercore-api')
        apiBroker.registerProvider(this, apiBroker.TransportEnum.RPC, 'atek.cloud/ping-api')
      }
      this.emit('start')
    } finally {
      release()
    }
  }

  async stop (): Promise<void> {
    this.log('Stop() triggered')
    const release = await this.lockServiceCtrl()
    try {
      apiBroker.unregisterProviderAll(this)
      if (this.client) await this.client.close()
      if (this.server) {
        this.log('Shutting down Hyperspace, this may take a few seconds...')
        await this.server.close()
      }
      if (this.dht) await this.dht.destroy()
      this.client = undefined
      this.server = undefined
      this.dht = undefined
    } finally {
      release()
    }
  }

  handleRpc (callDesc: apiBroker.CallDescription, methodName: string, params: unknown[]): Promise<unknown> {
    throw new apiBroker.ServiceNotFound('API not found')
  }

  handleProxy (callDesc: apiBroker.CallDescription, socket: WebSocket) {
    if (callDesc.api === 'atek.cloud/hypercore-api') {
      const hypSocket = net.connect(getNetworkOptions({host: this.hyperspaceHost}))
      const wsStream = createWebSocketStream(socket)
      wsStream.pipe(hypSocket).pipe(wsStream)
    } else {
      throw new apiBroker.ServiceNotFound('API not found')
    }
  }
}
