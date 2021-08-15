import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { repeat } from '../../vendor/lit/directives/repeat.js'
import { emit } from '../lib/dom.js'
import * as icons from '../com/icons.js'
import * as session from '../lib/session.js'
import * as appsMenu from '../com/menus/apps.js'
import '../com/button.js'
import '../com/login.js'
import '../com/img-fallbacks.js'
import '../com/subnav.js'

class AppMainView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
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
    document.title = `Home`
    if (!session.isActive()) {
      if (location.pathname !== '/') {
        window.location = '/'
      }
      return this.requestUpdate()
    }
    this.apps = (await session.api.apps.list())?.apps
    console.log(this.apps)
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  get activeApps () {
    return (this.apps || [])
  }

  // rendering
  // =

  render () {
    return html`
      ${this.renderCurrentView()}
    `
  }

  renderCurrentView () {
    if (!session.isActive()) {
      return this.renderNoSession()
    }
    return this.renderWithSession()
  }

  renderNoSession () {
    return html`
      <div class="flex items-center justify-center w-screen h-screen bg-blue-600">
        <style>
          .animated-ring {
            animation: animated-ring-anim 3s infinite;
          }
          @keyframes animated-ring-anim {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(1.25);
              opacity: 0;
            }
          }
        </style>
        <div class="w-96">
          <div class="w-48 h-48 relative mx-auto mb-10">
            <div class="animated-ring absolute rounded-full w-48 h-48 border border-white"></div>
            <div class="flex items-center justify-center rounded-full w-48 h-48 border-8 border-white text-white text-4xl">PF</div>
          </div>
          <app-login></app-login>
        </div>
      </div>
    `
  }

  renderWithSession () {
    const SUBNAV_ITEMS = [
      // {menu: true, mobileOnly: true, label: html`<span class="fas fa-bars"></span>`},
      {path: '/', thin: true, label: 'Updates'},
      {path: '/album', thin: true, label: 'Album'},
      {path: '/calendar', thin: true, label: 'Calendar'}
    ]
    const appColCount = Math.min((this.activeApps.length || 0) + 3, 5)
    return html`
      <main class="min-h-screen">
        <div class="flex items-center px-5 pt-4 text-lg bg-default">
          <div class="flex-1"></div>
          <div class="mx-3"><app-button transparent icon="fas fa-th" @click=${this.onClickAppsMenu}></app-button></div>
          <img class="inline-block w-8 h-8 rounded-full" src="/img/tmp3.jpg" @click=${this.onClickLogout}>
        </div>
        <div style="margin-top: calc(25vh - 40px)">
          <div class="text-center text-6xl text-default-2 mb-8">Selfcloud</div>
          <div class="flex items-center bg-default border border-darker rounded-full py-2 px-1 max-w-2xl mx-auto mb-10">
            <span class="px-1.5">${icons.search(20, 20, 'block')}</span>
            <input class="flex-1" placeholder="Search" @keydown=${this.onKeydownSearch}>              
          </div>
          <div class="grid gap-16 justify-center text-sm text-default-3" style="grid-template-columns: repeat(${appColCount}, auto)">
            ${repeat(this.activeApps, app => app.id, (app, i) => html`
              <a class="block text-center" href="http://localhost:${app.port}/">
                <img class="mx-auto rounded object-fit" src="/img/fake${i+1}.png" style="width: 40px; height: 40px">
                <span class="inline-block py-3">${app.manifest?.name || app.id}</span>
              </a>
            `)}
            <a class="block text-center" href="/p/install-app">
              <img class="mx-auto rounded object-fit" src="/img/install.png" style="width: 40px; height: 40px">
              <span class="inline-block py-3">Install App</span>
            </a>
            <a class="block text-center" href="/p/cloud">
              <img class="mx-auto rounded object-fit" src="/img/cloud.png" style="width: 40px; height: 40px">
              <span class="inline-block py-3">My Cloud</span>
            </a>
            <a class="block text-center" href="/p/apps">
              <img class="mx-auto rounded object-fit" src="/img/settings.png" style="width: 40px; height: 40px">
              <span class="inline-block py-3">Settings</span>
            </a>
          </div>
        </div>
      </main>
    `
  }


  // events
  // =

  onKeydownSearch (e) {
    if (e.code === 'Enter') {
      let q = e.currentTarget.value.trim()
      emit(this, 'navigate-to', {detail: {url: `/p/search?q=${q}`}})
    }
  }

  onClickAppsMenu (e) {
    e.preventDefault()
    e.stopPropagation()
    appsMenu.create({
      x: undefined,
      y: undefined,
      parent: e.currentTarget.parentNode
    })
  }

  async onClickLogout (e) {
    await session.api.session.logout()
    this.load()
  }
}

customElements.define('app-main-view', AppMainView)