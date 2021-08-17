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
import HypercoreApiServer from '../gen/atek.cloud/hypercore-api.server.js'
import PingApiServer from '../gen/atek.cloud/ping-api.server.js'
import {
  CreateResponse,
  DescribeResponse,
  GetOptions,
  DownloadOptions,
  UpdateOptions,
  SeekResponse,
  ConfigureNetworkOptions
} from '../gen/atek.cloud/hypercore-api.js'
import * as apiBroker from '@atek-cloud/api-broker'

interface APIs {
  hyper: HypercoreApiServer
  ping: PingApiServer
}

interface HyperDHT extends EventEmitter {
  listen: () => void
  address: () => {port: number}
  destroy: () => void
}

export class HyperServiceInstance extends ServiceInstance {
  server?: HyperspaceServer
  client?: HyperspaceClient
  dht?: HyperDHT
  apis: APIs
  hypers: QuickLRU<string, RemoteHypercore>

  constructor (settings: AtekService, config: ServiceConfig) {
    super(settings)
    this.setConfig(config)
    this.apis = {
      hyper: this.createHyperApi(),
      ping: new PingApiServer({
        ping (num: number): Promise<number> {
          console.log('Hyper got ping', num)
          return Promise.resolve(num)
        }
      })
    }
    this.hypers = new QuickLRU({maxSize: 1000})
  }

  get manifest (): ServiceManifest {
    return {
      name: 'Hyperspace',
      description: 'The hypercore protocol service',
      license: 'MIT',
      exports: [
        {api: 'atek.cloud/hypercore-api'},
        {api: 'atek.cloud/ping-api'}
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
    if (callDesc.api === 'atek.cloud/hypercore-api') {
      return this.apis.hyper.handle(callDesc, methodName, params)
    }
    if (callDesc.api === 'atek.cloud/ping-api') {
      return this.apis.ping.handle(callDesc, methodName, params)
    }
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

  createHyperApi () {
    const getCore = (key: Uint8Array): RemoteHypercore => {
      if (!key) throw new Error('Hypercore key is required')
      const keyBuf = Buffer.from(key)
      if (keyBuf.byteLength !== 32) throw new Error('Hypercore key must be 32-bytes')

      if (!this.client) throw new Error('Hypercore service not active')

      const keyStr = keyBuf.toString('hex')
      if (!this.hypers.has(keyStr)) {
        this.hypers.set(keyStr, this.client.corestore().get(keyBuf))
      }
      const core = this.hypers.get(keyStr)
      if (!core) throw new Error('Failed to get core')
      return core
    }

    const self = this
    return new HypercoreApiServer({
      async create (): Promise<CreateResponse> {
        if (!self.client) throw new Error('Hypercore service not active')
        // @ts-ignore For some reason, my TS declarations don't like this line
        const core = self.client.corestore().get(undefined)
        await core.ready()
        return {
          key: core.key,
          discoveryKey: core.discoveryKey,
          writable: core.writable,
          length: core.length,
          byteLength: core.byteLength
        }
      },
  
      async describe (key: Uint8Array): Promise<DescribeResponse> {
        const core = getCore(key)
        await core.ready()
        return {
          key: core.key,
          discoveryKey: core.discoveryKey,
          writable: core.writable,
          length: core.length,
          byteLength: core.byteLength
        }
      },
      
      append (key: Uint8Array, data: Uint8Array | Uint8Array[]): Promise<number> {
        const core = getCore(key)
        return core.append(Array.isArray(data) ? data.map(d => Buffer.from(d)) : Buffer.from(data))
      },
      
      get (key: Uint8Array, index: number, options: GetOptions): Promise<Uint8Array> {
        const core = getCore(key)
        return core.get(index, options)
      },
      
      cancel (key: Uint8Array, getCallId: number): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      has (key: Uint8Array, index: number): Promise<boolean> {
        const core = getCore(key)
        return core.has(index)
      },
      
      download (key: Uint8Array, start: number, end: number, options: DownloadOptions): Promise<void> {
        const core = getCore(key)
        return core.download(start, end)
      },
      
      undownload (key: Uint8Array, downloadCallId: number): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      downloaded (key: Uint8Array, start: number, end: number): Promise<number> {
        const core = getCore(key)
        return core.downloaded(start, end)
      },
      
      update (key: Uint8Array, opts: UpdateOptions): Promise<void> {
        const core = getCore(key)
        return core.update(opts)
      },
      
      seek (key: Uint8Array, byteOffset: number): Promise<SeekResponse> {
        const core = getCore(key)
        return core.seek(byteOffset)
      },
      
      configureNetwork (key: Uint8Array, opts: ConfigureNetworkOptions): Promise<void> {
        const core = getCore(key)
        // @ts-ignore For some reason, my TS declarations don't like this line
        return this.client.network.configure(core, opts)
      }
    })
  }
}
