import test from 'ava'
import * as atek from '../dist/index.js'

let inst: any
let activeCfg: any
test.after(async () => {
  await inst.close()
})

test.serial('Correctly loads core services (hyper, adb) and creates server db', async t => {
  const cfg = new atek.test.Config()
  inst = await atek.test.startAtek(cfg)

  activeCfg = await inst.api('atek.cloud/inspect-api').call('getConfig')
  t.truthy(activeCfg.serverDbId, 'Server DB ID was created')
  t.is(activeCfg.coreServices.length, 2, 'Core services config match what we passed')
  t.is(activeCfg.coreServices[0].sourceUrl, cfg.coreServices[0].sourceUrl, 'Core services config match what we passed')
  t.deepEqual(activeCfg.coreServices[0].config, cfg.coreServices[0].config, 'Core services config match what we passed')
  t.is(activeCfg.coreServices[1].sourceUrl, cfg.coreServices[1].sourceUrl, 'Core services config match what we passed')
  t.truthy(activeCfg.coreServices[0].id, 'Core services are active')
  t.truthy(activeCfg.coreServices[1].id, 'Core services are active')
})

test.serial('Routes calls to the server db', async t => {
  const desc = await inst.api('atek.cloud/adb-api').call('dbDescribe', [activeCfg.serverDbId])
  t.truthy(desc, 'Returns a description object')
  t.is(desc.dbId, activeCfg.serverDbId, 'Gave the correct database\'s description')
  t.truthy(desc.tables.find((table: any) => table.tableId === 'atek.cloud/database'), 'Registered atek.cloud/database')
  t.truthy(desc.tables.find((table: any) => table.tableId === 'atek.cloud/user'), 'Registered atek.cloud/user')
  t.truthy(desc.tables.find((table: any) => table.tableId === 'atek.cloud/user-session'), 'Registered atek.cloud/user-session')
  t.truthy(desc.tables.find((table: any) => table.tableId === 'atek.cloud/service'), 'Registered atek.cloud/service')
})
