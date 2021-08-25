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
  const cfg = new atek.test.Config({
    coreServices: [
      {
        sourceUrl: 'https://github.com/atek-cloud/hyper-daemon',
        config: {SIMULATE_HYPERSPACE: '1'}
      },
      {sourceUrl: 'https://github.com/atek-cloud/adb'}
    ]
  })
  inst = await atek.test.startAtek(cfg)
  t.pass('Test instance loaded')
})

test('Install, configure, and uninstall a service', async t => {
  const srvapi = await inst.api('atek.cloud/services-api')
  
  const {services} = await srvapi('list')
  t.is(services.length, 2, 'Only 2 core services active initially')

  const installRes = await srvapi('install', [{sourceUrl: `file://${SIMPLE_APP_PATH}`}])
  t.is(installRes.status, 'active', 'New service is active')
  t.is(typeof installRes.settings.id, 'string', 'ID is assigned')
  t.is(typeof installRes.settings.port, 'number', 'Port is assigned')
  t.is(installRes.settings.sourceUrl, `file://${SIMPLE_APP_PATH}`, 'Source URL is correct')
  t.is(installRes.settings.package.sourceType, 'file', 'Source type is correct')
  t.is(installRes.settings.manifest.name, `NAME`, 'Manifest is correct')
  t.is(installRes.settings.manifest.description, `DESCRIPTION`, 'Manifest is correct')
  t.is(installRes.settings.manifest.author, `AUTHOR`, 'Manifest is correct')
  t.is(installRes.settings.manifest.license, `LICENSE`, 'Manifest is correct')

  const {services: services2} = await srvapi('list')
  t.is(services2.length, 3, 'Now 3 services active')

  const getRes = await srvapi('get', [installRes.settings.id])
  t.deepEqual(installRes, getRes, 'get() provies correct info')

  await srvapi('uninstall', [installRes.settings.id])
  const {services: services3} = await srvapi('list')
  t.is(services3.length, 2, 'Uninstall successful')
})