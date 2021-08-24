import test from 'ava'
import { startAtek } from './_util/index.js'

test('Correctly loads core services (hyper, adb), creates server db, and routes calls to it', async t => {
  const cfg = {
    coreServices: [
      {
        sourceUrl: 'file:///Users/paulfrazee/work/atek/hyper-daemon', //'https://github.com/atek-cloud/hyper-daemon',
        config: {SIMULATE_HYPERSPACE: '1'}
      },
      {sourceUrl: 'https://github.com/atek-cloud/adb'}
    ]
  }
  const inst = await startAtek(cfg)

  const activeCfg = await inst.apis.inspect('getConfig')
  t.truthy(activeCfg.serverDbId, 'Server DB ID was created')
  t.is(activeCfg.coreServices.length, 2, 'Core services config match what we passed')
  t.is(activeCfg.coreServices[0].sourceUrl, cfg.coreServices[0].sourceUrl, 'Core services config match what we passed')
  t.deepEqual(activeCfg.coreServices[0].config, cfg.coreServices[0].config, 'Core services config match what we passed')
  t.is(activeCfg.coreServices[1].sourceUrl, cfg.coreServices[1].sourceUrl, 'Core services config match what we passed')
  t.truthy(activeCfg.coreServices[0].id, 'Core services are active')
  t.truthy(activeCfg.coreServices[1].id, 'Core services are active')
  t.truthy(activeCfg.coreServices[0].port, 'Core services are active')
  t.truthy(activeCfg.coreServices[1].port, 'Core services are active')

  await inst.close()
})