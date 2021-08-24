import { RateLimiter } from 'pauls-sliding-window-rate-limiter'
import * as http from 'http'
import { Socket } from 'net'
import createExpressApp, * as express from 'express'
import WebSocket, * as ws from 'ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import * as repl from './repl/index.js'
import { Config, ConfigValues } from './config.js'
import * as services from './services/index.js'
import * as serverdb from './serverdb/index.js'
import * as sessionMiddleware from './httpapi/session-middleware.js'
import * as apiGatewayHttpApi from './httpapi/gateway.js'
import * as rpcapi from './rpcapi/index.js'
// import * as perf from './lib/perf.js' TODO
// import * as metrics from './lib/metrics.js' TODO
import fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as os from 'os'
import { Liquid } from 'liquidjs'

const INSTALL_PATH = path.dirname(fileURLToPath(import.meta.url))
const INSTALL_UI_PATH = path.join(INSTALL_PATH, '..', 'frontend', 'ui')
const INSTALL_JSON_FORMS_PATH = path.join(INSTALL_PATH, '..', 'frontend', 'json-forms')

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
  await services.loadUserServices()

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
  app.engine('liquid', (new Liquid()).express())
  app.set('views', path.join(INSTALL_UI_PATH, 'views'))
  app.set('view engine', 'liquid')
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

  apiGatewayHttpApi.setup(app)
  app.use('/_api', (req: express.Request, res: express.Response) => json404(res, 'Not found'))
  app.get('/', (req: express.Request, res: express.Response) => res.render('index'))
  app.get('/index', (req: express.Request, res: express.Response) => res.render('index'))
  app.get('/index.html', (req: express.Request, res: express.Response) => res.render('index'))
  app.get('/p/*', (req: express.Request, res: express.Response) => res.render('index'))
  app.get('/p/*/*', (req: express.Request, res: express.Response) => res.render('index'))
  app.use('/img', express.static(path.join(INSTALL_UI_PATH, 'static', 'img')))
  app.use('/css', express.static(path.join(INSTALL_UI_PATH, 'static', 'css')))
  app.get('/js/app.build.js', (req: express.Request, res: express.Response) => {
    if(process.env.NODE_ENV === 'production') {
      res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'js', 'app.build.js'))
    } else {
      res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'js', 'app.js'))
    }
  })
  app.use('/js', express.static(path.join(INSTALL_UI_PATH, 'static', 'js')))
  app.use('/vendor', express.static(path.join(INSTALL_UI_PATH, 'static', 'vendor')))
  app.use('/webfonts', express.static(path.join(INSTALL_UI_PATH, 'static', 'webfonts')))
  app.use('/ui/json-forms', express.static(INSTALL_JSON_FORMS_PATH))
  app.use('/_schemas', express.static('schemas'))
  app.get('/manifest.json', (req: express.Request, res: express.Response) => res.sendFile(path.join(INSTALL_UI_PATH, 'static', 'manifest.json')))
  app.get(new RegExp('/([^/])'), (req: express.Request, res: express.Response) => res.render('index'))
  app.use((req: express.Request, res: express.Response) => {
    res.status(404).send('404 Page not found')
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