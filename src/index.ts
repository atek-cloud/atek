import { RateLimiter } from 'pauls-sliding-window-rate-limiter'
import * as http from 'http'
import { Socket } from 'net'
import createExpressApp, * as express from 'express'
import WebSocket, * as ws from 'ws'
import httpProxy from 'http-proxy'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import isInstalledGlobally from 'is-installed-globally'
import { selfupdate } from '@mishguru/selfupdate'
import { parse as parseCookie } from '@tinyhttp/cookie'
import adb from '@atek-cloud/adb-api'
import * as cli from './lib/cli.js'
import { Config, ConfigValues } from './config.js'
import { generateBearerToken } from './lib/crypto.js'
import * as services from './services/index.js'
import { ServiceInstance } from './services/instance.js'
import { getAuthHeaders } from './services/util.js'
import { setup as setupServerDb } from './serverdb/index.js'
import * as sessionMiddleware from './httpapi/session-middleware.js'
import * as apiGatewayHttpApi from './httpapi/gateway.js'
import * as rpcapi from './rpcapi/index.js'
import * as setupFlow from './setup-flow.js'
import { getUserSettings } from './users/index.js'
// import * as perf from './lib/perf.js' TODO
// import * as metrics from './lib/metrics.js' TODO
import fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { URL, fileURLToPath } from 'url'

const HERE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

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
  cli.status('Initializing Atek')
  const configDir = opts.configDir || path.join(os.homedir(), '.atek')
  const config = new Config(configDir, opts)
  if (!config.systemAuthTokens?.length) {
    config.update({systemAuthTokens: [generateBearerToken()]})
  }
  Config.setActiveConfig(config)
  await fs.promises.mkdir(path.join(configDir, 'logs'), {recursive: true})
  await fs.promises.mkdir(path.join(configDir, 'packages'), {recursive: true})
  await fs.promises.mkdir(path.join(configDir, 'sockets'), {recursive: true})
  // if (config.benchmarkMode) {
  //   perf.enable() TODO
  // }
  // metrics.setup({configDir: opts.configDir}) TODO

  // configure any rpc apis atek is using
  adb.api.$setEndpoint({port: config.port})
  adb.api.$setAuthHeader(`Bearer ${config.systemAuthTokens[0]}`)
  cli.endStatus()

  const server = createServer(config)

  // initiate the services layer
  await services.setup()
  await services.loadCoreServices()
  await setupServerDb()
  rpcapi.setup()
  services.loadUserServices().catch(err => {
    console.log('Error while loading user services:')
    console.log(err)
  }).then(() => {
    // run setup flow if needed
    setupFlow.run()
  })

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
  app.use(cookieParser())
  app.use(sessionMiddleware.setup())
  app.set('view engine', 'ejs')
  app.set('views', path.join(HERE_PATH, 'static', 'views'))

  // rate limiter
  const rl = new RateLimiter({
    limit: 10000,
    window: 60e3
  })
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Cross-Origin-Opener-Policy', 'cross-origin')
    res.header('Cross-Origin-Resource-Policy', 'cross-origin')
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

  // grab the subdomain (it comes up a lot)
  app.use((req: sessionMiddleware.RequestWithSession, res: express.Response, next: express.NextFunction) => {
    const host = (req.headers.host || '').split(':')[0]
    res.locals.hostParts = host.split('.')
    res.locals.subdomain = res.locals.hostParts.length > 1 ? res.locals.hostParts.slice(0, -1).join('.') : ''
    next()
  })

  // auth
  app.use(async (req: sessionMiddleware.RequestWithSession, res: express.Response, next: express.NextFunction) => {
    if (!isRequestSafe(config, req) && !req.session?.isAuthed()) {
      if (res.locals.subdomain) {
        if (await sessionMiddleware.attemptBindSession(req, res)) {
          return next()
        }
        return res.redirect(`http://${config.domain}/_atek/bind-session?service=${encodeURIComponent(res.locals.subdomain)}&path=${req.originalUrl}`)
      } else {
        return res.redirect(`http://${config.domain}/_atek/login`)
      }
    } else {
      next()
    }
  })

  // subdomain proxies
  app.use((req: sessionMiddleware.RequestWithSession, res: express.Response, next: express.NextFunction) => {
    if (res.locals.subdomain) {
      const service = services.get(res.locals.subdomain)
      if (service) {
        Object.assign(req.headers, getAuthHeaders(req.session, service.serviceKey))
        try {
          return getProxy(service).web(req, res, undefined, (e: Error) => {
            if (e) proxyError(e, res, res.locals.subdomain)
          })
        } catch (e: any) {
          return proxyError(e, res, res.locals.subdomain)
        }
      } else {
        res.status(404).end(`Not found: no service is currently hosted at ${req.headers.host}`)
      }
    } else {
      next()
    }
  })

  // API servers
  app.use('/_atek', express.json())
  apiGatewayHttpApi.setup(app)

  // login and session acquisition
  app.use('/_atek/js/', express.static(path.join(HERE_PATH, 'static', 'js')))
  app.use('/_atek/login/', express.static(path.join(HERE_PATH, 'static', 'login')))
  app.get('/_atek/bind-session', (req: sessionMiddleware.RequestWithSession, res: express.Response) => {
    const serviceId = req.query.service
    const redirectPath = typeof req.query.path === 'string' ? req.query.path : '/'
    if (typeof serviceId !== 'string' || !services.get(serviceId)) {
      // invalid service
      return res.status(400).json({error: 'Not authorized'})
    }

    const redirectTo = (new URL(redirectPath, `http://${serviceId}.localhost/`))
    redirectTo.host = `${serviceId}.localhost`
    
    if (!req.session?.auth?.sessionId) {
      // no active session, try to login
      return res.redirect(`/_atek/login?redirect=${encodeURIComponent(redirectTo.toString())}`)
    }

    const bindSessionToken = sessionMiddleware.genBindSessionToken(req.session?.auth?.sessionId)
    redirectTo.searchParams.set('bst', bindSessionToken)
    res.redirect(redirectTo.toString())
  })
  app.use('/_atek', (req: express.Request, res: express.Response) => json404(res, 'Not found'))

  // "main service"
  app.use(async (req: sessionMiddleware.RequestWithSession, res: express.Response) => {
    if (!req.session?.isUserAuthed({notApp: true})) {
      return res.status(200).json({message: 'Atek online'})
    }
    const userKey = req.session.auth?.userKey || ''
    let mainServiceId: string|undefined
    try {
      const userSettings = await getUserSettings(userKey)
      mainServiceId = userSettings?.mainServiceId
    } catch (e) {
      console.error('Failed to lookup user settings for user key=', userKey)
      console.error(e)
      return res.status(500).json({error: 'Internal server error. Consult your server logs for more information.'})
    }
    const service = services.get(mainServiceId)
    if (!service) {
      return res.render('no-main-service', {userKey, error: '', defaultSourceUrl: config.defaultMainService})
    } else if (service.owningUserKey !== userKey) {
      return res.render('no-main-service', {
        userKey,
        error: 'not-owning-user',
        defaultSourceUrl: config.defaultMainService
      })
    } else {
      try {
        Object.assign(req.headers, getAuthHeaders(req.session, service.serviceKey))
        return getProxy(service).web(req, res, undefined, (e: Error) => {
          if (e) proxyError(e, res, mainServiceId || '')
        })
      } catch (e: any) {
        return proxyError(e, res, mainServiceId)
      }
    }
  })

  const wsServer = new ws.WebSocketServer({ noServer: true })
  wsServer.on('connection', async (socket: WebSocket, req: http.IncomingMessage) => {
    if (/\/_atek\/gateway(\?|\/$|$)/.test(req.url || '/')) {
      const cookie: any = req.headers.cookie ? parseCookie(req.headers.cookie) : undefined
      const session = new sessionMiddleware.Session(undefined, undefined, await sessionMiddleware.getSessionAuth(req.headers.authorization, cookie?.session))
      apiGatewayHttpApi.handleWebSocket(socket, req, session)
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

export async function checkForUpdates (packageJsonPath: string) {
  let packageJson
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch (e) {
    console.log('Failed to read package.json, unable to run auto-updater')
    console.log('  Attempted to read:', packageJsonPath)
    console.log('  Error:', e)
  }
  if (!packageJson || !isInstalledGlobally) {
    console.log('Skipping auto-update as this app is not running as a global NPM module.')
  } else {
    await selfupdate(packageJson)
  }

  console.log('Running Atek', packageJson.version)
}

function json404 (res: express.Response, e: Error | string) {
  res.status(404).json({error: true, message: e instanceof Error && e.message ? e.message : e.toString()})
}

function proxyError (e: Error, res: express.Response, id: string) {
  console.error('Failed to proxy request to', id)
  console.error(e)
  return res.status(500).end('Internal server error')
}


const proxies = new Map<string, httpProxy>()
function getProxy (service: ServiceInstance): httpProxy {
  const proxyId = service.id
  let proxy = proxies.get(proxyId)
  if (!proxy) {
    proxy = httpProxy.createProxyServer({
      // @ts-ignore socketPath is supported, but not included in their types
      target: {socketPath: service.socketPath}
    })
    proxies.set(proxyId, proxy)
  }
  return proxy
}

function isRequestSafe (config: Config, req: express.Request): boolean {
  const host = (req.headers.host || '').split(':')[0]
  return (!host || host === config.domain) && req.path.startsWith('/_atek/')
}