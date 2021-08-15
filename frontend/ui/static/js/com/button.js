import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { ifDefined } from '../../vendor/lit/directives/if-defined.js'
import * as icons from './icons.js'

export class Button extends LitElement {
  static get properties () {
    return {
      label: {type: String},
      icon: {type: String},
      href: {type: String},
      newWindow: {type: Boolean, attribute: 'new-window'},
      btnClass: {type: String, attribute: 'btn-class'},
      btnStyle: {type: String, attribute: 'btn-style'},
      disabled: {type: Boolean},
      isDropdown: {type: Boolean, attribute: 'is-dropdown'},
      spinner: {type: Boolean}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.btnClass = ''
    this.btnStyle = undefined
    this.isDropdown = false
  }

  getClass () {
    let parentClass = this.btnClass || this.className || ''
    let colors = 'bg-default hover:bg-default-2'
    if (this.hasAttribute('primary')) {
      colors = 'bg-primary text-white hover:bg-primary-2'
      if (this.disabled) {
        colors = 'bg-primary-2 text-inverse-3'
      }
    } else if (this.hasAttribute('transparent')) {
      colors = 'hover:bg-default-2'
      if (this.disabled) {
        colors = 'text-default-3'
      }
    } else if (this.disabled) {
      colors = 'bg-default-2 text-default-3'
    }
    
    let paddings = ''
    if (!/p(x|l|r)?-/.test(parentClass)) paddings += 'px-2 '
    if (!/p(y|t|b)?-/.test(parentClass)) paddings += 'py-1'

    let shadow = 'shadow-sm'
    let borders = `border border-gray-300`
    if (/border/.test(parentClass)) borders = ''
    else if (this.hasAttribute('primary')) borders = 'border border-blue-800'
    else if (this.hasAttribute('transparent')) { borders = ''; shadow = '' }
    else if (this.hasAttribute('color')) borders = `border border-${this.getAttribute('color')}-800`
    return `rounded ${colors} ${paddings} ${borders} ${shadow} ${parentClass} ${this.disabled ? 'cursor-default' : ''}`
  }

  renderSpinner () {
    let colors = 'text-default-3'
    if (this.hasAttribute('primary')) {
      colors = 'text-primary-1'
    }
    return html`<span class="spinner ${colors}"></span>`
  }

  renderLabel () {
    return html`${this.renderIcon()}${this.label}${this.renderDropdownCaret()}`
  }

  renderIcon () {
    if (!this.icon) return ''
    if (this.icon in icons) return html`<span class="relative" style="top: -2px">${icons[this.icon](16, 16)}</span>`
    return html`<span class=${this.icon}></span> `
  }

  renderDropdownCaret () {
    if (!this.isDropdown) return ''
    return html`<span class="fas fa-fw fa-caret-down"></span> `
  }

  render () {
    if (this.href) {
      return html`
        <a
          href=${this.href}
          target=${this.newWindow ? '_blank' : ''}
          class="inline-block ${this.getClass()}"
          ?disabled=${this.disabled}
          style=${ifDefined(this.btnStyle)}
        >${this.spinner ? this.renderSpinner() : this.renderLabel()}</a>
      `
    }
    return html`
      <button
        type=${this.getAttribute('btn-type') || 'button'}
        tabindex=${this.getAttribute('tabindex')}
        class=${this.getClass()}
        ?disabled=${this.disabled}
        style=${ifDefined(this.btnStyle)}
      >${this.spinner ? this.renderSpinner() : this.renderLabel()}</button>
    `
  }
}

customElements.define('app-button', Button)
