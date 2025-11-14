/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'convert' verb for HackMyResume.
@module verbs/convert
@license MIT. See LICENSE.md for details.
*/



const ResumeFactory = require('../core/resume-factory');
const Verb = require('../verbs/verb');
const HMSTATUS = require('../core/status-codes');
const _ = require('underscore');
const HMEVENT = require('../core/event-codes');



class ConvertVerb extends Verb {
  constructor() { super('convert', _convert); }
}

module.exports = ConvertVerb;



/** Private workhorse method. Convert 0..N resumes between FRESH and JRS
formats. */

var _convert = function( srcs, dst, opts ) {

  opts = opts || {};

  // If no source resumes are specified, error out
  if (!srcs || !srcs.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  // If no destination resumes are specified, error out except for the special
  // case of two resumes:
  //   hackmyresume CONVERT r1.json r2.json
  if (!dst || !dst.length) {
    if (srcs.length === 1) {
      this.err(HMSTATUS.inputOutputParity, { quit: true });
    } else if (srcs.length === 2) {
      dst = dst || []; dst.push( srcs.pop() );
    } else {
      this.err(HMSTATUS.inputOutputParity, { quit: true });
    }
  }

  // Different number of source and dest resumes? Error out.
  if (srcs && dst && srcs.length && dst.length && (srcs.length !== dst.length)) {
    this.err(HMSTATUS.inputOutputParity, { quit: true });
  }

  const fmtUp = opts.format ? opts.format.trim().toUpperCase() : 'JRS';
  if (!_.contains(['JRS','JRS@1','JRS@1.0','JRS@EDGE'], fmtUp)) {
    this.err(HMSTATUS.invalidSchemaVersion, {data: opts.format || 'JRS', quit: true});
  }
    // freshVerRegex = require '../utils/fresh-version-regex'
    // matches = fmtUp.match freshVerRegex()
    // # null
    // # [ 'JRS@1.0', 'JRS', '1.0', index: 0, input: 'FRESH' ]
    // # [ 'FRESH', 'FRESH', undefined, index: 0, input: 'FRESH' ]
    // if not matches
    //   @err HMSTATUS.invalidSchemaVersion, data: opts.format.trim(), quit: true
    // targetSchema = matches[1]
    // targetVer = matches[2] || '1'

  // If any errors have occurred this early, we're done.
  if (this.hasError()) {
    this.reject(this.errorCode);
    return null;
  }

  // Map each source resume to the converted destination resume
  const results = _.map(srcs, function( src, idx ) {

    // Convert each resume in turn
  const r = _convertOne.call(this, src, dst, idx);

    // Handle conversion errors
    if (r.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
    }
    return r;
  }
  , this);


  if (this.hasError() && !opts.assert) {
    this.reject(results);
  } else if (!this.hasError()) {
    this.resolve(results);
  }
  return results;
};



/** Private workhorse method. Convert a single resume. */
var _convertOne = function(src, dst, idx) {

  // Load the resume
  const rinfo = ResumeFactory.loadOne(src, {
    format: 'JRS',
    objectify: true,
    inner: {
      privatize: false
    }
  }
  );

  // If a load error occurs, report it and move on to the next file (if any)
  if (rinfo.fluenterror) {
    this.stat(HMEVENT.beforeConvert, {
      srcFile: src, //rinfo.file
      srcFmt: '???',
      dstFile: dst[idx],
      dstFmt: '???',
      error: true
    }
    );
    //@err rinfo.fluenterror, rinfo
    return rinfo;
  }

  // Determine the resume's SOURCE format
  // TODO: replace with detector component
  const { rez } = rinfo;
  const srcFmt = (rinfo && rinfo.format) ? rinfo.format.toUpperCase() : 'JRS';

  // Determine the TARGET format for the conversion
  const targetFormat = 'JRS';

  // Fire the beforeConvert event
  this.stat(HMEVENT.beforeConvert, {
    srcFile: rinfo.file,
    srcFmt,
    dstFile: dst[idx],
    dstFmt: targetFormat
  }
  );

  // Save it to the destination format
  try {
  rez.saveAs(dst[idx], targetFormat);
  } catch (err) {
    if (err.badVer) {
      return {fluenterror: HMSTATUS.invalidSchemaVersion, quit: true, data: err.badVer};
    }
  }
  return rez;
};
