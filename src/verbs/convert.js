/**
 * Implementation of the 'convert' verb for HackMyResume.
 * @module verbs/convert
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const ResumeFactory = require('../core/resume-factory');
const Verb = require('../verbs/verb');
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');
const detectResumeFormat = require('../utils/resume-detector');

// Supported JRS schema versions
const VALID_JRS_FORMATS = new Set(['JRS', 'JRS@1', 'JRS@1.0', 'JRS@EDGE']);

/**
 * ConvertVerb — Converts resume files between formats.
 * Currently converts to JSON Resume (JRS) format.
 * @class ConvertVerb
 * @extends Verb
 */
class ConvertVerb extends Verb {
  /**
   * Create a new convert verb.
   */
  constructor() {
    super('convert', convert);
  }
}

module.exports = ConvertVerb;

/**
 * Convert verb implementation.
 * Convert/reserialize resumes into the requested target format.
 * @param {Array<string>} srcs - Source resume paths
 * @param {Array<string>} dst - Destination resume paths
 * @param {Object} [opts={}] - Conversion options
 * @returns {Array|null} Array of conversion results or null on error
 */
function convert(srcs, dst, opts = {}) {
  // If no source resumes are specified, error out
  if (!srcs?.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  // Handle destination logic
  if (!dst?.length) {
    if (srcs.length === 1) {
      // Single source with no destination is an error
      this.err(HMSTATUS.inputOutputParity, { quit: true });
    } else if (srcs.length === 2) {
      // Two sources: last one becomes destination (hackmyresume CONVERT r1.json r2.json)
      dst = dst ?? [];
      dst.push(srcs.pop());
    } else {
      this.err(HMSTATUS.inputOutputParity, { quit: true });
    }
  }

  // Different number of source and dest resumes? Error out.
  if (srcs?.length && dst?.length && srcs.length !== dst.length) {
    this.err(HMSTATUS.inputOutputParity, { quit: true });
  }

  // Validate format option
  const fmtUp = opts.format?.trim().toUpperCase() || 'JRS';
  if (!VALID_JRS_FORMATS.has(fmtUp)) {
    this.err(HMSTATUS.invalidSchemaVersion, { data: opts.format || 'JRS', quit: true });
  }

  // If any errors have occurred this early, we're done
  if (this.hasError()) {
    this.reject(this.errorCode);
    return null;
  }

  // Convert each source resume
  const results = srcs.map((src, idx) => {
    const r = convertOne.call(this, src, dst, idx);
    if (r?.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
    }
    return r;
  });

  if (this.hasError() && !opts.assert) {
    this.reject(results);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
}

/**
 * Convert a single resume.
 * @param {string} src - Source file path
 * @param {Array<string>} dst - Destination file paths
 * @param {number} idx - Index into dst array
 * @returns {Object} Resume object or error object
 */
function convertOne(src, dst, idx) {
  // Load the resume
  const rinfo = ResumeFactory.loadOne(src, {
    format: 'JRS',
    objectify: true,
    inner: { privatize: false }
  });

  // If a load error occurs, report it and return
  if (rinfo.fluenterror) {
    this.stat(HMEVENT.beforeConvert, {
      srcFile: src,
      srcFmt: '???',
      dstFile: dst[idx],
      dstFmt: '???',
      error: true
    });
    return rinfo;
  }

  const { rez } = rinfo;

  // Determine the resume's SOURCE format using the detector component
  const detectedFormat = detectResumeFormat(rez);
  const srcFmt = detectedFormat !== 'unk'
    ? detectedFormat.toUpperCase()
    : (rinfo.format?.toUpperCase() || 'JRS');

  // Target format is always JRS
  const targetFormat = 'JRS';

  // Fire the beforeConvert event
  this.stat(HMEVENT.beforeConvert, {
    srcFile: rinfo.file,
    srcFmt,
    dstFile: dst[idx],
    dstFmt: targetFormat
  });

  // Save it to the destination format
  try {
    rez.saveAs(dst[idx], targetFormat);
  } catch (err) {
    if (err.badVer) {
      return { fluenterror: HMSTATUS.invalidSchemaVersion, quit: true, data: err.badVer };
    }
    throw err;
  }

  return rez;
}
