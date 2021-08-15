import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { repeat } from '../../vendor/lit/directives/repeat.js'
import * as icons from '../com/icons.js'
import * as session from '../lib/session.js'
import '../com/button.js'
import '../com/header.js'

class AppSearchView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      currentSearch: {type: String},
      apps: {type: Array}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
  }

  async load () {
    document.title = `Search`
    if (!session.isActive()) {
      window.location = '/'
      return
    }
    this.currentSearch = (new URLSearchParams(location.search)).get('q')
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  // rendering
  // =

  render () {
    return html`
      <main class="min-h-screen">
        <app-header></app-header>
        ${this.renderSearchResults()}
      </main>
    `
  }

  renderSearchResults () {
    return html`
      <div class="py-6 flex" style="padding-left: 68px; max-width: 1000px">
        <div class="flex-1">
          <div class="mb-4 text-sm text-default-3">
            Search results for "${this.currentSearch}"
          </div>
          <div class="mb-6">
            <div class="text-sm">Blog App</div>
            <div class="my-1 text-xl font-medium">
              <a class="text-primary hover:underline">Blog App</a>
            </div>
            <div class="text-default-3">Example blogging application for HomePOP.</div>
          </div>
          <div class="mb-6">
            <div class="text-sm">Blog App › Paul Frazee</div>
            <div class="my-1 text-xl font-medium">
              <a class="text-primary hover:underline">Hello, world!</a>
            </div>
            <div class="text-default-3">This is my first blogpost</div>
          </div>
        </div>
        <div class="w-64">
          <div class="text-default-3 text-sm">Actions</div>
          <div class="rounded border border-default px-4 py-3">
            <div><a class="font-medium text-primary hover:underline">New blogpost</a></div>
            <div class="text-sm text-default-3">Blog App</div>
            <hr class="border-default-2 my-3">
            <div><a class="font-medium text-primary hover:underline">Install an app</a></div>
            <div class="text-sm text-default-3">System</div>
          </div>
        </div>
      </div>
    `
  }

  // events
  // =

  onKeydownSearch (e) {
    if (e.code === 'Enter') {
      this.currentSearch = e.currentSearch = e.currentTarget.value.trim()
    }
  }
}

customElements.define('app-search-view', AppSearchView)