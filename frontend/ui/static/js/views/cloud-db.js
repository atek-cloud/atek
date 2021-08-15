import { LitElement, html } from '../../vendor/lit/lit.min.js'
import { repeat } from '../../vendor/lit/directives/repeat.js'
import { guard } from '../../vendor/lit/directives/guard.js'
import * as session from '../lib/session.js'
import { joinPath } from '../lib/strings.js'
import '../com/header.js'
import '../com/button.js'

class AppCloudDbView extends LitElement {
  static get properties () {
    return {
      currentPath: {type: String, attribute: 'current-path'},
      currentView: {type: String},
      error: {type: String},
      record: {type: Array},
      records: {type: Array},
      hasChanges: {type: Boolean},
      modifiedData: {type: Object}
    }
  }

  createRenderRoot() {
    return this // dont use shadow dom
  }

  constructor () {
    super()
    this.currentPath = ''
    this.currentView = 'form'
    this.hyperKey = ''
    this.dbDesc = undefined
    this.tables = undefined
    this.error = undefined
    this.record = undefined
    this.records = undefined
    this.hasChanges = false
    this.modifiedData = undefined

    this.iframe = undefined
    this.iframeResizeObserver = undefined
  }

  async load () {
    document.title = `Server Settings`
    if (!session.isActive()) {
      window.location = '/'
      return
    }

    this.record = undefined
    this.records = undefined
    this.hasChanges = false
    this.modifiedData = undefined
    const pathParts = this.currentPath.split('/').filter(Boolean)
    this.hyperKey = pathParts[3]

    if (!this.dbDesc) {
      this.dbDesc = (await (await fetch(`/_api/hyper/${this.hyperKey}/uwg`)).json())?.value
      console.log(this.dbDesc)
      if (this.dbDesc) {
        this.tables = (await (await fetch(`/_api/uwg/${this.hyperKey}/description`)).json())?.tables
        console.log(this.tables)
      }
    }

    const path = pathParts.slice(4).join('/')
    this.currentDBPath = path
    this.currentView = 'form'
    try {
      const res = await (await fetch(`/_api/hyper/${this.hyperKey}/${path}`)).json()
      if (res.records) {
        this.records = res.records
      } else {
        this.record = res
        if (this.getSchema(this.record.path)) {
          this.currentView = 'form'
        } else {
          this.currentView = 'data'
        }
      }
      console.log(path, res)
    } catch (e) {
      this.error = e.toString()
      console.log('Failed to fetch records')
      console.log(e)
    }
  }

  async refresh () {
  }

  async pageLoadScrollTo (y) {
  }

  getNamespaceDescription (path) {
    if (path.length === 1) {
      return html`${this.tables.filter(t => t.id.startsWith(`${path[0]}/`)).map(t => t.title).join(', ')}`
    }
    if (path.length === 2) {
      const table = this.tables.find(t => t.id === path.join('/'))
      if (table) return html`${table.title || table.id} ${table.description ? ` — ${table.description}` : ''}`
    }
    return html`<span class="fas fa-fw fa-caret-right"></span>`
  }

  getTable (path) {
    return this.tables.find(t => t.id === path.slice(0, 2).join('/'))
  }

  getSchema (path) {
    const table = this.getTable(path)
    if (table) return table.definition
    return undefined
  }

  async updated (changedProperties) {
    const iframe = this.querySelector('iframe')
    if (this.record) {
      if (iframe && iframe !== this.iframe) {
        if (!iframe.contentWindow.isAppReady) {
          await new Promise(r => iframe.contentWindow.addEventListener('DOMContentLoaded', r))
        }
        const schema = this.getSchema(this.record.path)
        iframe.contentWindow.app.render({schema, initialData: this.record.value})
        
        iframe.height = iframe.contentWindow.document.body.scrollHeight + 10;
        if (!this.iframeResizeObserver) {
          this.iframeResizeObserver = new ResizeObserver(entries => {
            iframe.height = iframe.contentWindow.document.body.scrollHeight + 10;
          })
          this.iframeResizeObserver.observe(iframe.contentWindow.document.body)
        }
      } else if (changedProperties.has('currentView')) {
        const table = this.getTable(this.record.path)
        if (this.currentView === 'schema') {
          iframe.contentWindow.app.render({schema: table.definition, initialData: table, mode: 'editor', readonly: true})
        } else {
          iframe.contentWindow.app.render({schema: table.definition, initialData: this.modifiedData || this.record.value, mode: this.currentView})
        }
      }
    }
    if (iframe && !this.iframe) {
      iframe.contentWindow.addEventListener('data-change', this.onJsonFormsDataChange.bind(this))
    }
    if (!iframe && this.iframeResizeObserver) {
      this.iframeResizeObserver.unobserve(this.iframe)
      this.iframeResizeObserver = undefined
    }
    this.iframe = iframe
  }

  // rendering
  // =

  render () {
    return html`
      <main class="min-h-screen bg-default-3">
        <app-header></app-header>
        <div class="px-4 py-4">
          <h1 class="text-lg mb-2 font-medium">
            <a class="text-primary hover:underline" href="/p/cloud">My Cloud</a>
            › <a class="hover:underline" href="/p/cloud/view/${this.hyperKey}">System Settings</a>
          </h1>
          <div class="mb-2">${this.renderBreadcrumbs()}</div>
          ${this.renderCurrentData()}
        </div>
      </main>
    `
  }

  renderBreadcrumbs () {
    const htmlAcc = []
    const pathParts = this.currentPath.split('/').filter(Boolean).slice(4)
    let pathAcc = '/'
    htmlAcc.push(html`
      <a class="px-2 py-1 hover:text-primary" href="/p/cloud/view/${this.hyperKey}/">Root</a>
    `)
    for (let i = 0; i < pathParts.length; i++) {
      htmlAcc.push(html`
        <div class="relative" style="width: 20px">
          <div class="absolute border-t border-r border-default" style="transform: rotate(45deg); width: 24px; height: 24px; left: -10px; top: 4px;"></div>
        </div>
      `)
      const part = pathParts[i]
      htmlAcc.push(html`
        <a class="px-2 py-1 hover:text-primary" href="/p/cloud/view/${this.hyperKey}${pathAcc}${part}">${part}</a>
      `)
      pathAcc += `${part}/`
    }
    return html`
      <div class="inline-flex border border-default rounded bg-default px-2">
        ${htmlAcc}
      </div>
    `
  }

  renderCurrentData () {
    if (this.records) {
      return this.renderRecords()
    } else if (this.record) {
      return this.renderRecord()
    } else {
      return html`
        <div><span class="spinner"></span></div>
      `
    }
  }

  renderRecords () {
    const schemaIdParts = this.currentDBPath.split('/').filter(Boolean)
    const schemaId = schemaIdParts.join('/')
    const table = this.tables?.find(t => t.id === schemaId)
    return html`
      <div class="flex">
        <div class="flex-1 mr-2 min-w-0">
          <div class="flex border border-primary bg-primary-2 text-inverse rounded-t">
            <div class="px-2 py-0.5" style="flex: 0 0 200px">Key</div>
            <div class="flex-1 px-2 py-0.5 border-l border-primary">Description</div>
          </div>
          ${repeat(this.records, (record, i) => html`
            <a class="flex border border-t-0 border-default bg-default hover:bg-default-2 cursor-pointer ${i === this.records.length - 1 ? 'rounded-b' : ''} tabular-nums" href="${joinPath(this.currentPath, record.key)}">
              <div class="px-2 py-2 truncate" style="flex: 0 0 200px">${record.key}</div>
              <div class="flex-1 px-2 py-2 border-l border-default truncate">
                ${record.value === null ? html`
                  <span class="font-sans">${this.getNamespaceDescription(record.path)}</span>
                ` : record.shell?.description ? html`
                  <span class="font-sans">${record.shell.description}</span>
                ` : record.path[0] === 'uwg' && record.path.length === 1 ? html`
                  <span class="font-sans">Database metadata record</span>
                ` : JSON.stringify(record.value)}
              </div>
            </a>
          `)}
        </div>
        <div style="flex: 0 0 33vw">
          ${table ? html`
            <div class="mb-2 px-2 py-2 bg-default border border-default rounded">
              <div class="border-b border-default font-medium mb-2 pb-2 px-1 text-lg">
                <div class="font-medium">${table.title || table.id}</div>
                ${table.description ? html`<div class="text-sm">${table.description}</div>` : ''}
              </div>
              <div>
                <app-button transparent label="New record" icon="fas fa-plus" @click=${this.onClickNew}></app-button>
              </div>
            </div>
          ` : html`
            ${this.renderTables()}
          `}
        </div>
      </div>
    `
  }

  renderRecord () {
    const path = `/${this.record?.path?.join('/')}`
    const schema = this.record ? this.getSchema(this.record.path) : undefined
    const desc = this.record.shell?.description
      ? this.record.shell.description
      : path === '/uwg' ? 'Database metadata record' : undefined
    return html`
      <div class="flex">
        <div class="flex-1 mr-2">
          ${guard([this.currentPath], () => html`
            <iframe id="json-forms-iframe" src="/dev/json-forms" class="w-full"></iframe>
          `)}
        </div>
        <div style="flex: 0 0 33vw">
          <div class="bg-default border border-default rounded mb-1">
            <div class="px-2 py-2">
              <app-button ?primary=${this.hasChanges} label="Save changes" icon="fas fa-save" ?disabled=${!this.hasChanges} @click=${this.onClickSave}></app-button>
              <app-button transparent btn-class="hover:text-error" label="Delete" icon="far fa-trash-alt" @click=${this.onClickDelete}></app-button>
            </div>
            ${desc ? html`
              <div class="flex items-center border-t border-default">
                <div class="px-2 py-1.5 text-sm border-r border-default-2 text-default-3" style="flex: 0 0 55px">Desc</div>
                <div class="px-2 py-1.5 flex-1">${desc}</div>
              </div>
            `  : ''}
            <div class="flex items-center border-t border-default-2">
              <div class="px-2 py-1.5 text-sm border-r border-default-2 text-default-3" style="flex: 0 0 55px">Key</div>
              <div class="px-2 py-1.5 flex-1">${this.record.key}</div>
            </div>
            <div class="flex items-center border-t border-default-2">
              <div class="px-2 py-1.5 text-sm border-r border-default-2 text-default-3" style="flex: 0 0 55px">Seq</div>
              <div class="px-2 py-1.5 flex-1">${this.record.seq}</div>
            </div>
            <div class="border-t border-default-2 px-2 py-1 text-sm text-default-3">
              ${schema ? html`
                <a class="${this.currentView === 'form' ? 'font-semibold' : ''} ml-1 cursor-pointer hover:underline" @click=${e => this.setCurrentView('form')}>Form</a>
              ` : ''}
              <a class="${this.currentView === 'data' ? 'font-semibold' : ''} ml-1 cursor-pointer hover:underline" @click=${e => this.setCurrentView('data')}>Data</a>
              ${schema ? html`
                <a class="${this.currentView === 'schema' ? 'font-semibold' : ''} ml-1 cursor-pointer hover:underline" @click=${e => this.setCurrentView('schema')}>Schema</a>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `
  }

  renderTables () {
    let tables = this.tables
    const pathParts = this.currentDBPath.split('/').filter(Boolean)
    if (pathParts.length === 1) tables = tables.filter(t => t.id.split('/')[0] === pathParts[0])
    if (pathParts.length > 1) return ''
    return html`
      <div class="mb-2 px-2 py-2 bg-default border border-default rounded">
        <h2 class="border-b border-default font-medium mb-2 pb-1 px-1 text-lg">
          ${pathParts.length === 1 ? pathParts[0] : 'All'}
          Tables
        </h2>
        ${repeat(tables, t => t.id, table => html`
          <a class="flex items-center rounded bg-default hover:bg-default-2 cursor-pointer px-2 py-2" href="/p/cloud/view/${this.hyperKey}/${table.id}/">
            <div style="flex: 0 0 40px">
              <img class="block" src="/img/table.png" style="width: 40px; height: 40px">
            </div>
            <div class="flex-1 pl-2 truncate">
              <div class="text leading-none mb-1 truncate">${table.title || table.id.split('/')[1]}</div>
              <div class="text-xs text-default-2 leading-none">${table.id.split('/')[0]}</div>
            </div>
          </a>
        `)}
      </div>
    `
  }

  // events
  // =

  onJsonFormsDataChange (e) {
    this.hasChanges = true
    this.modifiedData = e.detail.data
  }

  setCurrentView (view) {
    this.currentView = view
  }

  onClickNew () {
    alert('TODO')
  }

  onClickSave () {
    alert('TODO')
  }

  onClickDelete () {
    if (!confirm('Delete this record?')) return
    alert('TODO')
  }
}

customElements.define('app-cloud-db-view', AppCloudDbView)