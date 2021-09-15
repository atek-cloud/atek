import { createServer } from '@atek-cloud/inspect-api'
import { Config } from '../config.js'

export function setup () {
  return createServer({
    isReady () {
      this.session.assertIsAdminAuthed()
      return true
    },
    getConfig () {
      this.session.assertIsAdminAuthed()
      return Config.getActiveConfig().values
    }
  })
}