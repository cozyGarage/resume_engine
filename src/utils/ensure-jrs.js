const ResumeConverter = require('fresh-jrs-converter');
const detectFormat = require('./resume-detector');

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

module.exports = function ensureJrs(resumeJson) {
  if (!resumeJson || typeof resumeJson !== 'object') {
    return {
      json: resumeJson,
      detectedFormat: 'unk',
      wasConverted: false
    };
  }

  const detectedFormat = detectFormat(resumeJson);

  if (detectedFormat === 'fresh') {
    const converted = ResumeConverter.toJRS(resumeJson);
    return {
      json: ensureMeta(converted, true),
      detectedFormat,
      wasConverted: true
    };
  }

  if (detectedFormat === 'jrs') {
    return {
      json: ensureMeta(resumeJson, false),
      detectedFormat,
      wasConverted: false
    };
  }

  return {
    json: resumeJson,
    detectedFormat,
    wasConverted: false
  };
};
