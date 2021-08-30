import { RateLimiter } from 'pauls-sliding-window-rate-limiter'
import * as http from 'http'
import { Socket } from 'net'
import createExpressApp, * as express from 'express'
import WebSocket, * as ws from 'ws'
import httpProxy from 'http-proxy'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as repl from './repl/index.js'
import { Config, ConfigValues } from './config.js'
import { generateBearerToken } from './lib/crypto.js'
import * as services from './services/index.js'
import { ServiceInstance } from './services/instance.js'
import * as serverdb from './serverdb/index.js'
import * as sessionMiddleware from './httpapi/session-middleware.js'
import * as apiGatewayHttpApi from './httpapi/gateway.js'
import * as rpcapi from './rpcapi/index.js'
// import * as perf from './lib/perf.js' TODO
// import * as metrics from './lib/metrics.js' TODO
import fs from 'fs'
import * as path from 'path'
import * as os from 'os'

let app

interface StartOpts extends ConfigValues {
  configDir: string
}

declare module 'ws' {
  // HACK temporary workaround for the 'ws' module having bad types, should be fixed soon -prf
  class WebSocketServer extends ws.Server {}
}

export * as test from './test.js'

export async function start (opts: StartOpts) {
  const configDir = opts.configDir || path.join(os.homedir(), '.atek')
  const config = new Config(configDir, opts)
  if (!config.systemAuthTokens?.length) {
    config.update({systemAuthTokens: [generateBearerToken()]})
  }
  Config.setActiveConfig(config)
  await fs.promises.mkdir(path.join(configDir, 'logs'), {recursive: true})
  await fs.promises.mkdir(path.join(configDir, 'packages'), {recursive: true})
  // if (config.benchmarkMode) {
  //   perf.enable() TODO
  // }
  // metrics.setup({configDir: opts.configDir}) TODO

  repl.setup()
  const server = createServer(config)

  // initiate the services layer
  await services.setup()
  await services.loadCoreServices()
  await serverdb.setup()
  /* dont await */services.loadUserServices().catch(err => {
    console.log('Error while loading user services:')
    console.log(err)
  })

  // setup rpc apis
  rpcapi.setup()

  process.on('SIGINT', close)
  process.on('SIGTERM', close)
  function close () {
    console.log('Shutting down, this may take a moment...')
    services.stopAll()
    server.close()
    process.exit(0)
  }

  return {
    server,
    close: () => {
      console.log('Shutting down, this may take a moment...')
      services.stopAll()
      server.close()
    }
  }
}

function createServer (config: Config) {
  app = createExpressApp()
  app.set('trust proxy', 'loopback')
  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())
  app.use(sessionMiddleware.setup())

  const rl = new RateLimiter({
    limit: 10000,
    window: 60e3
  })
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Cross-Origin-Opener-Policy', 'same-origin')
    res.header('Cross-Origin-Embedder-Policy', 'require-corp')

    // metrics.httpRequest({path: req.url})
    if (!rl.hit(req.ip)) {
      return res.status(429).json({
        error: 'RateLimitError',
        message: 'Rate limit exceeded'
      })
    }
    next()
  })

  const suffix = `.${config.domain}`
  const slice = suffix.length * -1
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const host = (req.headers.host || '').split(':')[0]
    if (host.endsWith(suffix)) {
      const subdomain = host.slice(0, slice)
      const service = services.get(subdomain)
      if (service) {
        getProxy(service).web(req, res)
      } else {
        res.status(404).end(`Not found: no service is currently hosted at ${req.headers.host}`)
      }
    } else {
      next()
    }
  })

  apiGatewayHttpApi.setup(app)
  app.use('/_api', (req: express.Request, res: express.Response) => json404(res, 'Not found'))
  app.use((req: express.Request, res: express.Response) => {
    if (config.mainService) {
      const service = services.get(config.mainService)
      if (service) {
        return getProxy(service).web(req, res)
      }
    }
    res.set('Content-Type', 'text/html')
    res.status(200).send('<h1>Welcome to Atek</h1><p>Note: No main service is configured. Set "mainService" in your config to the ID of the service you want hosted at your main domain.</p>')
  })

  const wsServer = new ws.WebSocketServer({ noServer: true })
  wsServer.on('connection', (socket: WebSocket, req: http.IncomingMessage) => {
    if (/\/_api\/gateway(\?|\/$|$)/.test(req.url || '/')) {
      apiGatewayHttpApi.handleWebSocket(socket, req)
    } else {
      socket.close()
    }
  })

  const server = new http.Server(app)
  server.listen(config.port, () => {    
    console.log(`Application server listening at http://localhost:${config.port}`)
  })
  server.on('upgrade', (request: http.IncomingMessage, socket, head) => {
    wsServer.handleUpgrade(request, (socket as Socket), head, socket => {
      wsServer.emit('connection', socket, request)
    })
  })

  return server
}

function json404 (res: express.Response, e: Error | string) {
  res.status(404).json({error: true, message: e instanceof Error && e.message ? e.message : e.toString()})
}

const proxies = new Map<string, httpProxy>()
function getProxy (service: ServiceInstance): httpProxy {
  const proxyId = `${service.id}:${service.port}` // we include the port to ensure a new proxy is found if the port is changed
  let proxy = proxies.get(proxyId)
  if (!proxy) {
    proxy = httpProxy.createProxyServer({
      target: {host: 'localhost', port: service.port}
    })
    proxies.set(proxyId, proxy)
  }
  return proxy
}