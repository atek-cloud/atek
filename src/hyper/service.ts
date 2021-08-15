import {
  Client as HyperspaceClient,
  Server as HyperspaceServer
} from 'hyperspace'
import { EventEmitter } from 'events'
import dht from '@hyperswarm/dht'
import ram from 'random-access-memory'
import { ServiceInstance } from '../services/instance.js'
import AtekService from '../gen/atek.cloud/service.js'
import HypercoreApiServer from '../gen/atek.cloud/hypercore-api.server.js'
import {
  CreateResponse,
  DescribeResponse,
  GetOptions,
  DownloadOptions,
  UpdateOptions,
  SeekResponse,
  ConfigureNetworkOptions
} from '../gen/atek.cloud/hypercore-api.js'

interface APIs {
  hyper: HypercoreApiServer
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

  constructor (settings: AtekService) {
    super(settings)
    this.apis = {
      hyper: this.createHyperApi()
    }
  }

  getManifest () {
    return {
      title: 'Hyperspace',
      description: 'The hypercore protocol service',
      license: 'MIT',
      exports: [
        {api: 'atek.cloud/hypercore'}
      ]
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

      // TODO config solution
      const simulateHyperspace = false
      const hyperspaceHost = undefined
      const hyperspaceStorage = undefined

      // TODO register API
      
      if (simulateHyperspace) {
        this.dht = dht({
          bootstrap: false
        })
        this.dht.listen()
        await new Promise(resolve => {
          return this.dht.once('listening', resolve)
        })
        const bootstrapPort = this.dht.address().port
        const bootstrapOpt = [`localhost:${bootstrapPort}}`]

        const simulatorId = `hyperspace-simulator-${process.pid}`

        this.server = new HyperspaceServer({
          host: simulatorId,
          storage: ram,
          network: {
            bootstrap: bootstrapOpt,
            preferredPort: 0
          },
          noMigrate: true
        })
        await this.server.open()
        this.client = new HyperspaceClient({host: simulatorId})
      } else {
        try {
          this.client = new HyperspaceClient({host: hyperspaceHost})
          await this.client.ready()
        } catch (e) {
          // no daemon, start it in-process
          this.server = new HyperspaceServer({host: hyperspaceHost, storage: hyperspaceStorage})
          await this.server.ready()
          this.client = new HyperspaceClient({host: hyperspaceHost})
          await this.client.ready()
        }

        this.log('Hyperspace daemon connected, status:')
        this.log(await this.client.status())
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

  createHyperApi () {
    return new HypercoreApiServer({
      create (): Promise<CreateResponse> {
        // TODO
        return Promise.resolve({
          key: new Uint8Array(),
          discoveryKey: new Uint8Array(),
          writable: false,
          length: 0,
          byteLength: 0
        })
      },
  
      describe (key: Uint8Array): Promise<DescribeResponse> {
        // TODO
        return Promise.resolve({
          key,
          discoveryKey: new Uint8Array(),
          writable: false,
          length: 0,
          byteLength: 0
        })
      },
      
      append (key: Uint8Array, data: Uint8Array | Uint8Array[]): Promise<number> {
        // TODO
        return Promise.resolve(0)
      },
      
      get (key: Uint8Array, index: number, options: GetOptions): Promise<Uint8Array> {
        // TODO
        return Promise.resolve(new Uint8Array())
      },
      
      cancel (key: Uint8Array, getCallId: number): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      has (key: Uint8Array, index: number): Promise<boolean> {
        // TODO
        return Promise.resolve(false)
      },
      
      download (key: Uint8Array, start: number, end: number, options: DownloadOptions): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      undownload (key: Uint8Array, downloadCallId: number): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      downloaded (key: Uint8Array, start: number, end: number): Promise<number> {
        // TODO
        return Promise.resolve(0)
      },
      
      update (key: Uint8Array, opts: UpdateOptions): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      },
      
      seek (key: Uint8Array, byteOffset: number): Promise<SeekResponse> {
        // TODO
        return Promise.resolve({
          index: 0,
          relativeOffset: 0
        })
      },
      
      configureNetwork (key: Uint8Array, opts: ConfigureNetworkOptions): Promise<void> {
        // TODO
        return Promise.resolve(undefined)
      }
    })
  }
}
