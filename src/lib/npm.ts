import { promises as fsp } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'
import { Config } from '../config.js'

interface PackageJson {
  scripts?: {
    build?: string
  }
}

// exported api
// =

export async function setupPackage (id: string, dir: string) {
  const packageJson = await readPackageJson(dir)
  if (!packageJson) return console.log("no package.json")
  console.log('Installing dependencies for', id, 'in', dir)
  await runInstall(dir)
  if (packageJson.scripts?.build) {
    console.log('Building', id, 'in', dir)
    await runBuild(dir)
  }
}

// internal methods
// =

function runInstall (dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`npm install`, {cwd: dir}, (err, stdout, stderr) => {
      if (stdout) console.log(stdout)
      if (stderr) console.log(stderr)
      if (err) reject(err)
      else resolve()
    })
  })
}

function runBuild (dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`npm run build`, {cwd: dir}, (err, stdout, stderr) => {
      if (stdout) console.log(stdout)
      if (stderr) console.log(stderr)
      if (err) reject(err)
      else resolve()
    })
  })
}

async function readPackageJson (dir: string): Promise<PackageJson|undefined> {
  try {
    return JSON.parse(await fsp.readFile(join(dir, 'package.json'), 'utf8'))
  } catch (e) {
    return undefined
  }
}