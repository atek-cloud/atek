import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { repeat } from '../../vendor/lit/directives/repeat.js'
import * as session from '../lib/session.js'
import { joinPath } from '../lib/strings.js'
import '../com/button.js'

class AppSelectDbView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      currentView: {type: String},
      currentSelection: {type: String},
      error: {type: String},
      dbRequest: {type: Object},
      buckets: {type: Object}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.currentView = 'list'
    this.currentSelection = undefined
    this.error = undefined
    this.reqId = ''
    this.buckets = undefined
  }

  async load () {
    document.title = `Select Database`
    try {
      this.reqId = (new URLSearchParams(location.search)).get('reqId')
      this.dbRequest = await (await fetch(`/_api/cloud/db/request/${this.reqId}`)).json()
      this.app = (await session.api.apps.get(this.dbRequest.appId))?.app

      const rootBucket = await session.api.cloud.getBucket('root')
      const appBuckets = rootBucket.items.filter(item => item.type === 'app-bucket')
      const buckets = await Promise.all(appBuckets.map(appBucket => session.api.cloud.getBucket(appBucket.bucketId)))
      this.buckets = buckets.filter(b => b.items?.length)
    } catch (e) {
      this.error = e.toString()
    }

    console.log(this.dbRequest, this.buckets)
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  async navigateBack (qp) {
    try {
      await (await fetch(`/_api/cloud/db/request/${this.reqId}`, {method: 'DELETE'})).json()
    } catch (e) {
      // we can ignore, this isn't a huge problem
      console.log('Failed to delete db request', e)
    }

    let targetPath = this.dbRequest.params.returnUrl || '/'
    try {
      let urlp = new URL(targetPath)
      targetPath = urlp.pathname
    } catch (e) {}

    const targetUrl = new URL(joinPath(`http://localhost:${this.app.port}`, targetPath))
    for (let k in qp) {
      targetUrl.searchParams.set(k, qp[k])
    }
    window.location = targetUrl.toString()
  }

  // rendering
  // =

  render () {
    return html`
      <main class="min-h-screen bg-default-2 py-8">
        <div class="max-w-2xl mx-auto bg-default rounded px-6 py-4">
          <h1 class="text-5xl mb-4">Select Database</h1>
          <div class="text-lg mb-4">
            The app
            <a class="text-primary hover:underline" href="/p/app/${this.dbRequest?.appId}" target="_blank">${this.dbRequest?.appId}</a>
            would like to access a database.
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
      <div class="border border-default rounded overflow-hidden mb-4">
        ${this.buckets ? html`
          ${!this.buckets.length ? html`
            <div class="px-4 py-2 text-default-3">You have not created any databases yet.</div>
          ` : repeat(this.buckets, b => b.bucketId, bucket => html`
            <div class="flex items-center px-3 py-2 border-b border-default-2 bg-default-2 text-default-3">
              <img class="block w-5 h-5 object-fit mr-2" src="/img/app-data.png">
              <span>${bucket.title}</span>
            </div>
            ${repeat(bucket.items, db => db.dbId, db => html`
              <div
                class="flex items-center pl-5 pr-3 py-1 m-1 rounded cursor-pointer ${this.currentSelection === db.dbId ? 'bg-primary-2 text-inverse font-medium' : 'hover:bg-default-2'}"
                @click=${e => this.onClickDatabase(e, db.dbId)}
              >
                <img class="block w-5 h-5 object-fit mr-2" src="/img/database.png">
                <span>${db.title}</span>
              </div>
            `)}
          `)}
        ` : html`
          <div><span class="spinner"></span></div>
        `}
      </div>
      <div class="flex items-center justify-between">
        <span>
          <app-button label="Cancel" @click=${this.onClickCancelAll}></app-button>
        </span>
        <span>
          ${this.dbRequest?.params?.flags?.create ? html`
            <app-button label="Create New" @click=${this.onClickCreate} btn-class="mr-1"></app-button>
          ` : ''}
          <app-button ?disabled=${!this.currentSelection} primary label="Select" btn-class="font-medium" @click=${this.onClickSelect}></app-button>
        </span>
      </div>
    `
  }

  renderCreateView () {
    return html`
      <form class="" id="create-form" @submit=${this.onSubmitCreate}>
        <label class="block font-semibold" for="displayName-input">New Database Name</label>
        <input
          autofocus
          required
          type="text"
          id="displayName-input"
          name="displayName"
          class="block box-border w-full p-3 border border-default rounded mb-4"
          placeholder="e.g. My Stuff"
        />
        ${this.error ? html`
          <div class="bg-error text-error rounded p-2 mb-4">${this.error}</div>
        ` : ''}
        <div class="flex items-center justify-between">
          <app-button label="Back" @click=${this.onClickCancelCreate}></app-button>
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
    this.currentSelection = undefined
  }

  onClickCancelCreate (e) {
    e.preventDefault()
    this.currentView = 'list'
  }

  onClickDatabase (e, dbId) {
    e.preventDefault()
    this.currentSelection = dbId
  }

  onClickCancelAll (e) {
    e.preventDefault()
    this.navigateBack({canceled: 1})
  }

  async onClickSelect (e) {
    e.preventDefault()
    if (!this.currentSelection) return
    this.navigateBack({dbId: this.currentSelection})
  }

  async onSubmitCreate (e) {
    e.preventDefault()
    const data = new FormData(this.querySelector('form#create-form'))
    this.navigateBack({
      create: 1,
      displayName: data.get('displayName')
    })
  }
}

customElements.define('app-select-db-view', AppSelectDbView)