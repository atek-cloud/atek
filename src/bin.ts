#!/usr/bin/env node

import subcommand from 'subcommand'
import * as server from './index.js'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

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