import { LitElement, html } from '../vendor/lit/lit.min.js'
import PullToRefresh from '../vendor/pulltorefreshjs/index.js'
import * as session from './lib/session.js'
import { emit } from './lib/dom.js'
import * as gestures from './lib/gestures.js'
import * as theme from './lib/theme.js'
import * as contextMenu from './com/context-menu.js'
import { BasePopup } from './com/popups/base.js'
import './views/app.js'
import './views/apps.js'
import './views/app-signin.js'
import './views/cloud.js'
import './views/cloud-db.js'
import './views/install-app.js'
import './views/main.js'
import './views/search.js'
import './views/select-db.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    /*
    TODO - disabled until we can get caching to work correctly
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch(console.error)
    */
    const registration = await navigator.serviceWorker.getRegistration('/')
    if (registration) {
      await registration.unregister()
    }
  })
}

class AppRoot extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String},
      isLoading: {type: Boolean}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()

    document.body.classList.add(`theme-${theme.get()}`)

    this.isLoading = true
    this.pageHasChanges = false
    this.currentPath = window.location.pathname

    gestures.setup()
    this.setGestureNav()
    
    document.body.addEventListener('click', this.onGlobalClick.bind(this))
    document.body.addEventListener('navigate-to', this.onNavigateTo.bind(this))
    window.addEventListener('popstate', this.onHistoryPopstate.bind(this))
    window.addEventListener('beforeunload', this.onBeforeUnload.bind(this))

    this.load()
  }

  async load () {
    try {
      await session.setup()
    } finally {
      this.isLoading = false
      await this.updateComplete
      this.querySelector('#view')?.load?.()
    }
  }

  updated (changedProperties) {
    if (changedProperties.has('currentPath')) {
      this.querySelector('#view')?.load?.()
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this.ptr = PullToRefresh.init({
      mainElement: 'body',
      onRefresh: async (done) => {
        await this.querySelector('#view')?.refresh?.()
        done()
      }
    })
  }

  disconnectedCallback (...args) {
    super.disconnectedCallback(...args)
    PullToRefresh.destroyAll()
  }

  navigateTo (pathname, replace = false) {
    if (this.pageHasChanges) {
      if (!confirm('Lose unsaved changes?')) {
        return
      }
    }
    this.pageHasChanges = false

    contextMenu.destroy()
    BasePopup.destroy()
    
    if (history.scrollRestoration) {
      history.scrollRestoration = 'manual'
    }

    if (replace) {
      window.history.replaceState({}, null, pathname)
    } else {
      window.history.replaceState({scrollY: window.scrollY}, null)
      window.history.pushState({}, null, pathname)
    }
    this.currentPath = pathname.split('?')[0]
    this.setGestureNav()
  }

  setGestureNav () {
    switch (this.currentPath) {
      case '/':
      case '/index':
      case '/index.html':
        gestures.setCurrentNav(['/', '/notifications', '/search'])
        return
    }
  }

  async scrollToAfterLoad (scrollY) {
    await this.updateComplete

    try {
      let view = this.querySelector('#view')
      view.pageLoadScrollTo(scrollY)
    } catch (e) {}
  }

  reloadView () {
    try {
      let view = this.querySelector('#view')
      view.load()
    } catch (e) {
      console.log('Failed to reload view', e)
    }
  }

  // rendering
  // =

  render () {
    if (this.isLoading) {
      return html`
        <div class="max-w-4xl mx-auto">
          <div class="py-32 text-center text-gray-400">
            <span class="spinner h-7 w-7"></span>
          </div>
        </div>
      `
    }

    let renderedViews = new Set()
    const renderView = (path) => {
      if (renderedViews.has(path)) {
        return ''
      }
      renderedViews.add(path)
      const isCurrentView = this.currentPath === path
      const id = isCurrentView ? 'view' : undefined
      const cls = isCurrentView ? 'block' : 'hidden'
      switch (path) {
        case '/':
          return html`<app-main-view id=${id} class=${cls} current-path=${path}></app-main-view>`
        case '/p/apps':
          return html`<app-apps-view id=${id} class=${cls} current-path=${path}></app-apps-view>`
        case '/p/app-signin':
          return html`<app-app-signin-view id=${id} class=${cls} current-path=${path}></app-app-signin-view>`
        case '/p/cloud':
          return html`<app-cloud-view id=${id} class=${cls} current-path=${path}></app-cloud-view>`
        case '/p/install-app':
          return html`<app-install-app-view id=${id} class=${cls} current-path=${path}></app-install-app-view>`
        case '/p/search':
          return html`<app-search-view id=${id} class=${cls} current-path=${path}></app-search-view>`
        case '/p/select-db':
          return html`<app-select-db-view id=${id} class=${cls} current-path=${path}></app-select-db-view>`
      }
      if (path.startsWith('/p/app/')) {
        return html`<app-app-view id=${id} class=${cls} current-path=${path}></app-app-view>`
      }
      if (path.startsWith('/p/cloud/bucket/')) {
        return html`<app-cloud-view id=${id} class=${cls} current-path=${path}></app-cloud-view>`
      }
      if (path.startsWith('/p/cloud/view/')) {
        return html`<app-cloud-db-view id=${id} class=${cls} current-path=${path}></app-cloud-db-view>`
      }
      return html`
        <div class="bg-gray-100 min-h-screen wide">
          <div class="text-center py-48">
            <h2 class="text-5xl text-gray-600 font-semibold mb-4">404 Not Found</h2>
            <div class="text-lg text-gray-600 mb-4">No page exists at this URL.</div>
            <div class="text-lg text-gray-600">
              <a class="text-blue-600 hov:hover:underline" href="/" title="Back to home">
                <span class="fas fa-angle-left fa-fw"></span> Home</div>
              </a>
            </div>
          </div>
        </div>
      `
    }

    return html`
      ${renderView(this.currentPath)}
    `
  }

  // events
  // =

  onGlobalClick (e) {
    if (e.defaultPrevented) {
      return
    }

    let anchor
    for (let el of e.composedPath()) {
      if (el.tagName === 'A') {
        anchor = el
      }
    }
    if (!anchor) return

    const href = anchor.getAttribute('href')
    if (href === null) return
    
    const url = new URL(href, window.location.origin)
    if (url.origin === window.location.origin) {
      e.preventDefault()
      this.navigateTo(url.pathname + url.search)
    }
  }

  onNavigateTo (e) {
    this.navigateTo(e.detail.url, e.detail.replace)
  }

  onHistoryPopstate (e) {
    emit(document, 'close-all-popups')
    this.currentPath = window.location.pathname
    this.setGestureNav()
    if (typeof e.state.scrollY === 'number') {
      this.scrollToAfterLoad(e.state.scrollY)
    }
  }

  onBeforeUnload (e) {
    if (this.pageHasChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
}

customElements.define('app-root', AppRoot)