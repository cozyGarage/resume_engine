/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'build' verb for HackMyResume.
@module verbs/build
@license MIT. See LICENSE.md for details.
*/



const _              = require('underscore');
const FS             = require('fs');
const PATH           = require('path');
// Use native fs methods for directory creation (recursive) instead of mkdirp
const extend         = require('extend');
const parsePath      = require('parse-filepath');
const pathExists     = require('path-exists').sync;
const HMSTATUS       = require('../core/status-codes');
const HMEVENT        = require('../core/event-codes');
const _opts          = require('../core/default-options');
const JRSTheme       = require('../core/jrs-theme');
const JRSResume      = require('../core/jrs-resume');
const ResumeFactory  = require('../core/resume-factory');
const _fmts          = require('../core/default-formats');
const Verb           = require('../verbs/verb');

const THEME_ALIASES = {
  modern: 'jsonresume-theme-modern',
  classy: 'jsonresume-theme-classy',
  sceptile: 'jsonresume-theme-sceptile',
  boilerplate: 'jsonresume-theme-boilerplate'
};

//const _err = null;
//const _log = null;
let _rezObj = null;
//const build = null;
//const prep = null;
//const single = null;
//const verifyOutputs = null;
//const addFreebieFormats = null;
//const expand = null;
//const verifyTheme = null;
//const loadTheme = null;

/** An invokable resume generation command. */
class BuildVerb extends Verb {

  /** Create a new build verb. */
  constructor() { super('build', _build); }
}


module.exports = BuildVerb;



/**
Given a source resume (legacy FRESH sources are converted automatically), a destination resume path, and a
theme file, generate 0..N resumes in the desired formats.
@param src Path to the source JSON resume file: "rez/resume.json".
@param dst An array of paths to the target resume file(s).
@param opts Generation options.
*/
/**
 * Build verb implementation.
 * @param {Array<string>} src Source resume paths to load and merge.
 * @param {Array<string>} dst Target output paths to generate.
 * @param {Object} opts Options for generation.
 */
const _build = function(src, dst, opts) {

  let err;
  if (!src || !src.length) {
    this.err(HMSTATUS.resumeNotFound, {quit: true});
    return null;
  }

  _prep.call(this, src, dst, opts);

  // Load input resumes as JSON...
  const sheetObjects = ResumeFactory.load(src, {
    format: 'JRS', objectify: false, quit: true, inner: {
      sort: _opts.sort,
      private: _opts.private
    }
  }
  , this);

  // Explicit check for any resume loading errors...
  const problemSheets = _.filter(sheetObjects, so => so.fluenterror);
  if (problemSheets && problemSheets.length) {
    problemSheets[0].quit = true; // can't go on
    this.err(problemSheets[0].fluenterror, problemSheets[0]);
    return null;
  }

  // Get the collection of raw JSON sheets
  const sheets = sheetObjects.map(r => r.json);

  // Load the theme...
  let theme = null;
  this.stat(HMEVENT.beforeTheme, { theme: _opts.theme });
  try {
    const tFolder = _verifyTheme.call(this, _opts.theme);
    if (tFolder.fluenterror) {
      tFolder.quit = true;
      this.err(tFolder.fluenterror, tFolder);
      return;
    }
    theme = (_opts.themeObj = _loadTheme(tFolder));
    _addFreebieFormats(theme);
  } catch (error) {
    err = error;
    const newEx = {
      fluenterror: HMSTATUS.themeLoad,
      inner: err,
      attempted: _opts.theme,
      quit: true
    };
    this.err(HMSTATUS.themeLoad, newEx);
    return null;
  }

  this.stat(HMEVENT.afterTheme, {theme});

  // Check for invalid outputs...
  const inv = _verifyOutputs.call(this, dst, theme);
  if (inv && inv.length) {
    this.err(HMSTATUS.invalidFormat, {data: inv, theme, quit: true});
    return null;
  }

  //# Merge input resumes, yielding a single source resume...
  let rez = null;
  if (sheets.length > 1) {
    this.stat(HMEVENT.beforeMerge, { f: _.clone(sheetObjects), mixed: false });
    rez = _.reduceRight(sheets, ( a, b ) => extend( true, b, a ));
    this.stat(HMEVENT.afterMerge, { r: rez });
  } else {
    rez = sheets[0];
  }

  // Announce the theme
  this.stat(HMEVENT.applyTheme, {r: rez, theme});

  // Load the resume into a JRSResume object
  _rezObj = new JRSResume().parseJSON( rez, {private: _opts.private} );

  // Expand output resumes...
  const targets = _expand(dst, theme);

  // Run the transformation!
  _.each(targets, function(t) {
    if (this.hasError() && opts.assert) { return { }; }
    t.final = _single.call(this, t, theme, targets);
    if (t.final != null ? t.final.fluenterror : undefined) {
      t.final.quit = opts.assert;
      this.err(t.final.fluenterror, t.final);
    }
  }
  , this);

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
};



/**
Prepare for a BUILD run.
*/
/**
 * Prepare the build options and callbacks.
 */
const _prep = function(src, dst, opts) {
  // Cherry-pick options //_opts = extend( true, _opts, opts );
  _opts.theme = (opts.theme && opts.theme.trim()) || 'jsonresume-theme-modern';
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
  const that = this;

  // Set up callbacks for internal generators
  _opts.onTransform = function(info) {
    that.stat(HMEVENT.afterTransform, info);
  };
  _opts.beforeWrite = function(info) {
    that.stat(HMEVENT.beforeWrite, info);
  };
  _opts.afterWrite = function(info) {
    that.stat(HMEVENT.afterWrite, info);
  };


  // If two or more files are passed to the GENERATE command and the TO
  // keyword is omitted, the last file specifies the output file.
  ( (src.length > 1) && ( !dst || !dst.length ) ) && dst.push( src.pop() );
};



/**
Generate a single target resume such as "out/rez.html" or "out/rez.doc".
TODO: Refactor.
@param targInfo Information for the target resume.
@param theme A JRSTheme object.
*/
/**
 * Generate a single target resume using the provided theme.
 */
const _single = function(targInfo, theme, finished) {

  let ret = null;
  let ex = null;
  const f = targInfo.file;

  try {

    if (!targInfo.fmt) {
      return { };
    }
    let theFormat = null;

    this.stat(HMEVENT.beforeGenerate, {
      fmt: targInfo.fmt.outFormat,
      file: PATH.relative(process.cwd(), f)
    }
    );

    _opts.targets = finished;

  // If targInfo.fmt.files exists, this format is backed by a document.
    if (targInfo.fmt.files && targInfo.fmt.files.length) {
      theFormat = _fmts.filter( fmt => fmt.name === targInfo.fmt.outFormat)[0];
  FS.mkdirSync(PATH.dirname( f ), { recursive: true });
      ret = theFormat.gen.generate(_rezObj, f, _opts);

    // Otherwise this is an ad-hoc format (JSON, YML, or PNG) that every theme
    // gets "for free".
    } else {
      theFormat = _fmts.filter( fmt => fmt.name === targInfo.fmt.outFormat)[0];
  const outFolder = PATH.dirname(f);
  FS.mkdirSync(outFolder, { recursive: true }); // Ensure dest folder exists;
      ret = theFormat.gen.generate(_rezObj, f, _opts);
    }

  } catch (e) {
    ex = e;
  }

  this.stat(HMEVENT.afterGenerate, {
    fmt: targInfo.fmt.outFormat,
    file: PATH.relative(process.cwd(), f),
    error: ex
  }
  );

  if (ex) {
    if (ex.fluenterror) {
      ret = ex;
    } else {
      ret = {fluenterror: HMSTATUS.generateError, inner: ex};
    }
  }
  return ret;
};



/** Ensure that user-specified outputs/targets are valid. */
/**
 * Verify that requested outputs are supported by the theme.
 */
const _verifyOutputs = function(targets, theme) {
  this.stat(HMEVENT.verifyOutputs, {targets, theme});
  const invalids = targets.map( t => {
    const pathInfo = parsePath(t);
    return { format: pathInfo.extname.substr(1) };
  }).filter(t => !(t.format === 'all' || theme.hasFormat(t.format)));
  return invalids;
};



/**
Reinforce the chosen theme with "freebie" formats provided by HackMyResume.
A "freebie" format is an output format such as JSON, YML, or PNG that can be
generated directly from the resume model or from one of the theme's declared
output formats. For example, the PNG format can be generated for any theme
that declares an HTML format; the theme doesn't have to provide an explicit
PNG template.
@param theTheme A JRSTheme object.
*/
/**
 * Add non-template 'freebie' formats (json, yml, png) to theme.
 */
const _addFreebieFormats = function(theTheme) {
  // Add freebie formats (JSON, YAML, PNG) every theme gets...
  // Add HTML-driven PNG only if the theme has an HTML format.
  theTheme.formats.json = theTheme.formats.json || {
    freebie: true, title: 'json', outFormat: 'json', pre: 'json',
    ext: 'json', path: null, data: null
  };
  theTheme.formats.yml = theTheme.formats.yml || {
    freebie: true, title: 'yaml', outFormat: 'yml', pre: 'yml',
    ext: 'yml', path: null, data: null
  };
  if (theTheme.formats.html && !theTheme.formats.png) {
    theTheme.formats.png = {
      freebie: true, title: 'png', outFormat: 'png',
      ext: 'yml', path: null, data: null
    };
  }
};



/**
Expand output files. For example, "foo.all" should be expanded to
["foo.html", "foo.doc", "foo.pdf", "etc"].
@param dst An array of output files as specified by the user.
@param theTheme A JRSTheme object.
*/
/**
 * Expand destination shorthand (.all) into per-format target list.
 */
const _expand = function(dst, theTheme) {

  // Set up the destination collection. It's either the array of files passed
  // by the user or 'out/resume.all' if no targets were specified.
  const destColl = (dst && dst.length && dst) || [PATH.normalize('out/resume.all')];

  // Assemble an array of expanded target files... (can't use map() here)
  const targets = [];
  destColl.forEach(function(t) {
    const to = PATH.resolve(t);
    const pa = parsePath(to);
    const fmat = pa.extname || '.all';
    return targets.push.apply( targets,
      fmat === '.all'
      ? Object.keys( theTheme.formats ).map( function( k ) {
        const z = theTheme.formats[k];
        return { file: to.replace( /all$/g, z.outFormat ), fmt: z };
      })
      : [{ file: to, fmt: theTheme.getFormat( fmat.slice(1) ) }]
    );
  });
  return targets;
};



/**
Verify the specified theme name/path.
*/
/**
 * Attempt to resolve candidate theme names/paths and return a resolved path.
 */
const _verifyTheme = function(themeNameOrPath) {
  const cleanedInput = (themeNameOrPath || '').trim();
  const candidates = _expandThemeCandidates(cleanedInput);

  for (const candidate of candidates) {
    const resolved = _tryResolveTheme(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return {fluenterror: HMSTATUS.themeNotFound, data: cleanedInput};
};

const _expandThemeCandidates = function(name) {
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

  return _.uniq(candidates.filter(Boolean));
};

const _tryResolveTheme = function(candidate) {
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
  } catch (err) {
    return null;
  }
};



/**
Load the specified JSON Resume theme.
*/
const _loadTheme = function(tFolder) {
  const theTheme = new JRSTheme().open(tFolder);
  _opts.themeObj = theTheme;
  return theTheme;
};
