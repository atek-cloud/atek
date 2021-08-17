declare module 'hyperspace' {
  declare class Client {
    constructor (opts?: {host?: string})
    async ready ()
    async status ()
    async close ()
    corestore (str?: string): RemoteCorestore
    network: RemoteNetworker
  }
  declare class Server {
    constructor (opts?: {})
    async open ()
    async ready ()
    async close ()
  }
  declare interface ServerOpts {
    host?: string
    storage?: any
    network?: {
      bootstrap?: string[]
      preferredPort?: numbe
    }
    noMigrate?: boolean
  }
  declare interface RemoteCorestore {
    get (key: Buffer | undefined): RemoteHypercore
  }
  declare interface RemoteNetworker {
    async configure (core: Buffer | RemoteHypercore, opts: object)
  }
  declare interface RemoteHypercore {
    key: Buffer
    discoveryKey: Buffer
    writable: boolean
    length: number
    byteLength: number
    ready (): Promise<void>
    get (index: number, opts?: object): Promise<Uint8Array>
    has (index: number): Promise<boolean>
    cancel (p: Promise)
    download (start: number, end: number): Promise<void>
    undownload (p: Promise)
    downloaded (start: number, end: number): Promise<number>
    update (opts?: object): Promise<void>
    seek (byteOffset: number): Promise<{index: number, relativeOffset: number}>
    append (data: Uint8Array|Uint8Array[]): Promise<number>
  }
}