/**
 * Definition of the BaseGenerator class.
 * @module generators/base-generator
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const codes = require('../core/status-codes');

/**
 * The BaseGenerator class is the root of the generator hierarchy.
 * Functionality common to ALL generators lives here.
 * @class BaseGenerator
 */
class BaseGenerator {
  /**
   * Create a new base generator.
   * @param {string} format - The output format
   */
  constructor(format) {
    this.format = format;
    /** Status codes */
    this.codes = codes;
    /** Generator options */
    this.opts = {};
  }
}

module.exports = BaseGenerator;
