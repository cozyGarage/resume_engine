/**
 * Definition of the JsonGenerator class.
 * @module generators/json-generator
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const BaseGenerator = require('./base-generator');
const FS = require('fs');

// Optional FRESH converter
let FJCV = null;
try {
  FJCV = require('fresh-jrs-converter');
} catch {
  FJCV = null;
}

/**
 * JsonGenerator - Generates a JSON Resume (JRS) or FRESH resume as output.
 * @class JsonGenerator
 * @extends BaseGenerator
 */
class JsonGenerator extends BaseGenerator {
  /**
   * Create a new JSON generator.
   */
  constructor() {
    super('json');
  }

  /**
   * Generate JSON string from a resume object.
   * @param {Object} rez - Resume object
   * @returns {string} JSON string representation
   */
  invoke(rez) {
    // If we are a JSON Resume, prefer the resume stringify method
    if (rez?.format?.() === 'JRS') {
      return typeof rez.stringify === 'function'
        ? rez.stringify()
        : JSON.stringify(rez, null, 2);
    }

    // For FRESH resumes, we need the converter
    if (!FJCV) {
      throw new Error(
        'FRESH conversion support was removed; to generate FRESH from a JRS resume ' +
        'install fresh-jrs-converter or convert to JRS first.'
      );
    }

    const targetFormat = rez.format() === 'FRESH' ? 'JRS' : 'FRESH';
    const altRez = FJCV[`to${targetFormat}`](rez);
    return FJCV.toSTRING(altRez);
  }

  /**
   * Generate JSON file from a resume object.
   * @param {Object} rez - Resume object
   * @param {string} f - Output file path
   */
  generate(rez, f) {
    FS.writeFileSync(f, this.invoke(rez), 'utf8');
  }
}

module.exports = JsonGenerator;
