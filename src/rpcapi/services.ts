import { AtekRpcServer } from '@atek-cloud/node-rpc'
import { createServer, ServiceInfo, InstallOpts, ConfigureOpts } from '@atek-cloud/services-api'
import * as services from '../services/index.js'

export function setup (): AtekRpcServer  {
  return createServer({
    list (): Promise<{services: ServiceInfo[]}> {
      return Promise.resolve({services: services.list().map(s => s.toJSON())})
    },

    // Fetch information about an installed service.
    get (id: string): Promise<ServiceInfo> {
      const service = services.get(id)
      if (service) return Promise.resolve(service.toJSON())
      throw new Error(`No service found with id ${id}`)
    },

    // Install a new service.
    async install (opts: InstallOpts): Promise<ServiceInfo> {
      const service = await services.install(opts, 'system')
      if (service) return Promise.resolve(service.toJSON())
      throw new Error(`No service created by install`)
    },

    // Uninstall a service.
    async uninstall (id: string): Promise<void> {
      await services.uninstall(id)
    },

    // Change the settings of a service.
    async configure (id: string, opts: ConfigureOpts): Promise<void> {
      await services.updateConfig(id, opts)
    },

    // Start a service process.
    async start (id: string): Promise<void> {
      await services.get(id)?.start()
    },

    // Stop a service process.
    async stop (id: string): Promise<void> {
      await services.get(id)?.stop()
    },

    // Restart a service process.
    async restart (id: string): Promise<void> {
      await services.get(id)?.restart()
    },

    // Query the source package for software updates.
    checkForPackageUpdates (id: string): Promise<{hasUpdate: boolean, installedVersion: string, latestVersion: string}> {
      return services.checkForPackageUpdates(id)
    },

    // Update the service to the highest version which matches "desiredVersion".
    updatePackage (id: string): Promise<{installedVersion: string, oldVersion: string}> {
      return services.updatePackage(id)
    }
  })
}