import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import * as fs from 'fs'
import { Config } from './config.js'
import semver from 'semver'

export async function clone (id: string, url: string): Promise<string> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  await fs.promises.mkdir(dir, {recursive: true})
  try {
    await git.clone({fs, http, dir, url})
  } catch (e) {
    if (!url.endsWith('.git') && e.toString().includes('404')) {
      return clone(id, url + '.git')
    }
    throw e
  }
  return dir
}

export async function fetch (id: string): Promise<void> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  await git.fetch({fs, http, dir, tags: true})
}

export async function checkout (id: string, version: string): Promise<void> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  await git.checkout({fs, dir, ref: version})
}

export async function listVersions (id: string): Promise<string[]> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  const tags = await git.listTags({fs, dir})
  return tags.map(tag => semver.valid(semver.coerce(tag))).filter(tag => typeof tag === 'string')
}

export async function getLatestVersion (id: string, spec: string): Promise<string> {
  let tags = await listVersions(id)
  if (spec && spec !== 'latest') {
    tags = tags.filter(tag => semver.satisfies(tag, spec))
  }
  tags = tags.sort((a, b) => semver.rcompare(a, b))
  return tags[0]
}