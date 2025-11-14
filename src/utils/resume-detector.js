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

module.exports = function detectResumeFormat(rez) {
  if (!rez || typeof rez !== 'object') {
    return 'unk';
  }

  if (rez.meta && rez.meta.format) {
    const fmt = String(rez.meta.format).toLowerCase();
    if (fmt.startsWith('fresh')) {
      return 'fresh';
    }
    if (
      fmt === 'jrs' ||
      fmt === 'jsonresume' ||
      fmt === 'json-resume' ||
      fmt.startsWith('jrs@')
    ) {
      return 'jrs';
    }
    return fmt;
  }

  if (rez.basics) {
    return 'jrs';
  }

  if (rez.info || rez.employment || rez.service || rez.projects) {
    return 'fresh';
  }

  return 'unk';
};
