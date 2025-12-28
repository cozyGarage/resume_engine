/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Implementation of the 'analyze' verb for HackMyResume.
@module verbs/analyze
@license MIT. See LICENSE.md for details.
*/



const HMEVENT       = require('../core/event-codes');
const HMSTATUS      = require('../core/status-codes');
// underscore not required anymore; use native array/object methods.
const ResumeFactory = require('../core/resume-factory');
const Verb          = require('../verbs/verb');



/** An invokable resume analysis command. */
/**
 * AnalyzeVerb — Analyze one or more resumes for coverage, gaps, totals, and
 * keywords. Uses inspector modules to compute results.
 */
class AnalyzeVerb extends Verb {
  constructor() { super('analyze', _analyze); }
}

module.exports = AnalyzeVerb;



/**
 * Private workhorse for the 'analyze' command. Loads resumes and runs
 * configured inspectors.
 */
const _analyze = function(sources, dst, opts) {

  if (!sources || !sources.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  const nlzrs = _loadInspectors();
  const results = sources.map(src => {
  const r = ResumeFactory.loadOne(src, { format: 'JRS', objectify: true, inner: {
      private: opts.private === true
    }
  }, this);
    if (opts.assert && this.hasError()) { return { }; }

    if (r.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
      return r;
    } else {
      return _analyzeOne.call(this, r, nlzrs, opts);
    }
  }
  );


  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }
  return results;
};



/** Analyze a single resume. */
/**
 * Run analysis on a single resume object using the provided inspectors.
 */
const _analyzeOne = function(resumeObject, nlzrs) {
  const { rez } = resumeObject;
  const safeFormat =
    rez.meta && rez.meta.format && rez.meta.format.startsWith('FRESH')
    ? 'FRESH' : 'JRS';

  this.stat( HMEVENT.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file });
  const info = Object.fromEntries(Object.entries(nlzrs).map(([k, v]) => [k, v.run(rez)]));
  this.stat(HMEVENT.afterAnalyze, { info });
  return info;
};



const _loadInspectors = () =>
  ({
    totals: require('../inspectors/totals-inspector'),
    coverage: require('../inspectors/gap-inspector'),
    keywords: require('../inspectors/keyword-inspector')
  })
;
