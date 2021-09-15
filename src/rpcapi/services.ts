import { AtekRpcServer } from '@atek-cloud/node-rpc'
import { createServer, ServiceInfo, InstallOpts, ConfigureOpts } from '@atek-cloud/services-api'
import { users } from '@atek-cloud/adb-tables'
import * as serverdb from '../serverdb/index.js'
import * as services from '../services/index.js'
import { Session } from '../httpapi/session-middleware.js'

export function setup (): AtekRpcServer  {
  return createServer({
    list (): Promise<{services: ServiceInfo[]}> {
      this.session.assertIsAuthed()
      let items = services.list()
      if (!this.session.isAdminAuthed()) {
        items = items.filter(item => item.owningUserKey === this.session.auth.userKey)
      }
      return Promise.resolve({services: items.map(s => s.toJSON())})
    },

    // Fetch information about an installed service.
    get (id: string): Promise<ServiceInfo> {
      this.session.assertIsAuthed()
      assertCanAccess(id, this.session)
      const service = services.get(id)
      if (service) return Promise.resolve(service.toJSON())
      throw new Error(`No service found with id ${id}`)
    },

    // Install a new service.
    async install (opts: InstallOpts): Promise<ServiceInfo> {
      this.session.assertIsAuthed()

      let userKey = this.session.auth.userKey
      if (opts.user) {
        this.session.assertIsAdminAuthed()
        const userRecords = (await users(serverdb.get()).list()).records
        const userRecord = await userRecords.find((r: any) => r.value.username === opts.user)
        if (!userRecord) throw new Error(`No user found with the username of ${opts.user}`)
        userKey = userRecord.key
      }

      const service = await services.install(opts, userKey)
      if (service) return Promise.resolve(service.toJSON())
      throw new Error(`No service created by install`)
    },

    // Uninstall a service.
    async uninstall (id: string): Promise<void> {
      assertCanAccess(id, this.session)
      await services.uninstall(id)
    },

    // Change the settings of a service.
    async configure (id: string, opts: ConfigureOpts): Promise<void> {
      assertCanAccess(id, this.session)
      await services.updateConfig(id, opts)
    },

    // Start a service process.
    async start (id: string): Promise<void> {
      assertCanAccess(id, this.session)
      await services.get(id)?.start()
    },

    // Stop a service process.
    async stop (id: string): Promise<void> {
      assertCanAccess(id, this.session)
      await services.get(id)?.stop()
    },

    // Restart a service process.
    async restart (id: string): Promise<void> {
      assertCanAccess(id, this.session)
      await services.get(id)?.restart()
    },

    // Query the source package for software updates.
    checkForPackageUpdates (id: string): Promise<{hasUpdate: boolean, installedVersion: string, latestVersion: string}> {
      assertCanAccess(id, this.session)
      return services.checkForPackageUpdates(id)
    },

    // Update the service to the highest version which matches "desiredVersion".
    updatePackage (id: string): Promise<{installedVersion: string, oldVersion: string}> {
      assertCanAccess(id, this.session)
      return services.updatePackage(id)
    }
  })
}

function canAccess (id: string, session: Session) {
  if (!session.isAuthed()) return false
  const service = services.get(id)
  if (!service) return false
  if (session.isAdminAuthed()) return true
  return (service.owningUserKey === session.auth?.userKey)
}

function assertCanAccess (id: string, session: Session) {
  if (!canAccess(id, session)) throw new Error('Not authorized')
}