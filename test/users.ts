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

test.serial('Create, list, get, update, delete users', async t => {
  const usersapi = await inst.api('atek.cloud/users-api')
  
  const {users} = await usersapi('list')
  t.is(users.length, 0, 'No users created initially')

  const newUserRes = await usersapi('create', [{username: 'bob', password: 'hunter2'}])
  t.is(typeof newUserRes.key, 'string', 'New user created')
  t.is(newUserRes.username, 'bob', 'New user created')

  const {users: users2} = await usersapi('list')
  t.is(users2.length, 1, 'Now 1 user active')

  const getRes = await usersapi('get', [newUserRes.key])
  t.deepEqual(newUserRes, getRes, 'get() provies correct info')
  
  const updateRes = await usersapi('update', [newUserRes.key, {username: 'bobo', role: 'admin'}])
  t.is(updateRes.key, newUserRes.key, 'update() provies correct info')
  t.is(updateRes.username, 'bobo', 'update() changes username')
  t.is(updateRes.role, 'admin', 'update() changes role')

  const getRes2 = await usersapi('get', [newUserRes.key])
  t.deepEqual(updateRes, getRes2, 'get() is correct')

  await usersapi('delete', [newUserRes.key])
  const {users: users3} = await usersapi('list')
  t.is(users3.length, 0, 'Delete successful')
})

test.serial('Login, whoami, logout', async t => {
  const usersapi = await inst.api('atek.cloud/users-api')
  const sessapi = await inst.api('atek.cloud/user-sessions-api')
  
  await usersapi('create', [{username: 'bob', password: 'hunter2'}])

  const sess1 = await sessapi('whoami', [])
  t.is(sess1.isActive, false, 'Session not yet active')

  const sess2 = await sessapi('login', [{username: 'bob', password: 'hunter2'}])
  t.is(sess2.isActive, true, 'Session now active')
  t.is(sess2.username, 'bob', 'Session now active')
  
  const sess3 = await sessapi('whoami', [])
  t.is(sess3.isActive, true, 'Session now active')
  t.is(sess3.username, 'bob', 'Session now active')

  await sessapi('logout', [])
  const sess4 = await sessapi('whoami', [])
  t.is(sess4.isActive, false, 'Session now inactive')
})