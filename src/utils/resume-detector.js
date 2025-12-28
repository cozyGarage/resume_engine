/**
 * Resume format detector.
 * @module utils/resume-detector
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

/**
 * Detect the format of a resume object.
 * @param {Object} rez - The resume object to detect
 * @returns {string} 'jrs' for JSON Resume format, 'unk' for unknown
 */
module.exports = function detectResumeFormat(rez) {
  if (!rez || typeof rez !== 'object') {
    return 'unk';
  }

  // Check for explicit JRS meta format
  if (rez.meta?.format) {
    const fmt = String(rez.meta.format).toLowerCase();
    if (fmt === 'jrs' || fmt === 'jsonresume' || fmt === 'json-resume' || fmt.startsWith('jrs@')) {
      return 'jrs';
    }
  }

  // Check for JRS basics property (standard JSON Resume structure)
  if (rez.basics) {
    return 'jrs';
  }

  return 'unk';
};
