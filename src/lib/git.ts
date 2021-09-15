import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node/index.js'
import * as fs from 'fs'
import { Config } from '../config.js'
import semver from 'semver'

export interface PackageVersion {
  version: string
  tag: string
}

export async function clone (id: string, url: string): Promise<string> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  await fs.promises.mkdir(dir, {recursive: true})
  try {
    console.log('git clone', url, dir)
    await git.clone({fs, http, dir, url})
  } catch (e: any) {
    if (!url.endsWith('.git') && e.toString().includes('404')) {
      return clone(id, url + '.git')
    }
    throw e
  }
  return dir
}

export async function fetch (id: string): Promise<void> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  console.log('git fetch', dir)
  await git.fetch({fs, http, dir, tags: true})
}

export async function checkout (id: string, version: string): Promise<void> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  await git.checkout({fs, dir, ref: version, force: true})
}

export async function listVersions (id: string): Promise<PackageVersion[]> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  const tags = await git.listTags({fs, dir})
  return tags
    .map((tag: string) => ({tag, version: (semver.valid(semver.coerce(tag)) as string)}))
    .filter(v => typeof v.version === 'string')
}

export async function getCurrentVersion (id: string): Promise<string|undefined> {
  const dir = Config.getActiveConfig().packageInstallPath(id)
  const head = await git.resolveRef({fs, dir, ref: 'HEAD'})
  const tags = await git.listTags({fs, dir})
  let currentTag
  for (let tag of tags) {
    if (await git.resolveRef({fs, dir, ref: tag}) === head) {
      currentTag = tag
      break
    }
  }
  return currentTag && semver.valid(semver.coerce(currentTag)) ? currentTag : undefined
}

export async function getLatestVersion (id: string, spec: string): Promise<string> {
  let versions = await listVersions(id)
  if (versions.length === 0) {
    throw new Error(`No release (git tag) has been set for ${id}`)
  }
  if (spec && spec !== 'latest') {
    versions = versions.filter(tag => semver.satisfies(tag.version, spec))
    if (versions.length === 0) {
      throw new Error(`No release (git tag) available for ${id} which matches the desired version of ${spec}`)
    }
  }
  versions = versions.sort((a, b) => semver.rcompare(a.version, b.version))
  return versions[0]?.tag
}