import { LitElement, html } from '../../../vendor/lit/lit.min.js'
import { repeat } from '../../../vendor/lit/directives/repeat.js'
import * as session from '../../lib/session.js'
import * as contextMenu from '../context-menu.js'
import '../button.js'

export function create ({parent, x, y}) {
  return contextMenu.create({
    parent,
    x: -310,
    y,
    render () {
      return html`
        <app-apps-menu></app-apps-menu>
      `
    }
  })
}

export class AppsMenu extends LitElement {
  static get properties () {
    return {
      apps: {type: Object}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.apps = undefined
    this.load()
  }

  async load () {
    this.apps = (await session.api.apps.list())?.apps
  }

  get activeApps () {
    return (this.apps || [])
  }

  // rendering
  // =

  render () {
    return html`
      <style>
        .container {
          display: grid;
          grid-template-columns: repeat(3, 100px);
          grid-gap: 30px 0;
          background: #fff;
          width: 300px;
          box-shadow: rgb(0 0 0 / 30%) 0px 2px 15px;
          padding: 1.4rem 0.8rem;
          border-radius: 0.5rem;
        }
        .container a {
          display: block;
          text-align: center;
          text-decoration: none;
          font-size: 12px;
        }
        .container a img {
          display: block;
          width: 40px;
          height: 40px;
          object-fit: cover;
          margin: 0 auto 10px;
        }
        .container a span {
          display: block;
          color: #444;
          line-height: 1;
        }
      </style>
      <div class="container">
        ${this.apps ? html`
          ${repeat(this.activeApps, app => app.id, (app, i) => html`
            <a class="block text-center" href="http://localhost:${app.port}/">
              <img src="/img/fake${i+1}.png">
              <span>${app.manifest?.name || app.id}</span>
            </a>
          `)}
          <a class="block text-center" href="/p/install-app">
            <img src="/img/install.png">
            <span>Install App</span>
          </a>
          <a class="block text-center" href="/p/cloud">
            <img src="/img/cloud.png">
            <span>My Cloud</span>
          </a>
          <a class="block text-center" href="/p/apps">
            <img src="/img/settings.png">
            <span>Settings</span>
          </a>
        ` : ''}
      </div>
    `
  }

  // events
  // =
}

customElements.define('app-apps-menu', AppsMenu)
