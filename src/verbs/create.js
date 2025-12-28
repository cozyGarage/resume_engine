/**
 * Implementation of the 'create' verb for HackMyResume.
 * @module verbs/create
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const FS = require('fs');
const PATH = require('path');
const Verb = require('../verbs/verb');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');

// Supported resume formats
const VALID_FORMATS = new Set(['JRS', 'FRESH']);

/**
 * CreateVerb — Implements the `new` (create) command used to generate a
 * new empty resume on disk in a specified format (JRS or FRESH).
 * @class CreateVerb
 * @extends Verb
 */
class CreateVerb extends Verb {
  /**
   * Create a new create verb.
   */
  constructor() {
    super('new', create);
  }
}

module.exports = CreateVerb;

/**
 * Create verb implementation.
 * Create new resume files in the specified format.
 * @param {Array<string>} src - Paths to create resumes at
 * @param {Array<string>} dst - Destination paths (unused)
 * @param {Object} [opts={}] - Options including format
 * @returns {Array|null} Array of created resumes or null on error
 */
function create(src, dst, opts = {}) {
  // Validate inputs
  if (!src?.length) {
    this.err(HMSTATUS.createNameMissing, { quit: true });
    return null;
  }

  // Normalize format to upper-case, default to JRS
  const format = (opts.format || 'JRS').toString().toUpperCase();
  opts.format = format;

  const results = src.map(t => {
    if (opts.assert && this.hasError()) {
      return {};
    }

    const r = createOne.call(this, t, opts);
    if (r?.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
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
 * Create a single resume file on disk.
 * Creates the parent directory if it doesn't exist.
 * @param {string} t - Path for the new resume file
 * @param {Object} opts - Options with format property
 * @returns {Object} The new resume object or error object
 */
function createOne(t, opts) {
  let ret = null;
  const safeFmt = (opts.format || 'JRS').toString().toUpperCase();

  try {
    this.stat(HMEVENT.beforeCreate, { fmt: safeFmt, file: t });

    // Ensure destination folder exists
    FS.mkdirSync(PATH.dirname(t), { recursive: true });

    // Load the appropriate resume class and create a default instance
    const RezClass = require(`../core/${safeFmt.toLowerCase()}-resume`);
    const newRez = RezClass.default();
    newRez.save(t);
    ret = newRez;
  } catch (err) {
    ret = { fluenterror: HMSTATUS.createError, inner: err };
  } finally {
    this.stat(HMEVENT.afterCreate, {
      fmt: safeFmt,
      file: t,
      isError: ret?.fluenterror
    });
  }

  return ret;
}
