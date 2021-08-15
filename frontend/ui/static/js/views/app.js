import { LitElement, html } from '../../vendor/lit/lit.min.js'
import * as session from '../lib/session.js'
import * as toast from '../com/toast.js'
import { emit } from '../lib/dom.js'
import * as contextMenu from '../com/context-menu.js'
import '../com/button.js'
import '../com/header.js'

const TIMESTAMP_RE = /( (\d)+\/(\d)+\/(\d)+, (\d)+:(\d)+:(\d)+ (AM|PM))/g

class AppAppView extends LitElement {
  static get properties () {
    return {
      appId: {type: String},
      currentView: {type: String},
      currentPath: {type: String, attribute: 'current-path'},
      error: {type: String},
      app: {type: Object},
      showLogTimestamps: {type: Boolean},
      updaterState: {type: Object}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.error = undefined
    this.log = ''
    this.logStream = undefined
    this.showLogTimestamps = false
    this.updaterState = undefined
  }

  get appName () {
    return this.app?.manifest?.name || this.appId
  }

  async load () {
    document.title = `Home`
    if (!session.isActive()) {
      window.location = '/'
      return
    }

    const pathParts = window.location.pathname.split('/').filter(Boolean)
    let oldView = this.currentView
    this.appId = pathParts[2]
    this.currentView = pathParts[3] || 'properties'
    this.app = (await session.api.apps.get(this.appId))?.app
    console.log(this.app)

    if (!this.logStream) {
      try {
        this.logStream = await session.api.apps.logStream(this.appId)
        this.logStream.addEventListener('data', e => {
          this.log += e.detail.value
          if (this.currentView === 'log') {
            this.updateLogViewer()
          }
        })
      } catch (e) {
        console.debug('Failed to acquire log stream', e)
      }
    }

    if (oldView !== this.currentView && this.currentView === 'log') {
      await this.requestUpdate()
      this.updateLogViewer(true) // force scroll to bottom
    }
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  async updateLogViewer (forceScroll = false) {
    const el = this.querySelector('#log-viewer')
    const isNearBottom = (el.scrollHeight - (el.scrollTop + el.offsetHeight)) < 100
    el.value = this.logCleaned
    if (forceScroll || isNearBottom) {
      el.scrollTop = el.scrollHeight // autoscroll
    }
  }

  disconnectedCallback () {
    super.disconnectedCallback()
    this.logStream?.close()
  }

  get logCleaned () {
    if (this.showLogTimestamps) {
      return this.log
    }
    return this.log.replace(TIMESTAMP_RE, '')
  }

  // rendering
  // =

  render () {
    return html`
      <main class="min-h-screen bg-default-3">
        <app-header></app-header>
        <div class="max-w-4xl my-8 mx-auto bg-default rounded px-6 py-4">
          <div>
            <a class="hover:underline" href="/p/apps"><span class="fas fa-angle-left"></span> Apps</a>
          </div>
          <h1 class="text-5xl mb-4">${this.appName}</h1>
          ${this.renderAppHeader()}
          <div class="flex border border-default">
            <div class="border-r border-default">
              <a class="block px-4 py-2 ${this.currentView === 'properties' ? 'bg-default-2' : ''} hover:underline" href="/p/app/${this.appId}">Properties</a>
              <a class="block px-4 py-2 ${this.currentView === 'log' ? 'bg-default-2' : ''} hover:underline" href="/p/app/${this.appId}/log">Logs</a>
            </div>
            <div class="flex-1">
              ${this.renderAppCurrentView()}
            </div>
          </div>
        </div>
      </main>
    `
  }

  renderAppHeader () {
    if (!this.app) return html`<div><span class="spinner"></span></div>`
    return html`
      <div class="mb-4">
        ${this.app.package.sourceType === 'git' ? this.app.package.installedVersion : 'Local folder'}
        |
        ${this.app.package.sourceType === 'git' ? html`
          <a class="text-default-3 hover:underline" href=${this.app.sourceUrl} target="_blank">${this.app.sourceUrl}</a>
        ` : html`
          <span class="text-default-3">${this.app.sourceUrl}</span>
        `}
      </div>
      <div class="mb-6">
        <app-button label="Open" href="http://${window.location.hostname}:${this.app.port}" new-window></app-button>
        ${this.app.package.sourceType === 'git' ? html`<app-button transparent label="Check for updates" @click=${this.onClickCheckUpdates}></app-button>`: ''}
        <app-button transparent label="Uninstall" @click=${this.onClickUninstallApp}></app-button>
        <span class="inline-block">
          <a class="cursor-pointer px-2 py-0.5 hover:bg-default-2" @click=${this.onClickAppMenu}><span class="fas fa-ellipsis-h"></span></a>
        </span>
      </div>
      ${this.renderAppUpdater()}
    `
  }

  renderAppUpdater () {
    if (!this.updaterState) return ''
    let cls = 'bg-default-2'
    if (this.updaterState.status === 'error') cls = 'bg-error text-error font-medium'
    if (this.updaterState.status === 'update-available' || this.updaterState.status === 'update-installed') cls = 'bg-secondary text-inverse font-medium'
    return html`
      <div class="mb-6 px-4 py-3 rounded ${cls}">
        ${this.updaterState.status === 'processing' ? html`<span class="spinner"></span>` : ''}
        ${this.updaterState.status === 'no-update-available' ? html`<span class="fas fa-check-circle"></span>` : ''}
        ${this.updaterState.status === 'update-available' ? html`<span class="fas fa-download"></span>` : ''}
        ${this.updaterState.status === 'error' ? html`<span class="fas fa-exclamation-triangle"></span>` : ''}
        ${this.updaterState.status === 'update-installed' ? html`<span class="fas fa-check-circle"></span>` : ''}
        ${this.updaterState.message}
        ${this.updaterState.status === 'update-available' ? html`
          <span class="ml-2">
            <app-button label="Install Now" btn-class="bg-secondary text-inverse hover:bg-secondary-2 border border-inverse" @click=${this.onClickInstallUpdate}></app-button>
          </span>
        ` : ''}
      </div>
    `
  }

  renderAppCurrentView () {
    if (!this.app) return ''
    if (this.currentView === 'properties') {
      return this.renderAppProperties()
    }
    if (this.currentView === 'log') {
      return this.renderAppLog()
    }
  }

  renderAppProperties () {
    return html`
    ${this.app?.manifest ? html`
      <div class="px-5 py-3 border-b border-default text-lg">
        ${this.app?.manifest?.description ? html`<p>${this.app?.manifest?.description}</p>` : ''}
        ${this.app?.manifest?.author ? html`<p class="text-sm">By: <strong class="font-medium">${this.app?.manifest?.author}</strong></p>` : ''}
        ${this.app?.manifest?.license ? html`<p class="text-sm">License: <strong class="font-medium">${this.app?.manifest?.license}</strong></p>` : ''}
      </div>
    ` : ''}
      <div class="px-5 py-3 border-b border-default">
        <p class="text-sm">
          ${this.app.isActive ? html`
            <span class="text-secondary"><span class="fas fa-circle"></span> Process is currently running</span>
          ` : html`
            <span class="text-default-4"><span class="fas fa-circle"></span> Process is not currently running</span>
          `}
        </p>
      </div>
      <div class="px-5 py-3 text-default-3">
        <form id="app-properties">
          <label class="block font-semibold p-1" for="sourceUrl-input">Source</label>
          <input
            autofocus
            type="text"
            id="sourceUrl-input"
            name="sourceUrl"
            value="${this.app.sourceUrl}"
            class="block box-border w-full p-3 mb-1 border border-default rounded"
            placeholder="Enter the Git URL or folder location of your app"
          />
          <label class="block font-semibold p-1" for="port-input">Port</label>
          <input
            autofocus
            type="text"
            id="port-input"
            name="port"
            value="${this.app.port}"
            class="block box-border w-24 p-3 mb-1 border border-default rounded"
            placeholder=""
          />
          ${this.app.package.sourceType === 'git' ? html`
            <label class="block font-semibold p-1" for="desiredVersion-input">Desired Version</label>
            <input
              autofocus
              type="text"
              id="desiredVersion-input"
              name="desiredVersion"
              value="${this.app.desiredVersion}"
              placeholder="latest"
              class="block box-border w-48 p-3 mb-4 border border-default rounded"
            />
          ` : html`
          `}
          ${this.error ? html`
            <div class="bg-error text-error mb-4 rounded px-4 py-2">
              ${this.error}
            </div>
          ` : ''}
          <div class="text-right">
            <app-button primary label="Save${this.app.isActive ? ' and restart' : ''}" btn-class="px-4 py-2" @click=${this.onClickSaveProperties}></app-button>
          </div>
        </form>
      </div>
    `
  }

  renderAppLog () {
    return html`
      <div class="px-2 py-2 text-sm border-b border-default">
        <label class="flex items-center"><input type="checkbox" ?checked=${this.showLogTimestamps} @change=${this.onToggleTimestamps}> <span class="ml-1">Show timestamps</span></label>
      </div>
      <textarea id="log-viewer" class="px-2 w-full h-96 bg-default-2 font-mono text-xs whitespace-pre resize-none" readonly>
        ${this.logCleaned}
      </textarea>
    `
  }

  // events
  // =

  async onClickAppMenu (e) {
    e.preventDefault()
    e.stopPropagation()
    
    let items = []
    if (this.app.isActive) {
      items.push({label: 'Restart', click: () => this.onClickRestartApp()})
      items.push({label: 'Stop', click: () => this.onClickStopApp()})
    } else {
      items.push({label: 'Start', click: () => this.onClickStartApp()})
    }

    contextMenu.create({
      parent: e.currentTarget.parentNode,
      noBorders: true,
      style: `padding: 4px 0`,
      items
    })
  }

  async onClickStartApp (e) {
    e?.preventDefault()
    await session.api.apps.start(this.appId)
    this.load()
  }

  async onClickRestartApp (e) {
    e?.preventDefault()
    await session.api.apps.restart(this.appId)
    this.load()
  }

  async onClickStopApp (e) {
    e?.preventDefault()
    await session.api.apps.stop(this.appId)
    this.load()
  }

  async onClickUninstallApp (e) {
    e?.preventDefault()
    if (!confirm(`Uninstall ${this.appId}?`)) return
    await session.api.apps.uninstall(this.appId)
    emit(this, 'navigate-to', {detail: {url: '/p/apps'}})
  }

  async onClickCheckUpdates () {
    this.updaterState = {status: 'processing', message: 'Checking for updates...'}
    try {
      let status = await session.api.apps.checkForPackageUpdates(this.appId)
      if (status.hasUpdate) {
        this.updaterState = {status: 'update-available', message: `Update available: v${status.latestVersion} can now be installed!`}
      } else {
        this.updaterState = {status: 'no-update-available', message: `Your app is up-to-date!`}
      }
    } catch (e) {
      this.updaterState = {status: 'error', message: e.toString()}
    }
  }

  async onClickInstallUpdate () {
    this.updaterState = {status: 'processing', message: 'Installing update...'}
    try {
      let status = await session.api.apps.updatePackage(this.appId)
      console.log(status)
      if (this.app.isActive) {
        this.updaterState = {status: 'processing', message: 'Restarting...'}
        await session.api.apps.restart(this.appId)
      }
      this.updaterState = {status: 'update-installed', message: `Update complete: v${status.installedVersion} is now installed!`}
      this.load()
    } catch (e) {
      this.updaterState = {status: 'error', message: e.toString()}
    }
  }

  onToggleTimestamps () {
    this.showLogTimestamps = !this.showLogTimestamps
    this.updateLogViewer()
  }

  async onClickSaveProperties (e) {
    e.preventDefault()
    this.error = undefined
    try {
      const data = new FormData(this.querySelector('form#app-properties'))
      const updates = Object.fromEntries(data.entries())
      if (updates.port) updates.port = Number(updates.port)
      await session.api.apps.updateConfig(this.appId, updates)
      if (this.app.isActive) {
        await session.api.apps.restart(this.appId)
      }
      toast.create('Settings updated', 'success')
      this.load()
    } catch (e) {
      this.error = e.toString()
    }
  }
}

customElements.define('app-app-view', AppAppView)