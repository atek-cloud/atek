import test from 'ava'
import path from 'path'
import { fileURLToPath } from 'url'
import * as atek from '../dist/index.js'

const SIMPLE_APP_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'util', 'simple-app')

let inst: any
test.after(async () => {
  await inst.close()
})

test.serial('Load test instance', async t => {
  const cfg = new atek.test.Config()
  inst = await atek.test.startAtek(cfg)
  t.pass('Test instance loaded')
})

test.serial('Install, configure, and uninstall a service', async t => {
  const srvapi = inst.api('atek.cloud/services-api')
  
  const {services} = await srvapi.call('list')
  t.is(services.length, 2, 'Only 2 core services active initially')

  const installRes = await srvapi.call('install', [{sourceUrl: `file://${SIMPLE_APP_PATH}`}])
  t.is(installRes.status, 'active', 'New service is active')
  t.is(typeof installRes.settings.id, 'string', 'ID is assigned')
  t.is(installRes.settings.sourceUrl, `file://${SIMPLE_APP_PATH}`, 'Source URL is correct')
  t.is(installRes.settings.package.sourceType, 'file', 'Source type is correct')
  t.is(installRes.settings.manifest.name, `NAME`, 'Manifest is correct')
  t.is(installRes.settings.manifest.description, `DESCRIPTION`, 'Manifest is correct')
  t.is(installRes.settings.manifest.author, `AUTHOR`, 'Manifest is correct')
  t.is(installRes.settings.manifest.license, `LICENSE`, 'Manifest is correct')

  const {services: services2} = await srvapi.call('list')
  t.is(services2.length, 3, 'Now 3 services active')

  const getRes = await srvapi.call('get', [installRes.settings.id])
  t.deepEqual(installRes, getRes, 'get() provies correct info')

  await srvapi.call('uninstall', [installRes.settings.id])
  const {services: services3} = await srvapi.call('list')
  t.is(services3.length, 2, 'Uninstall successful')
})

test.serial('Limited API access to non-admin users', async t => {
  const usersapi = inst.api('atek.cloud/users-api')
  const sessapi1 = inst.api('atek.cloud/user-sessions-api', {noAuth: true})
  const srvapi1 = inst.api('atek.cloud/services-api', {noAuth: true})
  const sessapi2 = inst.api('atek.cloud/user-sessions-api', {noAuth: true})
  const srvapi2 = inst.api('atek.cloud/services-api', {noAuth: true})

  await usersapi.call('create', [{username: 'non-admin-1', password: 'hunter2'}])
  await sessapi1.call('login', [{username: 'non-admin-1', password: 'hunter2'}])
  sessapi1.copyCookiesTo(srvapi1.cookieJar)

  const {services} = await srvapi1.call('list')
  t.is(services.length, 0, 'No core services listed')

  const installRes = await srvapi1.call('install', [{sourceUrl: `file://${SIMPLE_APP_PATH}`}])
  t.is(installRes.status, 'active', 'New service is active')

  const {services: services2} = await srvapi1.call('list')
  t.is(services2.length, 1, 'Now 1 service active')

  const getRes = await srvapi1.call('get', [installRes.settings.id])
  t.deepEqual(installRes, getRes, 'get() provies correct info')

  await usersapi.call('create', [{username: 'non-admin-2', password: 'hunter2'}])
  await sessapi2.call('login', [{username: 'non-admin-2', password: 'hunter2'}])
  sessapi2.copyCookiesTo(srvapi2.cookieJar)

  const {services: services3} = await srvapi2.call('list')
  t.is(services3.length, 0, 'No services listed')

  t.truthy(await srvapi2.call('get', [installRes.settings.id]).then((res: any) => false, (err: any) => true), 'Cant get somebody elses service')

  await srvapi1.call('uninstall', [installRes.settings.id])
})

test.serial('Change a service ID after install', async t => {
  const srvapi = inst.api('atek.cloud/services-api')
  
  const {services} = await srvapi.call('list')
  t.is(services.length, 2, 'Only 2 core services active initially')

  const installRes = await srvapi.call('install', [{id: 'test1', sourceUrl: `file://${SIMPLE_APP_PATH}`}])
  t.is(installRes.status, 'active', 'New service is active')
  t.is(installRes.settings.id, 'test1', 'ID is correct')

  const getRes1 = await srvapi.call('get', ['test1'])
  t.is(getRes1.settings.id, 'test1', 'Initial ID is correct')

  await srvapi.call('configure', ['test1', {id: 'test2'}])

  const getRes2 = await srvapi.call('get', ['test2'])
  t.is(getRes2.settings.id, 'test2', 'ID is correctly changed')

  await srvapi.call('uninstall', ['test2'])
  const {services: services3} = await srvapi.call('list')
  t.is(services3.length, 2, 'Uninstall successful')
})
