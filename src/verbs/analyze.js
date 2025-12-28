/**
 * Implementation of the 'analyze' verb for HackMyResume.
 * @module verbs/analyze
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const HMEVENT = require('../core/event-codes');
const HMSTATUS = require('../core/status-codes');
const ResumeFactory = require('../core/resume-factory');
const Verb = require('../verbs/verb');

/**
 * Load available inspector modules.
 * @returns {Object} Object containing inspector modules
 */
const loadInspectors = () => ({
  totals: require('../inspectors/totals-inspector'),
  coverage: require('../inspectors/gap-inspector'),
  keywords: require('../inspectors/keyword-inspector')
});

/**
 * An invokable resume analysis command.
 * Analyzes one or more resumes for coverage, gaps, totals, and keywords.
 * @class AnalyzeVerb
 * @extends Verb
 */
class AnalyzeVerb extends Verb {
  /**
   * Create a new analyze verb.
   */
  constructor() {
    super('analyze', analyze);
  }
}

module.exports = AnalyzeVerb;

/**
 * Analyze verb implementation.
 * Loads resumes and runs configured inspectors.
 * @param {Array<string>} sources - Source resume paths
 * @param {Array<string>} dst - Destination paths (unused)
 * @param {Object} opts - Analysis options
 * @returns {Array|null} Array of analysis results or null on error
 */
function analyze(sources, dst, opts) {
  if (!sources?.length) {
    this.err(HMSTATUS.resumeNotFound, { quit: true });
    return null;
  }

  const nlzrs = loadInspectors();

  const results = sources.map(src => {
    const r = ResumeFactory.loadOne(src, {
      format: 'JRS',
      objectify: true,
      inner: { private: opts.private === true }
    }, this);

    if (opts.assert && this.hasError()) {
      return {};
    }

    if (r.fluenterror) {
      r.quit = opts.assert;
      this.err(r.fluenterror, r);
      return r;
    }

    return analyzeOne.call(this, r, nlzrs, opts);
  });

  if (this.hasError() && !opts.assert) {
    this.reject(this.errorCode);
  } else if (!this.hasError()) {
    this.resolve(results);
  }

  return results;
}

/**
 * Run analysis on a single resume object using the provided inspectors.
 * @param {Object} resumeObject - The loaded resume object
 * @param {Object} nlzrs - Object containing inspector modules
 * @param {Object} opts - Analysis options
 * @returns {Object} Analysis results from all inspectors
 */
function analyzeOne(resumeObject, nlzrs, opts) {
  const { rez } = resumeObject;

  const safeFormat = rez.meta?.format?.startsWith('FRESH') ? 'FRESH' : 'JRS';

  this.stat(HMEVENT.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file });

  const info = Object.fromEntries(
    Object.entries(nlzrs).map(([k, v]) => [k, v.run(rez)])
  );

  this.stat(HMEVENT.afterAnalyze, { info });

  return info;
}
