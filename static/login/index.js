import { create } from './rpc.js'

const api = create('/_atek/gateway?api=atek.cloud%2Fuser-sessions-api')

class CtznLogin extends HTMLElement {
  $ (sel) {
    return this.querySelector(sel)
  }

  connectedCallback () {
    this.innerHTML = `
      <form>
        <div>
          <label for="username">Username</label>
          <input id="username" type="text" name="username" required placeholder="bob">
        </div>
        <div>
          <label for="password">Password</label>
          <input id="password" type="password" name="password" required placeholder="********">
        </div>
        <div class="error"></div>
        <div>
          <button type="submit">Login</button>
        </div>
      </form>
    `
    this.$('input').focus()
    this.$('form').addEventListener('submit', this.onSubmit.bind(this))
  }

  // events
  // =

  async onSubmit (e) {
    e.preventDefault()
    if (this.$('.error')) {
      this.$('.error').textContent = ''
    }
    let creds = {
      username: e.target.username.value,
      password: e.target.password.value
    }
    try {
      await api.login(creds)
      var searchParams = new URLSearchParams(window.location.search)
      window.location = searchParams.get('redirect') || '/'
    } catch (e) {
      console.log(e)
      this.$('.error').textContent = e.data || e.message || e.toString()
    }
  }

}

customElements.define('app-login', CtznLogin)
