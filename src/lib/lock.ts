import AwaitLock from 'await-lock'

// wraps await-lock in a simpler interface, with many possible locks
interface LocksMap {
  [key: string]: AwaitLock
}
var locks: LocksMap = {}

/**
 * Create a new lock
 * @example
 * var lock = require('./lock')
 * async function foo () {
 *   var release = await lock('bar')
 *   // ...
 *   release()
 * }
 */
export default async function (key: string): Promise<() => void> {
  if (!(key in locks)) locks[key] = new AwaitLock.default()

  var lock = locks[key]
  await lock.acquireAsync()
  return lock.release.bind(lock)
};