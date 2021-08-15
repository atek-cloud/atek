import { LitElement, html } from '../../vendor/lit/lit.min.js'
import * as icons from './icons.js'
import { emit } from '../lib/dom.js'
import * as appsMenu from './menus/apps.js'
import './button.js'

export class Header extends LitElement {
  static get properties () {
    return {
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
  }

  render () {
    return html`
      <div class="flex items-center px-5 py-4 text-default-2 text-lg bg-default shadow relative z-10">
        <a class="inline-block p-1 mr-3 cursor-pointer" href="/">
          <div class="relative" style="width: 24px; height: 24px">
            <div class="absolute rounded-full w-full h-full" style="border: 3px solid var(--color-text-default-2);"></div>
            <div class="absolute" style="background: var(--color-bg-default); width: 16px; height: 16px; top: -8px; left: calc(50% - 8px); transform: rotate(45deg);"></div>
            <div class="absolute" style="background: var(--color-text-default-2); width: 3px; height: 12px; top: -1px; left: calc(50% - 2px);"></div>
          </div>
        </a>
        <div class="flex-1">
          <div class="flex items-center border border-default rounded-full py-1.5 px-1.5 mr-2 max-w-2xl text-sm">
            <span class="px-1.5">${icons.search(20, 20, 'block')}</span>
            <input class="flex-1" placeholder="Search" value=${(new URLSearchParams(location.search)).get('q') || ''} @keydown=${this.onKeydownSearch}>              
          </div>
        </div>
        <div class="mx-3"><app-button transparent icon="fas fa-th" @click=${this.onClickAppsMenu}></app-button></div>
        <img class="inline-block w-8 h-8 rounded-full" src="/img/tmp3.jpg" @click=${this.onClickLogout}>
      </div>
    `
  }

  // events
  // =

  onClickAppsMenu (e) {
    e.preventDefault()
    e.stopPropagation()
    appsMenu.create({
      x: undefined,
      y: undefined,
      parent: e.currentTarget.parentNode
    })
  }

  onKeydownSearch (e) {
    if (e.code === 'Enter') {
      let q = e.currentTarget.value.trim()
      emit(this, 'navigate-to', {detail: {url: `/p/search?q=${q}`}})
    }
  }
}

customElements.define('app-header', Header)
