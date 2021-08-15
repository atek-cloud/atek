import {
  Client as HyperspaceClient,
  Server as HyperspaceServer
} from 'hyperspace'
import { EventEmitter } from 'events'
import dht from '@hyperswarm/dht'
import ram from 'random-access-memory'
import { ServiceInstance } from '../services/instance.js'
import * as atekService from '../gen/atek.cloud/service.js'
import HypercoreAPIServer from '../gen/atek.cloud/hypercore-api.server.js'
import {
  Create_Response,
  Describe_Response,
  AppendData,
  GetOptions,
  DownloadOptions,
  UpdateOpts,
  Seek_Response,
  ConfigureNetworkOpts
} from '../gen/atek.cloud/hypercore-api.js'

interface TODO {}

interface HyperDHT extends EventEmitter {
  listen: () => void
  address: () => {port: number}
  destroy: () => void
}

export class HyperServiceInstance extends ServiceInstance {
  server: HyperspaceServer
  client: HyperspaceClient
  dht: HyperDHT
  api: TODO

  constructor (settings: atekService.Service) {
    super(settings)
    this.api = {
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
    return new HypercoreAPIServer({
      create (): Promise<Create_Response> {
        // TODO
      },
  
      describe (key: Buffer): Promise<Describe_Response> {
        // TODO
      },
      
      append (key: Buffer, data: AppendData): Promise<number> {
        // TODO
      },
      
      get (key: Buffer, index: number, options: GetOptions): Promise<Buffer> {
        // TODO
      },
      
      cancel (key: Buffer, getCallId: number): Promise<void> {
        // TODO
      },
      
      has (key: Buffer, index: number): Promise<boolean> {
        // TODO
      },
      
      download (key: Buffer, start: number, end: number, options: DownloadOptions): Promise<void> {
        // TODO
      },
      
      undownload (key: Buffer, downloadCallId: number): Promise<void> {
        // TODO
      },
      
      downloaded (key: Buffer, start: number, end: number): Promise<number> {
        // TODO
      },
      
      update (key: Buffer, opts: UpdateOpts): Promise<void> {
        // TODO
      },
      
      seek (key: Buffer, byteOffset: number): Promise<Seek_Response> {
        // TODO
      },
      
      configureNetwork (key: Buffer, opts: ConfigureNetworkOpts): Promise<void> {
        // TODO
      }
    })
  }
}
