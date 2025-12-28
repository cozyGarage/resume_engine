/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'peek' verb for HackMyResume.
@module verbs/peek
@license MIT. See LICENSE.md for details.
*/



const Verb = require('../verbs/verb');
// No underscore needed; use native array functions.
const __ = require('lodash');
const safeLoadJSON = require('../utils/safe-json-loader');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');



/**
 * PeekVerb — Extracts a field or value by path from one or more resumes.
 * Example: hackmyresume peek resume.json basics.name
 */
class PeekVerb extends Verb {
  constructor() { super('peek', _peek); }
}


module.exports = PeekVerb;

/**
 * Entry point for the `peek` command. Returns selected path values from
 * one or more resume files.
 */
const _peek = function(src, dst, opts) {

  if (!src || !src.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  const objPath = (dst && dst[0]) || '';

  const results = src.map( t => {
    if (opts.assert && this.hasError()) { return {}; }
    const tgt = _peekOne.call(this, t, objPath);
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
};



/**
 * Peek at a single resume for the given object path. Returns a value or error object.
 */
const _peekOne = function(t, objPath) {

  this.stat(HMEVENT.beforePeek, { file: t, target: objPath });

  // Load the input file JSON 1st
  const obj = safeLoadJSON(t);

  // Fetch the requested object path (or the entire file)
  let tgt = null;
  if (!obj.ex) {
    tgt = objPath ? __.get(obj.json, objPath) : obj.json;
  }

  //# safeLoadJSON can only return a READ error or a PARSE error
  let pkgError = null;
  if (obj.ex) {
    const errCode = obj.ex.op === 'parse' ? HMSTATUS.parseError : HMSTATUS.readError;
    if (errCode === HMSTATUS.readError) {
      obj.ex.quiet = true;
    }
    pkgError = {fluenterror: errCode, inner: obj.ex};
  }

  // Fire the 'afterPeek' event with collected info
  this.stat(HMEVENT.afterPeek, {
    file: t,
    requested: objPath,
    target: obj.ex ? undefined : tgt,
    error: pkgError
  }
  );

  return {
    val: obj.ex ? undefined : tgt,
    error: pkgError
  };
};
