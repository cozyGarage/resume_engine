/**
 * Implementation of the 'validate' verb for HackMyResume.
 * @module verbs/validate
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const Verb = require('../verbs/verb');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');
const safeLoadJSON = require('../utils/safe-json-loader');

/**
 * ValidateVerb — Validate one or more resumes against the JSON Resume
 * schema and return a compact results array indicating validity and errors.
 * @class ValidateVerb
 * @extends Verb
 */
class ValidateVerb extends Verb {
  /**
   * Create a new validate verb.
   */
  constructor() {
    super('validate', validate);
  }
}

module.exports = ValidateVerb;

/**
 * Validate verb implementation.
 * Validate one or more resumes against the JSON Resume schema.
 * @param {Array<string>} sources - Source resume file paths
 * @param {Array<string>} unused - Unused parameter
 * @param {Object} opts - Options
 * @returns {Array|null} Array of validation results or null on error
 */
function validate(sources, unused, opts) {
  if (!sources?.length) {
    this.err(HMSTATUS.resumeNotFoundAlt, { quit: true });
    return null;
  }

  const validator = require('is-my-json-valid');
  const schemas = {
    jars: require('../core/resume.json')
  };

  const results = sources.map(t => {
    const r = validateOne.call(this, t, validator, schemas, opts);
    if (r.error) {
      this.err(r.error.fluenterror, r.error);
    }
    return r;
  });

  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
}

/**
 * Validate a single resume file and return its status object.
 * @param {string} t - File path
 * @param {Function} validator - Validator function
 * @param {Object} schemas - Schema objects
 * @param {Object} opts - Options
 * @returns {Object} Validation result object
 */
function validateOne(t, validator, schemas, opts) {
  const ret = {
    file: t,
    isValid: false,
    status: 'unknown',
    schema: '-----'
  };

  try {
    // Read and parse the resume JSON
    const obj = safeLoadJSON(t);

    if (!obj.ex) {
      // Default to new JSON Resume schema: 'jars'
      ret.schema = 'jars';

      const validate = validator(schemas[ret.schema], {
        formats: {
          date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
        }
      });

      ret.isValid = validate(obj.json);
      ret.status = ret.isValid ? 'valid' : 'invalid';

      if (!ret.isValid) {
        ret.violations = validate.errors;
      }
    } else {
      // Package JSON read/parse errors
      const errCode = obj.ex.op === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
      ret.status = obj.ex.op === 'parse' ? 'broken' : 'missing';
      ret.error = {
        fluenterror: errCode,
        inner: obj.ex.inner,
        quiet: errCode === HMSTATUS.readError
      };
    }
  } catch (err) {
    // Package any unexpected exceptions
    ret.error = { fluenterror: HMSTATUS.validateError, inner: err };
  }

  this.stat(HMEVENT.afterValidate, ret);
  return ret;
}
