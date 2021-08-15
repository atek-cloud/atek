import { LitElement, html } from '../../vendor/lit/lit.min.js'
import * as session from '../lib/session.js'
import { emit } from '../lib/dom.js'
import '../com/button.js'
import '../com/header.js'

class AppInstallAppView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      sourceUrl: {type: String},
      desiredVersion: {type: String},
      installerState: {type: Object}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.sourceUrl = ''
    this.desiredVersion = ''
    this.installerState = undefined
  }

  async load () {
    document.title = `Install App`
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  get sourceType () {
    const sourceUrl = this.sourceUrl
    if (sourceUrl.startsWith('/') || sourceUrl.startsWith('file://')) {
      return 'file'
    }
    if (sourceUrl) {
      return 'git'
    }
    return ''
  }

  get isProcessing () {
    return this.installerState?.status === 'processing' || this.installerState?.status === 'installed'
  }

  get canSubmit () {
    if (this.isProcessing) {
      return false
    }
    return !!this.sourceUrl
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
          <h1 class="text-5xl mb-4">Install New App</h1>
          <form id="app-properties">
            <div class="flex">
              <div class="flex-1">
                <label class="block font-semibold p-1" for="sourceUrl-input">Source</label>
                <input
                  autofocus
                  type="text"
                  id="sourceUrl-input"
                  name="sourceUrl"
                  class="block box-border w-full p-3 border border-default rounded"
                  placeholder="Enter the Git URL or folder location of your app"
                  @keyup=${this.onChangeSourceUrl}
                  @change=${this.onChangeSourceUrl}
                  ?disabled=${this.isProcessing}
                />
              </div>
              ${this.sourceType === 'git' ? html`
                <div class="ml-2">
                  <label class="block font-semibold p-1" for="desiredVersion-input">Desired Version</label>
                  <input
                    autofocus
                    type="text"
                    id="desiredVersion-input"
                    name="desiredVersion"
                    class="block box-border w-48 p-3 border border-default rounded"
                    placeholder="latest"
                    @keyup=${this.onChangeDesiredVersion}
                    @change=${this.onChangeDesiredVersion}
                  ?disabled=${this.isProcessing}
                  />
                </div>
              ` : html`
              `}
            </div>
            ${this.renderInstallerState()}
            ${this.isProcessing ? '' : html`
              <div class="mt-4 text-right">
                <app-button primary ?disabled=${!this.canSubmit} label="Install" btn-class="px-4 py-2 font-medium" @click=${this.onClickInstall}></app-button>
              </div>
            `}
          </form>
        </div>
      </main>
    `
  }


  renderInstallerState () {
    if (!this.installerState) return ''
    let cls = 'bg-default-2'
    if (this.installerState.status === 'error') cls = 'bg-error text-error font-medium'
    if (this.installerState.status === 'update-available' || this.installerState.status === 'update-installed') cls = 'bg-secondary text-inverse font-medium'
    return html`
      <div class="mt-6 px-4 py-3 rounded ${cls}">
        ${this.installerState.status === 'processing' ? html`<span class="spinner"></span>` : ''}
        ${this.installerState.status === 'error' ? html`<span class="fas fa-exclamation-triangle"></span>` : ''}
        ${this.installerState.status === 'installed' ? html`<span class="fas fa-check-circle"></span>` : ''}
        ${this.installerState.message}
      </div>
    `
  }

  // events
  // =

  onChangeSourceUrl (e) {
    this.sourceUrl = e.currentTarget.value
  }

  onChangeDesiredVersion (e) {
    this.desiredVersion = e.currentTarget.value
  }

  async onClickInstall () {
    this.installerState = {status: 'processing', message: 'Installing...'}
    try {
      let sourceUrl = this.sourceUrl
      if (sourceUrl.startsWith('/')) sourceUrl = `file://${sourceUrl}`
      let res = await session.api.apps.install({sourceUrl, desiredVersion: this.desiredVersion})
      console.log(res)
      this.installerState = {status: 'installed', message: `Application installed! Redirecting...`}
      setTimeout(() => {
        emit(this, 'navigate-to', {detail: {url: `/p/app/${res.id}`}})
      })
    } catch (e) {
      this.installerState = {status: 'error', message: e.toString()}
    }
  }
}

customElements.define('app-install-app-view', AppInstallAppView)