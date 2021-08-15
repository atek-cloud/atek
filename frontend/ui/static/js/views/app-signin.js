import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { repeat } from '../../vendor/lit/directives/repeat.js'
import * as session from '../lib/session.js'
import '../com/button.js'

class AppAppSigninView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      currentView: {type: String},
      error: {type: String},
      session: {type: Object},
      profiles: {type: Array}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.currentView = 'list'
    this.error = undefined
    this.sessionId = ''
    this.profiles = undefined
  }

  async load () {
    document.title = `Sign In`
    this.sessionId = (new URLSearchParams(location.search)).get('sessionId')
    this.session = await session.api.profiles.sessions.get(this.sessionId)
    this.app = (await session.api.apps.get(this.session.appId))?.app
    this.profiles = (await session.api.profiles.list())?.profiles
    console.log(this.session, this.profiles)
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  // rendering
  // =

  render () {
    return html`
      <main class="min-h-screen bg-default-2 py-8">
        <div class="max-w-2xl mx-auto bg-default rounded px-6 py-4">
          <h1 class="text-5xl mb-4">Login</h1>
          <div class="text-lg mb-4">
            The app
            <a class="text-primary hover:underline" href="/p/app/${this.session?.appId}" target="_blank">${this.session?.appId}</a>
            would like to sign into a profile.
          </div>
          ${this.renderCurrentView()}
        </div>
      </main>
    `
  }

  renderCurrentView () {
    if (this.currentView === 'list') {
      return this.renderListView()
    }
    if (this.currentView === 'create') {
      return this.renderCreateView()
    }
  }

  renderListView () {
    return html`
      ${this.error ? html`
        <div class="bg-error text-error rounded p-2 mb-4">${this.error}</div>
      ` : ''}
      ${this.profiles ? html`
        ${this.profiles.length ? html`
          ${repeat(this.profiles, p => p.dbId, p => html`
            <div class="p-2 hover:bg-default-2 cursor-pointer" @click=${e => this.onClickProfile(e, p)}>
              <div class="text-xl">${p.displayName}</div>
              <div>${p.label}</div>
            </div>
          `)}
          <app-button btn-class="block w-full text-center mt-2" label="Create new profile" @click=${this.onClickCreate}></app-button>
        ` : html`
          <div class="px-6 py-4 bg-default-2 rounded mb-2">
            You have not created any user profiles yet.
          </div>
          <app-button primary btn-class="block w-full text-center font-medium" label="Create a profile" @click=${this.onClickCreate}></app-button>
        `}
      ` : html`
        <div><span class="spinner"></span></div>
      `}
    `
  }

  renderCreateView () {
    return html`
      <form class="block border border-default rounded px-4 py-3" id="profile-data" @submit=${this.onSubmitCreate}>
        <h2 class="text-3xl mb-4">Create new profile</h2>
        <div class="px-1">
          <label class="block font-semibold" for="displayName-input">Display Name</label>
          <div class="text-sm">
            This will be shared with the app and other users.
          </div>
          <input
            autofocus
            required
            type="text"
            id="displayName-input"
            name="displayName"
            class="block box-border w-full p-3 border border-default rounded mb-4"
            placeholder="e.g. Paul Frazee"
          />
          <label class="block font-semibold" for="displayName-input">Label</label>
          <div class="text-sm">
            This is to help you remember which profile this is and won't be shared with anyone.
          </div>
          <input
            type="text"
            id="label-input"
            name="label"
            class="block box-border w-full p-3 border border-default rounded mb-6"
            value="Created by ${this.session.appId}"
          />
        </div>
        ${this.error ? html`
          <div class="bg-error text-error rounded p-2 mb-4">${this.error}</div>
        ` : ''}
        <div class="flex items-center justify-between">
          <app-button label="Cancel" @click=${this.onClickCancelCreate}></app-button>
          <app-button btn-type="submit" primary label="Create" btn-class="font-medium"></app-button>
        </div>
      </form>
    `
  }

  // events
  // =

  onClickCreate (e) {
    e.preventDefault()
    this.currentView = 'create'
  }

  onClickCancelCreate (e) {
    e.preventDefault()
    this.currentView = 'list'
  }

  async onClickProfile (e, profile) {
    e.preventDefault()
    this.error = undefined
    try {
      await session.api.profiles.sessions.activate(this.sessionId, {profile: {dbId: profile.dbId}})
      window.location = `http://localhost:${this.app.port}/`
    } catch (e) {
      this.error = e.toString()
    }
  }

  async onSubmitCreate (e) {
    e.preventDefault()
    this.error = undefined
    try {
      const data = new FormData(this.querySelector('form#profile-data'))
      const values = Object.fromEntries(data.entries())
      const res = await session.api.profiles.create(values)
      await session.api.profiles.sessions.activate(this.sessionId, {profile: {dbId: res.profile.dbId}})
      window.location = `http://localhost:${this.app.port}/`
    } catch (e) {
      this.error = e.toString()
    }
  }
}

customElements.define('app-app-signin-view', AppAppSigninView)