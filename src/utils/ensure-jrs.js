/**
 * Ensure a resume is in JRS format.
 * @module utils/ensure-jrs
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const detectFormat = require('./resume-detector');

/**
 * Ensure meta.format is set on the resume.
 * @param {Object} resumeJson - The resume object
 * @param {boolean} force - Force setting meta even if not present
 * @returns {Object} The resume with meta.format set
 */
function ensureMeta(resumeJson, force) {
  if (!resumeJson.meta && !force) {
    return resumeJson;
  }
  resumeJson.meta = resumeJson.meta || {};
  if (!resumeJson.meta.format || !String(resumeJson.meta.format).trim()) {
    resumeJson.meta.format = 'JRS@1.0';
  }
  return resumeJson;
}

/**
 * Ensure a resume is in JRS format.
 * @param {Object} resumeJson - The resume to validate/convert
 * @returns {Object} Object with json, detectedFormat, and wasConverted properties
 */
module.exports = function ensureJrs(resumeJson) {
  if (!resumeJson || typeof resumeJson !== 'object') {
    return {
      json: resumeJson,
      detectedFormat: 'unk',
      wasConverted: false
    };
  }

  const detectedFormat = detectFormat(resumeJson);

  // Treat an empty object as a JRS resume and provide default starter fields
  if (detectedFormat === 'unk' && Object.keys(resumeJson).length === 0) {
    const starter = require('../core/jrs-starter').jrs;
    return {
      json: ensureMeta(starter, true),
      detectedFormat: 'jrs',
      wasConverted: false
    };
  }

  if (detectedFormat === 'jrs') {
    return {
      json: ensureMeta(resumeJson, false),
      detectedFormat,
      wasConverted: false
    };
  }

  // Unknown format - return as-is
  return {
    json: resumeJson,
    detectedFormat,
    wasConverted: false
  };
};
