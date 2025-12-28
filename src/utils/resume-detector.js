/**
 * Definition of the ResumeDetector class.
 * @module utils/resume-detector
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

/**
 * Detect if the given object is a valid JSON Resume (JRS) format.
 * @param {Object} rez - The resume object to check
 * @returns {string} 'jrs' if valid JSON Resume, 'unk' otherwise
 */
module.exports = function detectResumeFormat(rez) {
  if (!rez || typeof rez !== 'object') {
    return 'unk';
  }

  // Check for explicit format in meta
  if (rez.meta?.format) {
    const fmt = String(rez.meta.format).toLowerCase();
    if (
      fmt === 'jrs' ||
      fmt === 'jsonresume' ||
      fmt === 'json-resume' ||
      fmt.startsWith('jrs@')
    ) {
      return 'jrs';
    }
  }

  // Check for JRS structure (basics is the key indicator)
  if (rez.basics) {
    return 'jrs';
  }

  return 'unk';
};
