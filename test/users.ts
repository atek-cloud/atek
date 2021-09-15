import test from 'ava'
import path from 'path'
import { fileURLToPath } from 'url'
import * as atek from '../dist/index.js'

const AUTH_APP1_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'util', 'auth-app-1')
const AUTH_APP2_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'util', 'auth-app-2')

let inst: any
test.after(async () => {
  await inst.close()
})

test.serial('Load test instance', async t => {
  const cfg = new atek.test.Config()
  inst = await atek.test.startAtek(cfg)
  t.pass('Test instance loaded')
})

test.serial('Create, list, get, update, delete users', async t => {
  const usersapi = inst.api('atek.cloud/users-api')
  
  const {users} = await usersapi.call('list')
  t.is(users.length, 0, 'No users created initially')

  const newUserRes = await usersapi.call('create', [{username: 'bob', password: 'hunter2'}])
  t.is(typeof newUserRes.key, 'string', 'New user created')
  t.is(newUserRes.username, 'bob', 'New user created')

  const {users: users2} = await usersapi.call('list')
  t.is(users2.length, 1, 'Now 1 user active')

  const getRes = await usersapi.call('get', [newUserRes.key])
  t.deepEqual(newUserRes, getRes, 'get() provies correct info')
  
  const updateRes = await usersapi.call('update', [newUserRes.key, {username: 'bobo', role: 'admin'}])
  t.is(updateRes.key, newUserRes.key, 'update() provies correct info')
  t.is(updateRes.username, 'bobo', 'update() changes username')
  t.is(updateRes.role, 'admin', 'update() changes role')

  const getRes2 = await usersapi.call('get', [newUserRes.key])
  t.deepEqual(updateRes, getRes2, 'get() is correct')

  await usersapi.call('delete', [newUserRes.key])
  const {users: users3} = await usersapi.call('list')
  t.is(users3.length, 0, 'Delete successful')
})

test.serial('Login, whoami, logout', async t => {
  const usersapi = inst.api('atek.cloud/users-api')
  const sessapi = inst.api('atek.cloud/user-sessions-api', {noAuth: true})
  
  await usersapi.call('create', [{username: 'bob', password: 'hunter2'}])

  const sess1 = await sessapi.call('whoami', [])
  t.is(sess1.isActive, false, 'Session not yet active')

  const sess2 = await sessapi.call('login', [{username: 'bob', password: 'hunter2'}])
  t.is(sess2.isActive, true, 'Session now active')
  t.is(sess2.username, 'bob', 'Session now active')
  
  const sess3 = await sessapi.call('whoami', [])
  t.is(sess3.isActive, true, 'Session now active')
  t.is(sess3.username, 'bob', 'Session now active')

  await sessapi.call('logout', [])
  const sess4 = await sessapi.call('whoami', [])
  t.is(sess4.isActive, false, 'Session now inactive')
})

test.serial('Services receive auth headers', async t => {
  const srvapi = inst.api('atek.cloud/services-api')
  const authApp1Api = inst.api('auth-app-one.com/api')
  const usersapi = inst.api('atek.cloud/users-api')
  const sessapi = inst.api('atek.cloud/user-sessions-api', {noAuth: true})
  
  const installRes = await srvapi.call('install', [{sourceUrl: `file://${AUTH_APP1_PATH}`}])
  t.is(installRes.status, 'active', 'New service is active')

  const installRes2 = await srvapi.call('install', [{sourceUrl: `file://${AUTH_APP2_PATH}`}])
  t.is(installRes2.status, 'active', 'New service is active')

  const headers1 = await authApp1Api.call('getAuthHeaders', [])
  t.is(headers1.user, 'system', 'System user')
  t.falsy(headers1.service, 'No service')

  const headers2 = await authApp1Api.call('getAuthHeadersFromApp2', [])
  t.is(headers2.user, 'system', 'System user') // owning user is system because system installed the app
  t.is(headers2.service, installRes.key, 'Auth-app-1 service')

  const user = await usersapi.call('create', [{username: 'bob2', password: 'hunter2'}])
  await sessapi.call('login', [{username: 'bob2', password: 'hunter2'}])
  
  const authApp1ApiCookieAuth = inst.api('auth-app-one.com/api', {noAuth: true})
  sessapi.copyCookiesTo(authApp1ApiCookieAuth.cookieJar)

  const headers3 = await authApp1ApiCookieAuth.call('getAuthHeaders', [])
  t.is(headers3.user, user.key, 'bob2 user')
  t.falsy(headers3.service, 'No service')
})