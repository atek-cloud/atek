import createMlts from 'monotonic-lexicographic-timestamp'
import { JsonPointer } from 'json-ptr'
import { ValidateFunction } from 'ajv'
import { ValidationError } from '../lib/errors.js'
import { ajv } from './util.js'

const VALID_PTR_RESULT_TYPES = ['number', 'string', 'boolean']
const mlts = createMlts()

interface TemplateDefinitionSegment {
  type: 'string' | 'json-pointer' | 'auto'
  value: string
}

interface TemplateFunction {
  (value: any): string
}

interface ShellObject {
  descTemplate: TemplateFunction
}

export interface APDLSchema {
  id: string
  rev?: number
  type: 'api' | 'adb-record'
  definition?: object
  blobs?: object
  keyTemplate?: TemplateDefinitionSegment[]
  shell?: {
    descTemplate?: TemplateDefinitionSegment[]
  }
}

export class Schema {
  id: string
  schemaObject: APDLSchema
  validate: ValidateFunction
  keyTemplate: TemplateFunction
  shell: ShellObject

  constructor (obj: APDLSchema) {
    this.id = obj.id
    this.schemaObject = obj
    this.validate = undefined
    this.keyTemplate = undefined
    this.shell = {
      descTemplate: undefined
    }

    const failure = (msg, e) => {
      console.error(msg, this.id)
      console.error(e)
      process.exit(1)
    }

    try {
      if (this.schemaObject.definition) {
        this.validate = ajv.compile(this.schemaObject.definition)
      }
    } catch (e) { failure('Failed to compile schema definition', e) }
    try {
      if (this.schemaObject.keyTemplate) {
        this.keyTemplate = compileTemplateGenerator(this.schemaObject.keyTemplate)
      }
    } catch (e) { failure('Failed to compile schema keyTemplate', e) }
    try {
      if (this.schemaObject.shell?.descTemplate) {
        this.shell.descTemplate = compileTemplateGenerator(this.schemaObject.shell.descTemplate)
      }
    } catch (e) { failure('Failed to compile schema shell.descTemplate', e) }

    if (this.schemaObject.type === 'api') {
      // no further setup needed
    } else if (this.schemaObject.type === 'adb-record') {
      // no further setup needed
    } else {
      console.error('Unknown table type:', this.schemaObject.type)
    }
  }

  get domain (): string {
    return this.id.split('/')[0]
  }

  get name (): string {
    return this.id.split('/')[1]
  }

  get rev (): number {
    return this.schemaObject?.rev || 1
  }

  generateKey (value: any): string {
    if (!this.keyTemplate) {
      throw new Error(`Unable to generate key for ${this.id} record, no keyTemplate specified`)
    }
    return this.keyTemplate(value)
  }

  generateShellDesc (value: any): string {
    if (this.shell.descTemplate) {
      return this.shell.descTemplate(value)
    }
  }

  get hasCreatedAt (): boolean {
    return (
      this.schemaObject.type === 'adb-record'
      && this.schemaObject.definition
      && (
        this.schemaObject.definition.properties?.createdAt
        || this.schemaObject.definition.oneOf?.every?.(obj => obj.properties.createdAt)
      )
    )
  }

  assertValid (value) {
    const valid = this.validate(value)
    if (!valid) {
      throw new ValidationError(this.validate.errors[0])
    }
  }

  assertBlobMimeTypeValid (blobName, mimeType) {
    const def = this.schemaObject?.blobs?.[blobName]
    if (!def) {
      throw new ValidationError(`Invalid blob name: ${blobName}`)
    }
    if (def.mimeTypes && !def.mimeTypes.includes(mimeType)) {
      throw new ValidationError(`Blob mime-type (${mimeType}) is invalid, must be one of ${def.mimeTypes.join(', ')}`)
    }
  }

  assertBlobSizeValid (blobName, size) {
    const def = this.schemaObject?.blobs?.[blobName]
    if (!def) {
      throw new ValidationError(`Invalid blob name: ${blobName}`)
    }
    if (def.maxSize && size > def.maxSize) {
      throw new ValidationError(`Blob size (${size}) is larger than allowed (${def.maxSize})`)
    }
  }
}

export function compileTemplateGenerator (tmpl: TemplateDefinitionSegment[]): TemplateFunction {
  const templateFns = compileTemplateGeneratorInner(tmpl)
  return value => templateFns.map(fn => fn(value)).join('')
}

function compileTemplateGeneratorInner (tmpl: TemplateDefinitionSegment[]): ((any) => string)[] {
  return tmpl.map(segment => {
    if (segment.type === 'json-pointer') {
      if (typeof segment.value !== 'string') {
        throw new Error('"json-pointer" must have a value')
      }
      const ptr = JsonPointer.create(segment.value)
      return (record) => {
        let value = ptr.get(record)
        if (!VALID_PTR_RESULT_TYPES.includes(typeof value)) {
          throw new Error(`Unable to generate key, ${segment.value} found type ${typeof value}`)
        }
        return String(value)
      }
    } else if (segment.type === 'auto') {
      return (record) => mlts()
    } else if (segment.type === 'string') {
      if (typeof segment.value !== 'string') {
        throw new Error('"string" must have a value')
      }
      return (record) => segment.value
    } else {
      throw new Error(`Unknown template segment type: "${segment.type}"`)
    }
  })
}