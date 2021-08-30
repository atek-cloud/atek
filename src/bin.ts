#!/usr/bin/env node

import subcommand from 'subcommand'
import * as tsgen from '@atek-cloud/tsgen/dist/bin.js'
import * as server from './index.js'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as os from 'os'
import { Config, DEFAULT_REPL_PORT } from './config.js'
import * as net from 'net'
import { createApi } from './lib/rpc.js'

const PACKAGE_JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')

function runCommand (args: any): void {
  server.start({
    port: args.port,
    domain: args.domain,
    configDir: args.configDir
  })
}

async function apiCall (args: any, apiId: string, method: string, params: any[]): Promise<any> {
  const config = new Config(args.configDir || path.join(os.homedir(), '.atek'), {})
  const api = createApi(`http://localhost:${config.port}`, {api: apiId}, config.systemAuthTokens[0])
  try {
    return await api(method, params)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

const match = subcommand({
  commands: [
    {
      name: 'run',
      command: runCommand
    },
    {
      name: 'install',
      command: async (args: any) => {
        if (args._[0]) args.sourceUrl = args._[0]
        if (args.sourceUrl.startsWith('/')) {
          args.sourceUrl = `file://${args.sourceUrl}`
        }
        console.log(await apiCall(args, 'atek.cloud/services-api', 'install', [args]))
      }
    },
    {
      name: 'uninstall',
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'uninstall', [args.id || args._[0]])
      }
    },
    {
      name: 'update',
      command: async (args: any) => {
        console.log(await apiCall(args, 'atek.cloud/services-api', 'updatePackage', [args.id || args._[0]]))
      }
    },
    {
      name: 'ls',
      command: async (args: any) => {
        const {services} = await apiCall(args, 'atek.cloud/services-api', 'list', [])
        const out: NodeJS.Dict<object> = {}
        for (const srv of services) {
          out[srv.settings.id] = {
            Status: srv.status,
            Port: srv.settings.port,
            Source: srv.settings.sourceUrl,
            'Installed by': srv.settings.installedBy
          }
        }
        console.table(out)
      }
    },
    {
      name: 'get',
      command: async (args: any) => {
        const srv = await apiCall(args, 'atek.cloud/services-api', 'get', [args.id || args._[0]])
        console.log(srv.settings.id, `(${srv.status})`)
        console.log(srv.settings)
      }
    },
    {
      name: 'cfg',
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'configure', [args.id || args._[0], args])
      }
    },
    {
      name: 'start',
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'start', [args.id || args._[0]])
      }
    },
    {
      name: 'stop',
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'stop', [args.id || args._[0]])
      }
    },
    {
      name: 'restart',
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'restart', [args.id || args._[0]])
      }
    },
    {
      name: 'tsgen gen-file',
      command: (args: any) => {
        tsgen.doGenerateFile(args)
      }
    },
    {
      name: 'tsgen gen-folder',
      command: (args: any) => {
        tsgen.doGenerateFolder(args)
      }
    },
    {
      name: 'repl',
      command: (args: any) => {
        const port = Number(args.port || DEFAULT_REPL_PORT)
        const host = args.host || 'localhost'
        const socket = net.connect(port, host)
        process.stdin.pipe(socket)
        socket.pipe(process.stdout)
        socket.on('connect', () => {
          process.stdin.setRawMode(true)
        })
        socket.on('close', () => process.exit(0))
        process.on('exit', () => socket.end())
      }
    }
  ],
  root: {
    command: (args: any) => {
      if (args.v || args.version) {
        const packageJson = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')
        const pkg = JSON.parse(packageJson)
        console.log(pkg.version)
      } else {
        runCommand(args)
      }
    }
  }
})
const cmd = match(process.argv.slice(2))