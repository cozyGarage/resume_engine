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
const resumeDetect    = require('../utils/resume-detector');
require('string.prototype.startswith');



/**
A simple factory class for JSON Resumes (JRS).
@class ResumeFactory
*/

module.exports = {



  /**
  Load one or more resumes from disk.

  @param {Object} opts An options object with settings for the factory as well
  as passthrough settings for JRSResume. Structure:

      {
        format: 'JRS',      // Format to open as (only JRS supported)
        objectify: true,    // JRSResume or raw JSON?
        inner: {            // Passthru options for JRSResume
          sort: false
        }
      }

  */
  load( sources, opts, emitter ) {
    return sources.map( function(src) {
      return this.loadOne( src, opts, emitter );
    }
    , this);
  },


  /** Load a single resume from disk.  */
  loadOne( src, opts, emitter ) {

    // Load and parse the resume JSON
    const info = _parse(src, opts, emitter);
    if (info.fluenterror) { return info; }

    // Determine the resume format: must be JRS
    let { json } = info;
    const orgFormat = resumeDetect(json);
    if (orgFormat === 'unk') {
      info.fluenterror = HMS.unknownSchema;
      return info;
    }

    // Objectify the resume, that is, convert it from JSON to a JRSResume object.
    let rez = null;
    if (opts.objectify) {
      const ResumeClass = require('../core/jrs-resume');
      rez = new ResumeClass().parseJSON( json, opts.inner );
      rez.i().file = src;
    }

    return {
      file: src,
      json: info.json,
      rez
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
    const orgFormat = 'jrs';  // We only support JRS now

    eve && eve.stat(HME.afterParse, { file: fileName, data: ret.json, fmt: orgFormat });
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
