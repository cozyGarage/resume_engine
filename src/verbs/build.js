/**
 * Implementation of the 'build' verb for HackMyResume.
 * @module verbs/build
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const _ = require('underscore');
const FS = require('fs');
const PATH = require('path');
const extend = require('extend');
const parsePath = require('parse-filepath');
const pathExists = require('path-exists').sync;
const HMSTATUS = require('../core/status-codes');
const HMEVENT = require('../core/event-codes');
const _opts = require('../core/default-options');
const JRSTheme = require('../core/jrs-theme');
const JRSResume = require('../core/jrs-resume');
const ResumeFactory = require('../core/resume-factory');
const _fmts = require('../core/default-formats');
const Verb = require('../verbs/verb');

// Theme aliases for convenience
const THEME_ALIASES = {
  modern: 'jsonresume-theme-modern',
  classy: 'jsonresume-theme-classy',
  sceptile: 'jsonresume-theme-sceptile',
  boilerplate: 'jsonresume-theme-boilerplate'
};

// Module-level resume object reference
let _rezObj = null;

/**
 * An invokable resume generation command.
 * @class BuildVerb
 * @extends Verb
 */
class BuildVerb extends Verb {
  /**
   * Create a new build verb.
   */
  constructor() {
    super('build', build);
  }
}

module.exports = BuildVerb;

/**
 * Build verb implementation.
 * Given a source resume, destination paths, and theme, generate resumes in desired formats.
 * @param {Array<string>} src - Source resume paths to load and merge
 * @param {Array<string>} dst - Target output paths to generate
 * @param {Object} opts - Options for generation
 * @returns {Object|null} Results object with sheet, targets, and processed info
 */
function build(src, dst, opts) {
  if (!src?.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  prep.call(this, src, dst, opts);

  // Load input resumes as JSON
  const sheetObjects = ResumeFactory.load(src, {
    format: 'JRS',
    objectify: false,
    quit: true,
    inner: {
      sort: _opts.sort,
      private: _opts.private
    }
  }, this);

  // Check for resume loading errors
  const problemSheets = sheetObjects.filter(so => so.fluenterror);
  if (problemSheets.length) {
    problemSheets[0].quit = true;
    this.err(problemSheets[0].fluenterror, problemSheets[0]);
    return null;
  }

  // Get the collection of raw JSON sheets
  const sheets = sheetObjects.map(r => r.json);

  // Load the theme
  let theme = null;
  this.stat(HMEVENT.beforeTheme, { theme: _opts.theme });

  try {
    const tFolder = verifyTheme.call(this, _opts.theme);
    if (tFolder.fluenterror) {
      tFolder.quit = true;
      this.err(tFolder.fluenterror, tFolder);
      return null;
    }
    theme = _opts.themeObj = loadTheme(tFolder);
    addFreebieFormats(theme);
  } catch (err) {
    const newEx = {
      fluenterror: HMSTATUS.themeLoad,
      inner: err,
      attempted: _opts.theme,
      quit: true
    };
    this.err(HMSTATUS.themeLoad, newEx);
    return null;
  }

  this.stat(HMEVENT.afterTheme, { theme });

  // Check for invalid outputs
  const inv = verifyOutputs.call(this, dst, theme);
  if (inv?.length) {
    this.err(HMSTATUS.invalidFormat, { data: inv, theme, quit: true });
    return null;
  }

  // Merge input resumes if multiple, yielding a single source resume
  let rez;
  if (sheets.length > 1) {
    this.stat(HMEVENT.beforeMerge, { f: _.clone(sheetObjects), mixed: false });
    rez = _.reduceRight(sheets, (a, b) => extend(true, b, a));
    this.stat(HMEVENT.afterMerge, { r: rez });
  } else {
    [rez] = sheets;
  }

  // Announce the theme
  this.stat(HMEVENT.applyTheme, { r: rez, theme });

  // Load the resume into a JRSResume object
  _rezObj = new JRSResume().parseJSON(rez, { private: _opts.private });

  // Expand output resumes
  const targets = expand(dst, theme);

  // Run the transformation
  targets.forEach(t => {
    if (this.hasError() && opts.assert) {
      return {};
    }
    t.final = single.call(this, t, theme, targets);
    if (t.final?.fluenterror) {
      t.final.quit = opts.assert;
      this.err(t.final.fluenterror, t.final);
    }
  });

  const results = {
    sheet: _rezObj,
    targets,
    processed: targets
  };

  if (this.hasError() && !opts.assert) {
    this.reject(results);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
}

/**
 * Prepare the build options and callbacks.
 * @param {Array<string>} src - Source paths
 * @param {Array<string>} dst - Destination paths
 * @param {Object} opts - User options
 */
function prep(src, dst, opts) {
  // Cherry-pick options
  _opts.theme = opts.theme?.trim() || 'jsonresume-theme-modern';
  _opts.prettify = opts.prettify === true;
  _opts.private = opts.private === true;
  _opts.noescape = opts.noescape === true;
  _opts.css = opts.css;
  _opts.pdf = opts.pdf;
  _opts.wrap = opts.wrap || 60;
  _opts.stitles = opts.sectionTitles;
  _opts.tips = opts.tips;
  _opts.errHandler = opts.errHandler;
  _opts.noTips = opts.noTips;
  _opts.debug = opts.debug;
  _opts.sort = opts.sort;
  _opts.wkhtmltopdf = opts.wkhtmltopdf;

  // Set up callbacks for internal generators
  _opts.onTransform = info => this.stat(HMEVENT.afterTransform, info);
  _opts.beforeWrite = info => this.stat(HMEVENT.beforeWrite, info);
  _opts.afterWrite = info => this.stat(HMEVENT.afterWrite, info);

  // If two or more files are passed and TO keyword is omitted,
  // the last file specifies the output file
  if (src.length > 1 && (!dst || !dst.length)) {
    dst.push(src.pop());
  }
}

/**
 * Generate a single target resume using the provided theme.
 * @param {Object} targInfo - Information for the target resume
 * @param {Object} theme - A JRSTheme object
 * @param {Array} finished - All targets being processed
 * @returns {Object|null} Result of generation
 */
function single(targInfo, theme, finished) {
  let ret = null;
  let ex = null;
  const f = targInfo.file;

  try {
    if (!targInfo.fmt) {
      return {};
    }

    this.stat(HMEVENT.beforeGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative(process.cwd(), f)
    });

    _opts.targets = finished;

    // Find the matching format generator
    const theFormat = _fmts.find(fmt => fmt.name === targInfo.fmt.outFormat);
    
    // Ensure destination directory exists
    FS.mkdirSync(PATH.dirname(f), { recursive: true });
    
    // Generate the output
    ret = theFormat.gen.generate(_rezObj, f, _opts);

  } catch (e) {
    ex = e;
  }

  this.stat(HMEVENT.afterGenerate, {
    fmt: targInfo.fmt.outFormat,
    file: PATH.relative(process.cwd(), f),
    error: ex
  });

  if (ex) {
    ret = ex.fluenterror ? ex : { fluenterror: HMSTATUS.generateError, inner: ex };
  }

  return ret;
}

/**
 * Verify that requested outputs are supported by the theme.
 * @param {Array<string>} targets - Output target paths
 * @param {Object} theme - Theme object
 * @returns {Array} Array of invalid format objects
 */
function verifyOutputs(targets, theme) {
  this.stat(HMEVENT.verifyOutputs, { targets, theme });

  return targets
    .map(t => {
      const pathInfo = parsePath(t);
      return { format: pathInfo.extname.substr(1) };
    })
    .filter(t => !(t.format === 'all' || theme.hasFormat(t.format)));
}

/**
 * Add non-template 'freebie' formats (json, yml, png) to theme.
 * These formats can be generated without explicit theme templates.
 * @param {Object} theTheme - A JRSTheme object
 */
function addFreebieFormats(theTheme) {
  theTheme.formats.json = theTheme.formats.json ?? {
    freebie: true,
    title: 'json',
    outFormat: 'json',
    pre: 'json',
    ext: 'json',
    path: null,
    data: null
  };

  theTheme.formats.yml = theTheme.formats.yml ?? {
    freebie: true,
    title: 'yaml',
    outFormat: 'yml',
    pre: 'yml',
    ext: 'yml',
    path: null,
    data: null
  };

  // Add HTML-driven PNG only if the theme has an HTML format
  if (theTheme.formats.html && !theTheme.formats.png) {
    theTheme.formats.png = {
      freebie: true,
      title: 'png',
      outFormat: 'png',
      ext: 'yml',
      path: null,
      data: null
    };
  }
}

/**
 * Expand destination shorthand (.all) into per-format target list.
 * @param {Array<string>} dst - Destination file paths
 * @param {Object} theTheme - A JRSTheme object
 * @returns {Array} Expanded array of target objects
 */
function expand(dst, theTheme) {
  // Default to 'out/resume.all' if no targets specified
  const destColl = dst?.length ? dst : [PATH.normalize('out/resume.all')];

  const targets = [];
  destColl.forEach(t => {
    const to = PATH.resolve(t);
    const pa = parsePath(to);
    const fmat = pa.extname || '.all';

    if (fmat === '.all') {
      // Expand .all to all theme formats
      const expanded = Object.keys(theTheme.formats).map(k => {
        const z = theTheme.formats[k];
        return { file: to.replace(/all$/g, z.outFormat), fmt: z };
      });
      targets.push(...expanded);
    } else {
      targets.push({ file: to, fmt: theTheme.getFormat(fmat.slice(1)) });
    }
  });

  return targets;
}

/**
 * Verify and resolve the specified theme name/path.
 * @param {string} themeNameOrPath - Theme name or path
 * @returns {string|Object} Resolved path or error object
 */
function verifyTheme(themeNameOrPath) {
  const cleanedInput = (themeNameOrPath || '').trim();
  const candidates = expandThemeCandidates(cleanedInput);

  for (const candidate of candidates) {
    const resolved = tryResolveTheme(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return { fluenterror: HMSTATUS.themeNotFound, data: cleanedInput };
}

/**
 * Expand a theme name into candidate paths to check.
 * @param {string} name - Theme name
 * @returns {Array<string>} Array of candidate paths
 */
function expandThemeCandidates(name) {
  const trimmed = (name || '').trim();
  const lower = trimmed.toLowerCase();
  const candidates = [];

  const normalized = lower.startsWith('npm:') ? trimmed.slice(4) : trimmed;
  if (normalized) {
    candidates.push(normalized);
  }

  if (THEME_ALIASES[lower]) {
    candidates.push(THEME_ALIASES[lower]);
  }

  const isBareName = /^[a-z0-9_-]+$/.test(lower);
  if (isBareName && !lower.startsWith('jsonresume-theme-')) {
    candidates.push(`jsonresume-theme-${lower}`);
  }

  return [...new Set(candidates.filter(Boolean))];
}

/**
 * Try to resolve a theme candidate to an actual path.
 * @param {string} candidate - Theme candidate
 * @returns {string|null} Resolved path or null
 */
function tryResolveTheme(candidate) {
  if (!candidate) {
    return null;
  }

  const candidatePath = PATH.resolve(candidate);
  if (pathExists(candidatePath) && pathExists(PATH.join(candidatePath, 'package.json'))) {
    return candidatePath;
  }

  try {
    const pkgPath = require.resolve(PATH.join(candidate, 'package.json'));
    return PATH.dirname(pkgPath);
  } catch {
    return null;
  }
}

/**
 * Load the specified JSON Resume theme.
 * @param {string} tFolder - Theme folder path
 * @returns {Object} Loaded JRSTheme object
 */
function loadTheme(tFolder) {
  const theTheme = new JRSTheme().open(tFolder);
  _opts.themeObj = theTheme;
  return theTheme;
}
