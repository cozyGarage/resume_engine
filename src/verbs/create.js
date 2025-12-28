/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'create' verb for HackMyResume.
@module verbs/create
@license MIT. See LICENSE.md for details.
*/



const FS = require('fs');
const PATH = require('path');
const Verb = require('../verbs/verb');
const _ = require('underscore');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');



/**
 * CreateVerb — Implements the `new` (create) command used to generate a
 * new empty resume on disk in a specified format (JRS or FRESH).
 *
 * Usage: new <path> [--format JRS|FRESH]
 */
class CreateVerb extends Verb {
  constructor() {
    super('new', _create);
  }
}


module.exports = CreateVerb;



/** Create a new empty resume in either JSON Resume (JRS) or FRESH format. */
/**
 * Create a new resume in the specified format.
 * @param {Array<string>} src - Source file paths to create
 * @param {Array|string} dst - Destination paths (not used by new)
 * @param {Object} opts - Options hash (format, assert)
 * @returns {Array|Object} Results for each created resume
 */
/**
 * Bulk create handler invoked by the CLI. Accepts an array of source
 * destination paths to create and an options object. Returns an array of
 * results or throws an error via the Verb's reject mechanism.
 */
const _create = function(src, dst, opts) {
  // Validate inputs
  if (!src || !src.length) {
    this.err(HMSTATUS.createNameMissing, { quit: true });
    return null;
  }

  // Default to JRS when not specified
  opts = opts || {};
  // Normalize format to upper-case JRS|FRESH
  opts.format = (opts.format || 'JRS').toString().toUpperCase();

  const results = src.map( t => {
    if (opts.assert && this.hasError()) return {};
    const r = _createOne.call(this, t, opts);
    if (r && r.fluenterror) {
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
};



/** Create a single new resume */
/**
 * Create a single resume file in disk.
 * @param {string} t - Path for the new resume file
 * @param {Object} opts - Options hash with .format set
 * @returns {Object} The new resume object or a fluenterror object
 */
/**
 * Create a single resume file on disk. Will create the parent directory
 * if it doesn't exist. The resume implementation is loaded by format.
 *
 * Returns either the created resume instance or an error object with
 * a fluenterror property.
 */
const _createOne = function(t, opts) {
  let ret = null;
  const safeFmt = (opts.format || 'JRS').toString().toUpperCase();
  try {
    this.stat(HMEVENT.beforeCreate, { fmt: safeFmt, file: t });
    // Ensure destination folder exists in a modern Node-friendly way
    FS.mkdirSync(PATH.dirname(t), { recursive: true });
    const RezClass = require(`../core/${safeFmt.toLowerCase()}-resume`);
    const newRez = RezClass.default();
    newRez.save(t);
    ret = newRez;
  } catch (err) {
    ret = { fluenterror: HMSTATUS.createError, inner: err };
  } finally {
    this.stat(HMEVENT.afterCreate, { fmt: safeFmt, file: t, isError: ret && ret.fluenterror });
  }
  return ret;
};
