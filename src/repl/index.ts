import net from 'net'
import REPL from 'repl'
import * as util from 'util'
import minimist from 'minimist'
import { DEFAULT_REPL_PORT } from '../lib/config.js'

import * as services from '../services/index.js'
import { ServiceInstance } from '../services/instance.js'
import * as serverdb from '../serverdb/index.js'
import * as apiBroker from '@atek-cloud/api-broker'

export function setup () {
  const server = net.createServer(handleConn)
  server.listen(DEFAULT_REPL_PORT)
  console.log(`REPL listening on ${DEFAULT_REPL_PORT}`)
}

function handleConn (socket: net.Socket) {
  console.log('REPL client connected', socket.address())

  const repl = REPL.start({
    prompt: 'atek > ',
    input: socket,
    output: socket,
    terminal: true,
    preview: false // had to disable this, was causing weird errors
  });

  // CONTEXT
  repl.context.services = services
  repl.context.serverdb = serverdb
  repl.context.broker = apiBroker

  // COMMANDS
  function log (...args: any[]) {
    socket.write(args.map(arg => typeof arg === 'object' ? util.inspect(arg) : arg).join(' ') + '\n')
  }
  function logService (srv: ServiceInstance) {
    log(srv.id, srv.isActive ? '(active)' : '(inactive)', 'exports:', srv.manifest?.exports?.map(exp => exp.api))
  }
  function cmd (id: string, help: string, usage: string[], fn: (opts: minimist.ParsedArgs) => void|Promise<void>) {
    repl.defineCommand(id, {
      help,
      async action (text: string) {
        const opts = minimist(text.split(' '))
        if (opts.h || opts.help) {
          log(`${id} ${usage[0]}`)
          log(help)
          log(usage.map(str => `  ${str}`).join('\n'))
        } else {
          try {
            await fn(opts)
          } catch (e) {
            log(e)
          }
        }
        repl.displayPrompt()
      }
    })
  }
  cmd('srv_ls', 'List active services', ['', '-l|--long  Give full config'], async (opts: minimist.ParsedArgs) => {
    for (const item of await services.list()) {
      if (opts.l || opts.long) {
        log(item.toJSON())
      } else {
        logService(item)
      }
    }
  })
  cmd('srv_get', 'Get info about a service', ['{id}', '-l|--long  Give full config'], (opts: minimist.ParsedArgs) => {
    const item = services.get(opts._[0])
    if (!item) {
      log('No service with the id', opts._[0])
    } else {
      if (opts.l || opts.long) {
        log(item.toJSON())
      } else {
        logService(item)
      }
    }
  })
  cmd(
    'srv_install',
    'Install a new service',
    [
      '{url}',
      '--id       The ID to assign this service (default auto-generated)',
      '--port     The port to assign this service (default auto-chosen)',
      '--version  The version to install. Only applies to git repos. (default "latest")'
    ], async (opts: minimist.ParsedArgs) => {
      let url = opts._[0]
      if (!url) {
        throw `Must provide a URL`
      }
      if (url.startsWith('/')) url = `file://${url}`
      const item = await services.install({
        sourceUrl: url,
        id: opts.id,
        port: opts.port ? Number(opts.port) : undefined,
        desiredVersion: opts.desiredVersion
      }, 'system')
      logService(item)
    }
  )
  cmd(
    'srv_uninstall',
    'Uninstall a service',
    [
      '{id}',
    ], async (opts: minimist.ParsedArgs) => {
      const id = opts._[0]
      if (!id) {
        throw `Must provide an ID`
      }
      await services.uninstall(id)
      log('Done')
    }
  )

  socket.on('error', e => console.log('REPL client error', socket.address(), e))
  repl.on('exit', () => {
    console.log('REPL client disconnected', socket.address())
    socket.end()
  })
}