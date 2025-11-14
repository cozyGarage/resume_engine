/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the ResumeDetector class.
@module utils/resume-detector
@license MIT. See LICENSE.md for details.
*/

module.exports = function( rez ) {
  // If the resume has a meta.format field, honor it when possible
  if (rez && rez.meta && rez.meta.format) {
    const fmt = String(rez.meta.format).toLowerCase();
    if (fmt === 'jrs' || fmt === 'jsonresume' || fmt === 'json-resume') {
      return 'jrs';
    }
    // Unknown meta.format: return as-is so callers can decide
    return fmt;
  }

  // JSON Resume (JRS) typically has a 'basics' top-level section
  if (rez && rez.basics) {
    return 'jrs';
  }

  // Fallback: unknown
  return 'unk';
};
