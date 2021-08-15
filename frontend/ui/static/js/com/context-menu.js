import { LitElement, html, css } from '../../vendor/lit/lit.min.js'
import { classMap } from '../../vendor/lit/directives/class-map.js'
import { ifDefined } from '../../vendor/lit/directives/if-defined.js'
import { asyncReplace } from '../../vendor/lit/directives/async-replace.js'
import { findParent } from '../lib/dom.js'

// globals
// =

var resolve

// exported api
// =

// create a new context menu
// - returns a promise that will resolve to undefined when the menu goes away
// - example usage:
/*
create({
  // where to put the menu
  x: e.clientX,
  y: e.clientY,

  // align edge to right instead of left
  right: true,

  // use triangle
  withTriangle: true,

  // roomy style
  roomy: true,

  // no borders on items
  noBorders: false,

  // additional styles on dropdown-items
  style: 'font-size: 14px',

  // parent element to append to
  parent: document.body,

  // url to fontawesome css
  fontAwesomeCSSUrl: '/css/font-awesome.css',

  // menu items
  items: [
    // icon from font-awesome
    {icon: 'fa fa-link', label: 'Copy link', click: () => writeToClipboard('...')}
  ]

  // instead of items, can give render()
  render () {
    return html`
      <img src="smile.png" onclick=${contextMenu.destroy} />
    `
  }
}
*/
export function create (opts) {
  // destroy any existing
  destroy()

  // extract attrs
  var parent = opts.parent || document.body

  // render interface
  parent.appendChild(new ContextMenu(opts))
  document.addEventListener('keyup', onKeyUp)
  document.addEventListener('click', onClickAnywhere)

  // return promise
  return new Promise(_resolve => {
    resolve = _resolve
  })
}

export function destroy (value) {
  const el = document.querySelector('app-context-menu')
  if (el) {
    el.parentNode.removeChild(el)
    document.removeEventListener('keyup', onKeyUp)
    document.removeEventListener('click', onClickAnywhere)
    resolve(value)
  }
}

// global event handlers
// =

function onKeyUp (e) {
  e.preventDefault()
  e.stopPropagation()

  if (e.keyCode === 27) {
    destroy()
  }
}

function onClickAnywhere (e) {
  if (!findParent(e.target, el => el.tagName === 'APP-CONTEXT-MENU')) {
    // click is outside the context-menu, destroy
    destroy()
  }
}

// internal
// =

export class ContextMenu extends LitElement {
  constructor ({parent, x, y, right, center, top, withTriangle, roomy, veryRoomy, rounded, noBorders, keepOpen, style, items, fontAwesomeCSSUrl, render}) {
    super()
    this.hasParent = !!parent
    this.x = x
    this.y = y
    this.right = right || false
    this.center = center || false
    this.top = top || false
    this.withTriangle = withTriangle || false
    this.roomy = roomy || false
    this.veryRoomy = veryRoomy || false
    this.rounded = rounded || false
    this.noBorders = noBorders || false
    this.keepOpen = keepOpen || false
    this.customStyle = style || undefined
    this.items = items
    this.fontAwesomeCSSUrl = fontAwesomeCSSUrl || '/css/fontawesome.css'
    this.customRender = render
  }

  // calls the global destroy
  // (this function exists so that custom renderers can destroy with this.destroy)
  destroy () {
    destroy()
  }

  // rendering
  // =

  render () {
    const keepOpen = this.keepOpen
    const cls = classMap({
      'dropdown-items': true,
      right: this.right,
      center: this.center,
      left: !this.right,
      top: this.top,
      'with-triangle': this.withTriangle,
      roomy: this.roomy,
      'very-roomy': this.veryRoomy,
      rounded: this.rounded,
      'no-border': this.noBorders
    })
    var style = ''
    if (this.x) style += `left: ${this.x}px; `
    if (this.y) style += `top: ${this.y}px; `
    const items = typeof this.items === 'function' ? this.items() : this.items
    return html`
      ${this.fontAwesomeCSSUrl ? html`<link rel="stylesheet" href="${this.fontAwesomeCSSUrl}">` : ''}
      <div class="context-menu dropdown ${this.hasParent ? 'has-parent' : ''}" style="${style}">
        ${this.customRender
          ? this.customRender.call(this)
          : html`
            <div class="${cls}" style="${ifDefined(this.customStyle)}">
              ${items.map(item => {
                if (item instanceof Promise) {
                  return html`${asyncReplace(renderPromiseItem(item))}`
                }
                if (item === '-') {
                  return html`<hr />`
                }
                if (item._$litType$) {
                  return item
                }
                var icon = item.icon
                if (typeof icon === 'string' && !icon.includes(' ')) {
                  icon = 'fa fa-' + icon
                }
                if (item.disabled) {
                  return html`
                    <div class="dropdown-item disabled">
                      ${icon !== false ? html`<i class="${icon}"></i>` : ''}
                      ${item.label}
                    </div>
                  `
                }
                if (item.href) {
                  return html`
                    <a class="dropdown-item ${item.selected ? 'selected' : ''}" href=${item.href}>
                      ${icon !== false ? html`<i class="${icon}"></i>` : ''}
                      ${item.label}
                    </a>
                  `
                }
                return html`
                  <div class="dropdown-item ${item.selected ? 'selected' : ''}" @click=${(e) => { if (!keepOpen) { destroy(); } else { e.preventDefault(); e.stopPropagation(); this.requestUpdate(); } item.click() }}>
                    ${typeof icon === 'string'
                      ? html`<i class="${icon}"></i>`
                      : icon ? icon : ''}
                    ${item.label}
                  </div>
                `
              })}
            </div>`
        }
      </div>`
  }
}

async function* renderPromiseItem (item) {
  yield html``
  let value = await item
  yield value
}

ContextMenu.styles = css`
:host {
  position: relative;
}

.dropdown {
  position: relative;

  --text-color--dropdown-default: #333;
  --text-color--dropdown-section: #aaa;
  --text-color--dropdown-icon: rgba(0, 0, 0, 0.65);
  --text-color--dropdown-btn--pressed: #dadada;
  --text-color--title: gray;
  --bg-color--dropdown: #fff;
  --bg-color--dropdown-item--hover: #eee;
  --border-color--dropdown: #dadada;
  --border-color--dropdown-item: #eee;
  --border-color--dropdown-section: rgba(0,0,0,.1);
  --border-color--dropdown-separator: #ddd;
}


.dropdown.open .toggleable:not(.primary) {
  background: var(--text-color--dropdown-btn--pressed);
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.1);
  border-color: transparent;
  outline: 0;
}

.toggleable-container .dropdown-items {
  display: none;
}

.toggleable-container.hover:hover .dropdown-items,
.toggleable-container.open .dropdown-items {
  display: block;
}

.dropdown-items {
  width: 270px;
  position: absolute;
  right: 0px;
  z-index: 3000;
  background: var(--bg-color--dropdown);
  color: var(--text-color--dropdown-default);
  border: 1px solid var(--border-color--dropdown);
  border-radius: 0px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
}

.dropdown-items .section {
  border-bottom: 1px solid var(--border-color--dropdown-section);
  padding: 5px 0;
}

.dropdown-items .section-header {
  padding: 2px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-items .section-header.light {
  color: #666;
  font-weight: 500;
}

.dropdown-items .section-header.small {
  font-size: 12px;
  letter-spacing: 0.25px;
}

.dropdown-items hr {
  border: 0;
  border-bottom: 1px solid var(--border-color--dropdown-separator);
}

.dropdown-items.thin {
  width: 170px;
}

.dropdown-items.wide {
  width: 400px;
}

.dropdown-items.compact .dropdown-item {
  padding: 2px 15px;
  border-bottom: 0;
}

.dropdown-items.compact .description {
  margin-left: 0;
}

.dropdown-items.compact hr {
  margin: 5px 0;
}

.dropdown-items.roomy .dropdown-item {
  padding: 10px 15px;
}

.dropdown-items.very-roomy .dropdown-item {
  padding: 16px 40px 16px 20px;
}

.dropdown-items.rounded {
  border-radius: 4px;
}

.dropdown-items.no-border .dropdown-item {
  border-bottom: 0;
}

.dropdown-items.center {
  left: 50%;
  right: unset;
  transform: translateX(-50%);
}

.dropdown-items.left {
  right: initial;
  left: 0;
}

.dropdown-items.over {
  top: 0;
}

.dropdown-items.top {
  bottom: calc(100% + 5px);
}

.dropdown-items.with-triangle:before {
  content: '';
  position: absolute;
  top: -6px;
  right: 10px;
  width: 10px;
  height: 10px;
  z-index: -1;
  transform: rotate(45deg);
  border-left: 1px solid #ddd;
  border-top: 1px solid #ddd;
  background: var(--bg-color--dropdown);
}

.dropdown-items.with-triangle.left:before {
  left: 10px;
}

.dropdown-items.with-triangle.center:before {
  left: 46%;
}

.dropdown-title {
  border-bottom: 1px solid var(--border-color--dropdown-item);
  padding: 2px 8px;
  font-size: 11px;
  color: var(--text-color--title);
}

.dropdown-item {
  display: block;
  padding: 7px 15px;
  border-bottom: 1px solid var(--border-color--dropdown-item);
}

.dropdown-item.disabled {
  opacity: 0.25;
}

.dropdown-item.no-border {
  border-bottom: 0;
}

.dropdown-item.selected {
  background: var(--bg-color--dropdown-item--hover);  
}

.dropdown-item:hover:not(.no-hover) {
  background: var(--bg-color--dropdown-item--hover);
  cursor: pointer;
}

.dropdown-item:hover:not(.no-hover) i:not(.fa-check-square) {
  color: var(--text-color--dropdown-default);
}

.dropdown-item:hover:not(.no-hover) .description {
  color: var(--text-color--dropdown-default);
}

.dropdown-item:hover:not(.no-hover).disabled {
  background: inherit;
  cursor: default;
}

.dropdown-item .fa,
.dropdown-item i {
  display: inline-block;
  width: 20px;
  color: var(--text-color--dropdown-icon);
}

.dropdown-item .fa-fw {
  margin-left: -3px;
  margin-right: 3px;
}

.dropdown-item img:not(.emoji) {
  display: inline-block;
  width: 16px;
  position: relative;
  top: 3px;
  margin-right: 6px;
}

.dropdown-item img.rounded {
  border-radius: 50%;
}

.dropdown-item .btn .fa {
  color: inherit;
}

.dropdown-item .label {
  font-weight: 500;
}

.dropdown-item .description {
  color: rgb(102, 102, 102);
  margin: 0px 0px 3px 27px;
}

.dropdown-item .label.truncate,
.dropdown-item .description.truncate {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .dropdown-item .label.truncate,
  .dropdown-item .description.truncate {
    max-width: 240px;
  }
}

.dropdown-item .description.small {
  font-size: 12.5px;
}

.dropdown-item:first-of-type {
  border-radius: 2px 2px 0 0;
}

.dropdown-item:last-of-type {
  border-radius: 0 0 2px 2px;
}

.dropdown-item .img-wrapper {
  display: flex;
  align-items: center;
}

.dropdown-item .img-wrapper img:not(.emoji) {
  display: block;
  top: 0;
  height: 40px;
  width: 40px;
  margin-right: 15px;
}

.dropdown-item .img-wrapper .description {
  margin-left: 0;
}

.emoji {
  display: inline-block;
  width: 1rem;
}

.context-menu {
  position: fixed;
  z-index: 10000;
}

.context-menu.has-parent {
  position: absolute;
}

.dropdown-items {
  width: auto;
  white-space: nowrap;
}

a.dropdown-item {
  color: inherit;
  text-decoration: none;
}

.dropdown-item,
.dropdown-items.roomy .dropdown-item {
  padding-right: 30px; /* add a little cushion to the right */
}

/* custom icon css */
.fa-long-arrow-alt-right.custom-link-icon {
  position: relative;
  transform: rotate(-45deg);
  left: 1px;
}
.fa-custom-path-icon:after {
  content: './';
  letter-spacing: -1px;
  font-family: var(--code-font);
}
`

customElements.define('app-context-menu', ContextMenu)