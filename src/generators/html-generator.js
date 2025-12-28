/**
 * Definition of the HTMLGenerator class.
 * @module generators/html-generator
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const TemplateGenerator = require('./template-generator');
const HTML = require('html');
require('string.prototype.endswith');

/**
 * HTMLGenerator - Generates HTML output from resume data.
 * @class HtmlGenerator
 * @extends TemplateGenerator
 */
class HtmlGenerator extends TemplateGenerator {
  /**
   * Create a new HTML generator.
   */
  constructor() {
    super('html');
  }

  /**
   * Copy satellite CSS files to the destination and optionally pretty-print
   * the HTML resume prior to saving.
   * @param {Object} info - File info object
   * @param {string} info.outputFile - Output file path
   * @param {string} info.mk - Markup content
   * @returns {string} Processed markup
   */
  onBeforeSave(info) {
    if (info.outputFile.endsWith('.css')) {
      return info.mk;
    }

    return this.opts.prettify
      ? HTML.prettyPrint(info.mk, this.opts.prettify)
      : info.mk;
  }
}

module.exports = HtmlGenerator;
