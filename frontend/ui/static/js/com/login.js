import { LitElement, html } from '../../vendor/lit/lit.min.js'
import * as session from '../lib/session.js'
import './button.js'

class CtznLogin extends LitElement {
  static get properties () {
    return {
      isLoggingIn: {type: Boolean},
      currentError: {type: String}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.isLoggingIn = false
    this.currentError = undefined
  }

  firstUpdated () {
    this.querySelector('input').focus()
  }

  // rendering
  // =

  render () {
    return html`
      <style>
        .pw-typerwriter {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: pw-typewriter-anim 0.5s steps(40, end);
          animation-delay: 0.4s;
          animation-fill-mode: forwards;
        }
        @keyframes pw-typewriter-anim {
          from { width: 0 }
          to { width: 100% }
        }
        .pw-input { position: relative; }
        .pw-input::before,
        .pw-input::after {
          content: '';
          position: absolute;
          border: 1px solid #fff;
          pointer-events: none;
          animation: pw-border-anim 0.7s;
          animation-delay: 0.2s;
          animation-fill-mode: forwards;
          opacity: 0;
        }
        .pw-input::before { left: 0; top: 0; border-bottom: 0; border-left: 0; }
        .pw-input::after { right: 0; bottom: 0; border-top: 0; border-right: 0; }
        @keyframes pw-border-anim {
          0% { width: 0; height: 0; opacity: 0; }
          50% { width: 100%; height: 0; opacity: 1; }
          100% { width: 100%; height: 100%; opacity: 1; }
        }
        .pw-input input::placeholder { color: #fff5; }
      </style>
      <div class="py-6 px-8 text-white">
        <form @submit=${this.onSubmit}>
          <div class="mb-6">
            <label class="pw-typerwriter block w-full box-border mb-1" for="password">Please enter your password</label>
            <div class="pw-input">
              <input class="block w-full box-border mb-1 p-4 bg-transparent" id="password" type="password" name="password" required placeholder="********">
            </div>
          </div>
          ${this.currentError ? html`
            <div class="error p-6 mb-4">${this.currentError}</div>
          ` : ''}
          <div class="flex justify-end items-center">
            <app-button
              primary
              btn-type="submit"
              ?disabled=${this.isLoggingIn}
              ?spinner=${this.isLoggingIn}
              label="Login"
            ></app-button>
          </div>
        </form>
      </div>
    `
  }

  // events
  // =

  async onSubmit (e) {
    e.preventDefault()
    this.isLoggingIn = true
    this.currentError = undefined
    let creds = {
      username: 'pfrazee',//e.target.username.value,
      password: e.target.password.value
    }
    try {
      await session.api.session.login(creds)
      window.location = '/'
    } catch (e) {
      console.log(e)
      this.currentError = e.data || e.message
    }
    this.isLoggingIn = false
  }

}

customElements.define('app-login', CtznLogin)
