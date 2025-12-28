/**
 * Implementation of the 'peek' verb for HackMyResume.
 * @module verbs/peek
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const Verb = require('../verbs/verb');
const __ = require('lodash');
const safeLoadJSON = require('../utils/safe-json-loader');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');

/**
 * PeekVerb — Extracts a field or value by path from one or more resumes.
 * Example: hackmyresume peek resume.json basics.name
 * @class PeekVerb
 * @extends Verb
 */
class PeekVerb extends Verb {
  /**
   * Create a new peek verb.
   */
  constructor() {
    super('peek', peek);
  }
}

module.exports = PeekVerb;

/**
 * Peek verb implementation.
 * Returns selected path values from one or more resume files.
 * @param {Array<string>} src - Source resume file paths
 * @param {Array<string>} dst - Path to peek at (first element used)
 * @param {Object} opts - Options
 * @returns {Array|null} Array of peek results or null on error
 */
function peek(src, dst, opts) {
  if (!src?.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  const objPath = dst?.[0] || '';

  const results = src.map(t => {
    if (opts.assert && this.hasError()) {
      return {};
    }

    const tgt = peekOne.call(this, t, objPath);
    if (tgt.error) {
      this.setError(tgt.error.fluenterror, tgt.error);
    }
    return tgt;
  });

  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
}

/**
 * Peek at a single resume for the given object path.
 * @param {string} t - File path
 * @param {string} objPath - Dot-notation path to peek at
 * @returns {Object} Object with val and error properties
 */
function peekOne(t, objPath) {
  this.stat(HMEVENT.beforePeek, { file: t, target: objPath });

  // Load the input file JSON
  const obj = safeLoadJSON(t);

  // Fetch the requested object path (or the entire file)
  let tgt = null;
  if (!obj.ex) {
    tgt = objPath ? __.get(obj.json, objPath) : obj.json;
  }

  // Handle errors (safeLoadJSON can return READ or PARSE errors)
  let pkgError = null;
  if (obj.ex) {
    const errCode = obj.ex.op === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
    if (errCode === HMSTATUS.readError) {
      obj.ex.quiet = true;
    }
    pkgError = { fluenterror: errCode, inner: obj.ex };
  }

  // Fire the 'afterPeek' event with collected info
  this.stat(HMEVENT.afterPeek, {
    file: t,
    requested: objPath,
    target: obj.ex ? undefined : tgt,
    error: pkgError
  });

  return {
    val: obj.ex ? undefined : tgt,
    error: pkgError
  };
}
