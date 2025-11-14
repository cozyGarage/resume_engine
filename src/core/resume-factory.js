/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the ResumeFactory class.
@license MIT. See LICENSE.md for details.
@module core/resume-factory
*/



const FS              = require('fs');
const HMS    = require('./status-codes');
const HME             = require('./event-codes');
const ensureJrs       = require('../utils/ensure-jrs');
const JRSResume       = require('../core/jrs-resume');
require('string.prototype.startswith');



/**
A simple factory class for FRESH and JSON Resumes.
@class ResumeFactory
*/

module.exports = {



  /**
  Load one or more resumes from disk.

  @param {Object} opts An options object with settings for the factory as well
  as passthrough settings for FRESHResume or JRSResume. Structure:

      {
        format: 'FRESH',    // Format to open as. ('FRESH', 'JRS', null)
        objectify: true,    // FRESH/JRSResume or raw JSON?
        inner: {            // Passthru options for FRESH/JRSResume
          sort: false
        }
      }

  */
  load( sources, opts, emitter ) {
    opts = opts || {};
    return sources.map( function(src) {
      return this.loadOne( src, opts, emitter );
    }
    , this);
  },


  /** Load a single resume from disk.  */
  loadOne( src, opts, emitter ) {

    opts = opts || {};
    const desiredFormat = opts.format ? String(opts.format).toUpperCase().trim() : 'JRS';
    if (desiredFormat && desiredFormat !== 'JRS') {
      opts.format = 'JRS';
    }

    const info = _parse(src, opts, emitter);
    if (info.fluenterror) { return info; }

    const normalized = ensureJrs(info.json);
    if (normalized.detectedFormat === 'unk') {
      return {
        fluenterror: HMS.unknownSchema,
        file: src
      };
    }

    const objectify = opts.objectify !== false;
    let rez = null;
    if (objectify) {
      rez = new JRSResume().parseJSON(normalized.json, opts.inner);
      rez.i().file = src;
    }

    return {
      file: src,
      json: normalized.json,
      rez,
      format: normalized.detectedFormat,
      wasConverted: normalized.wasConverted
    };
  }
};


var _parse = function( fileName, opts, eve ) {

  let rawData = null;
  try {

    // Read the file
    eve && eve.stat( HME.beforeRead, { file: fileName });
    rawData = FS.readFileSync( fileName, 'utf8' );
    eve && eve.stat( HME.afterRead, { file: fileName, data: rawData });

    // Parse the file
    eve && eve.stat(HME.beforeParse, { data: rawData });
    const ret = { json: JSON.parse( rawData ) };
    eve && eve.stat(HME.afterParse, { file: fileName, data: ret.json });
    return ret;
  } catch (err) {
    // Can be ENOENT, EACCES, SyntaxError, etc.
    return {
      fluenterror: rawData ? HMS.parseError : HMS.readError,
      inner: err,
      raw: rawData,
      file: fileName
    };
  }
};
