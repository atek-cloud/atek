import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { ValidationError } from '../lib/errors.js'

export const ajv = new Ajv.default({strictTuples: false})
addFormats(ajv)

export interface ValidateFunctionWithAssert extends ValidateFunction {
  assert: (any) => void
}

export function createValidator (schema: object): ValidateFunctionWithAssert {
  const validate = ajv.compile(schema)
  validate.assert = (value) => {
    const valid = validate(value)
    if (!valid) {
      throw new ValidationError(validate.errors[0])
    }
  }
  return validate
}

