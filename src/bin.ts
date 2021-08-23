#!/usr/bin/env node

import subcommand from 'subcommand'
import * as server from './index.js'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import { DEFAULT_REPL_PORT } from './lib/config.js'
import * as net from 'net'

const PACKAGE_JSON_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json')

function startCommand (args: any): void {
  server.start({
    simulateHyperspace: false,
    debugMode: false,
    port: args.port,
    domain: args.domain,
    configDir: args.configDir,
    hyperspaceHost: args.hyperspaceHost,
    hyperspaceStorage: args.hyperspaceStorage,
  })
}

const match = subcommand({
  commands: [
    {
      name: 'start',
      command: startCommand
    },
    {
      name: 'start-test',
      command: (args: any) => {
        if (!args.configDir) throw new Error('--configDir required')
        if (!args.domain) throw new Error('--domain required')
        server.start({
          simulateHyperspace: true,
          debugMode: true,
          port: args.port,
          domain: args.domain,
          configDir: args.configDir,
          hyperspaceHost: undefined,
          hyperspaceStorage: undefined
        })
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
        startCommand(args)
      }
    }
  }
})
const cmd = match(process.argv.slice(2))