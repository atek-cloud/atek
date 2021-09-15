#!/usr/bin/env node

import subcommand from 'subcommand'
import * as server from './index.js'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as os from 'os'
import { Config } from './config.js'
import { createApi } from './lib/rpc.js'
import { createUserPrompt, createPasswordPrompt, createModUserPrompt, confirm } from './setup-flow.js'

const PACKAGE_JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')

const RUN_OPTS = [
  {name: 'port', help: 'Set the port to run the server on (defaults to 80)'},
  {name: 'domain', help: 'Set the domain the server will be accessed by (defaults to "localhost")'},
  {name: 'configDir', help: 'Set the directory to read configuration from (defaults to "~/.atek")'}
]

async function runCommand (args: any): Promise<void> {
  await server.checkForUpdates(PACKAGE_JSON_PATH)
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
    return await api.call(method, params)
  } catch (e: any) {
    if (e.code === 'ECONNREFUSED') {
      console.error('Failed to connect to Atek.')
      console.error('Make sure Atek is running before calling this command:')
      console.error('')
      console.error('  atek run')
      console.error('')
    } else {
      console.error(e)
    }
    process.exit(1)
  }
}

async function lookupUserKey (args: any, username: string): Promise<string> {
  const {users} = await apiCall(args, 'atek.cloud/users-api', 'list', [])
  const user = users.find((user: any) => user.username === username)
  if (!user) throw new Error(`User ${username} not found`)
  return user.key
}

function usage (args: any, help: string, usage: string) {
  console.log(help)
  if (usage) {
    console.log('')
    console.log(usage)
  }
}

const cmdOpts = {
  usage: {
    help: 'atek - Run the atek server',
    option: {
      name: 'help',
      abbr: 'h'
    },
    command: function (args: any, help: string, usage: string) {
      console.log(help)
      console.log('')
      console.log(usage)
      console.log('Commands:')
      for (const cmd of cmdOpts.commands) {
        console.log('  ', cmd.help || `atek ${cmd.name}`)
      }
    }
  },
  commands: [
    {
      name: 'run',
      help: 'atek run - Run the atek server',
      options: RUN_OPTS,
      usage,
      command: runCommand
    },
    {
      name: 'install',
      help: 'atek install {url_or_path} --user {owning_user} - Install a new service',
      usage,
      command: async (args: any) => {
        if (args._[0]) args.sourceUrl = args._[0]
        if (!args.sourceUrl) {
          console.error('URL or path is required:')
          console.error('atek install {url_or_path}')
          process.exit(1)
        }
        if (args.sourceUrl.startsWith('/')) {
          args.sourceUrl = `file://${args.sourceUrl}`
        }
        if (!args.user) {
          console.error('--user is required')
          console.error('(Specify "system" if installing for all users)')
          process.exit(1)
        }
        console.log(await apiCall(args, 'atek.cloud/services-api', 'install', [args]))
      }
    },
    {
      name: 'uninstall',
      help: 'atek uninstall {id} - Uninstall a service',
      usage,
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'uninstall', [args.id || args._[0]])
      }
    },
    {
      name: 'update',
      help: 'atek update {id} - Update a service installation from its source',
      usage,
      command: async (args: any) => {
        console.log(await apiCall(args, 'atek.cloud/services-api', 'updatePackage', [args.id || args._[0]]))
      }
    },
    {
      name: 'ls',
      help: 'atek ls - List active services',
      usage,
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
      help: 'atek get {id} - Get info about a service',
      usage,
      command: async (args: any) => {
        const srv = await apiCall(args, 'atek.cloud/services-api', 'get', [args.id || args._[0]])
        console.log(srv.settings.id, `(${srv.status})`)
        console.log(srv.settings)
      }
    },
    {
      name: 'cfg',
      help: 'atek cfg {id} ... - Configure a service or get its current configuration',
      usage,
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'configure', [args.id || args._[0], args])
      }
    },
    {
      name: 'start',
      help: 'atek start {id} - Start a service',
      usage,
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'start', [args.id || args._[0]])
      }
    },
    {
      name: 'stop',
      help: 'atek stop {id} - Stop a service',
      usage,
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'stop', [args.id || args._[0]])
      }
    },
    {
      name: 'restart',
      help: 'atek restart {id} - Restart a service',
      usage,
      command: async (args: any) => {
        await apiCall(args, 'atek.cloud/services-api', 'restart', [args.id || args._[0]])
      }
    },
    {
      name: 'mkuser',
      help: 'atek mkuser - Create a user',
      usage,
      command: async (args: any) => {
        const {username, password} = await createUserPrompt()
        await apiCall(args, 'atek.cloud/users-api', 'create', [{username, password}])
      },
    },
    {
      name: 'moduser',
      help: 'atek moduser {id} - Modify a user',
      usage,
      command: async (args: any) => {
        const username = args.id || args._[0]
        const userKey = await lookupUserKey(args, username)
        const {what} = await createModUserPrompt()
        if (what === 'Password') {
          const {password} = await createPasswordPrompt()
          await apiCall(args, 'atek.cloud/users-api', 'update', [userKey, {password}])
        }
      },
    },
    {
      name: 'deluser',
      help: 'atek deluser {id} - Delete a user',
      usage,
      command: async (args: any) => {
        const username = args.id || args._[0]
        const userKey = await lookupUserKey(args, username)
        if (await confirm(`Are you sure you want to delete ${username}?`, false)) {
          await apiCall(args, 'atek.cloud/users-api', 'delete', [userKey])
          console.log(username, `(key=${userKey}) deleted`)
        }
      }
    }
  ],
  root: {
    name: 'run',
    help: 'Run the atek server',
    options: [
      {name: 'version', abbr: 'v', help: 'Print the current version'},
      ...RUN_OPTS
    ],
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
}
const match = subcommand(cmdOpts)
const matchedCmd = match(process.argv.slice(2))