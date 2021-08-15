import { API } from '/dev/api-client/index.js'

let emitter = new EventTarget()
export let api = new API({origin: location.origin, fetch: (...args) => window.fetch(...args)})
export let info = undefined

export async function setup () {
  window.api = api
  api.session.onChange(() => {info = api.session.info})
  await api.session.setup()
  loadSecondaryState()
}

export async function loadSecondaryState () {
  if (!api.session.isActive()) {
    return
  }
  // TODO - needed?
  emitter.dispatchEvent(new Event('secondary-state'))
}

export function isActive () {
  return api.session.isActive()
}

export function onChange (cb) {
  return api.session.onChange(cb)
}

export function onSecondaryState (cb, opts) {
  emitter.addEventListener('secondary-state', cb, opts)
}

export function unOnSecondaryState (cb) {
  emitter.removeEventListener('secondary-state', cb)
}
