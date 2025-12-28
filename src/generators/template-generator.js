/**
 * Definition of the TemplateGenerator class.
 * @module generators/template-generator
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const FS = require('fs-extra');
const _ = require('underscore');
const MD = require('marked');
const XML = require('xml-escape');
const PATH = require('path');
const parsePath = require('parse-filepath');
const BaseGenerator = require('./base-generator');
const EXTEND = require('extend');

/** Default template generator options */
const DEFAULT_OPTS = {
  engine: 'underscore',
  keepBreaks: true,
  freezeBreaks: false,
  nSym: '&newl;',
  rSym: '&retn;',
  template: {
    interpolate: /\{\{(.+?)\}\}/g,
    escape: /\{\{=(.+?)\}\}/g,
    evaluate: /\{%(.+?)%\}/g,
    comment: /\{#(.+?)#\}/g
  },
  filters: {
    out: txt => txt,
    raw: txt => txt,
    xml: txt => XML(txt),
    md: txt => MD(txt || ''),
    mdin: txt => MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, ''),
    lower: txt => txt.toLowerCase(),
    link: (name, url) => url ? `<a href="${url}">${name}</a>` : name
  },
  prettify: {
    indent_size: 2,
    unformatted: ['em', 'strong', 'a'],
    max_char: 80
  }
};

/** Regexes for linebreak preservation */
const LINEBREAK_REGEX = {
  regN: /\n/g,
  regR: /\r/g,
  regSymN: new RegExp(DEFAULT_OPTS.nSym, 'g'),
  regSymR: new RegExp(DEFAULT_OPTS.rSym, 'g')
};

/**
 * TemplateGenerator performs resume generation via local Handlebars or Underscore
 * style template expansion and is appropriate for text-based formats like HTML,
 * plain text, and XML versions of Microsoft Word, Excel, and OpenOffice.
 * @class TemplateGenerator
 * @extends BaseGenerator
 */
class TemplateGenerator extends BaseGenerator {
  /**
   * Create a new template generator.
   * @param {string} outputFormat - The output format
   * @param {string} [templateFormat] - The template format (defaults to outputFormat)
   */
  constructor(outputFormat, templateFormat) {
    super(outputFormat);
    this.tplFormat = templateFormat || outputFormat;
  }

  /**
   * Generate a resume using string-based inputs and outputs without touching
   * the filesystem.
   * @param {Object} rez - A FreshResume object
   * @param {Object} opts - Generator options
   * @returns {Object} An object with files array representing generated output
   */
  invoke(rez, opts) {
    this.opts = opts
      ? EXTEND(true, {}, DEFAULT_OPTS, opts)
      : this.opts;

    // Sort such that CSS files are processed before others
    const curFmt = this.opts.themeObj.getFormat(this.format);
    curFmt.files = _.sortBy(curFmt.files, fi => fi.ext !== 'css');

    // Run the transformation
    const results = curFmt.files.map((tplInfo, idx) => {
      let trx;
      if (tplInfo.action === 'transform') {
        trx = this.transform(rez, tplInfo.data, this.format, this.opts, this.opts.themeObj, curFmt);
        if (tplInfo.ext === 'css') {
          curFmt.files[idx].data = trx;
        }
      }

      if (typeof this.opts.onTransform === 'function') {
        this.opts.onTransform(tplInfo);
      }

      return { info: tplInfo, data: trx };
    });

    return { files: results };
  }

  /**
   * Generate a resume using file-based inputs and outputs.
   * @param {Object} rez - A FreshResume object
   * @param {string} f - Full path to the output resume file
   * @param {Object} opts - Generator options
   * @returns {Object} Generation info
   */
  generate(rez, f, opts) {
    this.opts = EXTEND(true, {}, DEFAULT_OPTS, opts);

    // Call the string-based generation method
    const genInfo = this.invoke(rez, null);
    const outFolder = parsePath(f).dirname;
    const curFmt = opts.themeObj.getFormat(this.format);

    // Process individual files within this format
    genInfo.files.forEach(file => {
      file.info.orgPath = file.info.orgPath || '';
      const thisFilePath = file.info.primary
        ? f
        : PATH.join(outFolder, file.info.orgPath);

      if (file.info.action !== 'copy' && this.onBeforeSave) {
        file.data = this.onBeforeSave({
          theme: opts.themeObj,
          outputFile: thisFilePath,
          mk: file.data,
          opts: this.opts,
          ext: file.info.ext
        });
        if (!file.data) {
          return;
        }
      }

      // Write the file
      if (typeof opts.beforeWrite === 'function') {
        opts.beforeWrite({ data: thisFilePath });
      }

      FS.ensureDirSync(PATH.dirname(thisFilePath));

      if (file.info.action !== 'copy') {
        FS.writeFileSync(thisFilePath, file.data, { encoding: 'utf8', flags: 'w' });
      } else {
        FS.copySync(file.info.path, thisFilePath);
      }

      if (typeof opts.afterWrite === 'function') {
        opts.afterWrite({ data: thisFilePath });
      }

      // Post-processing
      if (this.onAfterSave) {
        this.onAfterSave({ outputFile: thisFilePath, mk: file.data, opts: this.opts });
      }
    });

    // Some themes require a symlink structure
    createSymLinks(curFmt, outFolder);

    return genInfo;
  }

  /**
   * Perform a single resume transformation using string-based inputs
   * and outputs without touching the local file system.
   * @param {Object} json - A JSON Resume or FRESH resume object
   * @param {string} jst - The stringified template data
   * @param {string} format - The format name (e.g., "html" or "latex")
   * @param {Object} opts - Options and passthrough data
   * @param {Object} theme - Theme object
   * @param {Object} curFmt - Current format configuration
   * @returns {string} Transformed result
   */
  transform(json, jst, format, opts, theme, curFmt) {
    let template = jst;

    if (this.opts.freezeBreaks) {
      template = freeze(template);
    }

    const eng = require(`../renderers/${theme.engine}-generator`);
    let result = eng.generate(json, template, format, curFmt, opts, theme);

    if (this.opts.freezeBreaks) {
      result = unfreeze(result);
    }

    return result;
  }
}

module.exports = TemplateGenerator;

/**
 * Create symlinks required by some themes.
 * @param {Object} curFmt - Current format configuration
 * @param {string} outFolder - Output folder path
 */
function createSymLinks(curFmt, outFolder) {
  if (!curFmt.symLinks) return;

  Object.keys(curFmt.symLinks).forEach(loc => {
    const absLoc = PATH.join(outFolder, loc);
    const absTarg = PATH.join(PATH.dirname(absLoc), curFmt.symLinks[loc]);
    const type = parsePath(absLoc).extname ? 'file' : 'junction';

    try {
      FS.symlinkSync(absTarg, absLoc, type);
    } catch (err) {
      if (err.code === 'EEXIST') {
        FS.unlinkSync(absLoc);
        FS.symlinkSync(absTarg, absLoc, type);
      } else {
        throw err;
      }
    }
  });
}

/**
 * Freeze newlines for protection against errant JST parsers.
 * @param {string} markup - The markup to freeze
 * @returns {string} Frozen markup
 */
function freeze(markup) {
  return markup
    .replace(LINEBREAK_REGEX.regN, DEFAULT_OPTS.nSym)
    .replace(LINEBREAK_REGEX.regR, DEFAULT_OPTS.rSym);
}

/**
 * Unfreeze newlines when the coast is clear.
 * @param {string} markup - The markup to unfreeze
 * @returns {string} Unfrozen markup
 */
function unfreeze(markup) {
  return markup
    .replace(LINEBREAK_REGEX.regSymR, '\r')
    .replace(LINEBREAK_REGEX.regSymN, '\n');
}

