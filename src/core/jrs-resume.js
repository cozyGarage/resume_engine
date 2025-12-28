/**
 * Definition of the JRSResume class.
 * @license MIT. See LICENSE.md for details.
 * @module core/jrs-resume
 */

'use strict';

const FS = require('fs');
const extend = require('extend');
const validator = require('is-my-json-valid');
const _ = require('underscore');
const PATH = require('path');

// Optional FRESH converter - may not be available
let CONVERTER = null;
try {
  CONVERTER = require('fresh-jrs-converter');
} catch (e) {
  CONVERTER = null;
}

// Keys to exclude during JSON stringification
const STRINGIFY_EXCLUDE_KEYS = new Set([
  'imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
  'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate', 'result',
  'isModified', 'htmlPreview', 'display_progress_bar'
]);

/**
 * Parse and format dates for a collection of items.
 * @param {Array} items - The items to process
 * @param {Function} fmt - The date formatting function
 * @param {string} startKey - The start date key
 * @param {string} endKey - The end date key (optional)
 * @private
 */
const parseDatesForCollection = (items, fmt, startKey, endKey) => {
  if (!items || !Array.isArray(items)) return;

  items.forEach(item => {
    if (startKey && item[startKey] !== undefined) {
      item[`safe${startKey.charAt(0).toUpperCase()}${startKey.slice(1)}`] = fmt(item[startKey]);
    }
    if (endKey && item[endKey] !== undefined) {
      item[`safe${endKey.charAt(0).toUpperCase()}${endKey.slice(1)}`] = fmt(item[endKey]);
    }
  });
};

/**
 * A JRS resume or CV. JRS resumes are backed by JSON, and each JRSResume object
 * is an instantiation of that JSON decorated with utility methods.
 * @class JRSResume
 */
class JRSResume {
  /**
   * Initialize the JRSResume from a JSON string.
   * @param {string} stringData - The JSON string to parse
   * @param {Object} [opts] - Parsing options
   * @returns {JRSResume} This instance for chaining
   */
  parse(stringData, opts) {
    this.imp = this.imp ?? { raw: stringData };
    return this.parseJSON(JSON.parse(stringData), opts);
  }

  /**
   * Initialize the JRSResume object from a JSON object.
   * @param {Object} rep - The raw JSON representation
   * @param {Object} [opts={}] - Resume loading and parsing options
   * @param {boolean} [opts.date=true] - Perform safe date conversion
   * @param {boolean} [opts.sort=true] - Sort resume items by date
   * @param {boolean} [opts.compute=true] - Prepare computed resume totals
   * @param {boolean} [opts.privatize=false] - Remove private fields
   * @returns {JRSResume} This instance for chaining
   */
  parseJSON(rep, opts = {}) {
    let scrubbed;

    // Handle privatization if requested
    if (opts.privatize) {
      const scrubber = require('../utils/resume-scrubber');
      const ret = scrubber.scrubResume(rep, opts);
      scrubbed = ret.scrubbed;
    }

    // Apply starter defaults, then merge in the resume data
    const starter = require('./jrs-starter').jrs;
    extend(true, this, starter, opts.privatize ? scrubbed : rep);

    // Set up metadata
    if (!this.imp?.processed) {
      if (opts.imp === undefined || opts.imp) {
        this.imp = this.imp ?? {};
        this.imp.title = opts.title || this.imp.title || this.basics?.name;
        if (!this.imp.raw) {
          this.imp.raw = JSON.stringify(rep);
        }
      }
      this.imp.processed = true;
    }

    // Parse dates, sort, and calculate computed values
    if (opts.date !== false) {
      this._parseDates();
    }

    if (opts.sort !== false) {
      this.sort();
    }

    if (opts.compute !== false) {
      this.basics.computed = {
        numYears: this.duration(),
        keywords: this.keywords()
      };
    }

    return this;
  }

  /**
   * Save the sheet to disk.
   * @param {string} [filename] - The filename to save to
   * @returns {JRSResume} This instance for chaining
   */
  save(filename) {
    this.imp.file = filename || this.imp.file;
    FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
    return this;
  }

  /**
   * Save the sheet in a specific format (JRS or FRESH).
   * @param {string} filename - The filename to save to
   * @param {string} format - The format ('JRS' or 'FRESH')
   * @returns {JRSResume} This instance for chaining
   */
  saveAs(filename, format) {
    if (format === 'JRS') {
      this.imp.file = filename || this.imp.file;
      FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
    } else {
      if (!CONVERTER) {
        throw new Error(
          'FRESH conversion has been removed from this build. ' +
          'Please convert your JRS file to FRESH using an external converter.'
        );
      }
      const newRep = CONVERTER.toFRESH(this);
      const stringRep = CONVERTER.toSTRING(newRep);
      FS.writeFileSync(filename, stringRep, 'utf8');
    }
    return this;
  }

  /**
   * Return the resume format.
   * @returns {string} The format identifier
   */
  format() {
    return 'JRS';
  }

  /**
   * Convert the resume to a JSON string.
   * @returns {string} The JSON representation
   */
  stringify() {
    return JRSResume.stringify(this);
  }

  /**
   * Return a unique list of all keywords across all skills.
   * @returns {Array<string>} Array of unique keywords
   */
  keywords() {
    if (!this.skills || !this.skills.length) {
      return [];
    }
    return [...new Set(this.skills.flatMap(s => s.keywords || []))];
  }

  /**
   * Return internal metadata. Creates if it doesn't exist.
   * @returns {Object} The metadata object
   */
  i() {
    this.imp = this.imp ?? {};
    return this.imp;
  }

  /**
   * Add a new item to a resume section.
   * @param {string} moniker - The section name (e.g., 'work', 'education')
   * @returns {Object} The newly added object
   */
  add(moniker) {
    const defSheet = JRSResume.default();
    const newObject = extend(true, {}, defSheet[moniker]?.[0]);
    this[moniker] = this[moniker] || [];
    this[moniker].push(newObject);
    return newObject;
  }

  /**
   * Check if the resume includes a specific social profile.
   * @param {string} socialNetwork - The network name (e.g., 'GitHub')
   * @returns {boolean} True if the profile exists
   */
  hasProfile(socialNetwork) {
    const network = socialNetwork.trim().toLowerCase();
    return this.basics?.profiles?.some(
      p => p.network?.trim().toLowerCase() === network
    ) ?? false;
  }

  /**
   * Check if the resume includes a specific skill.
   * @param {string} skill - The skill to find
   * @returns {boolean} True if the skill exists
   */
  hasSkill(skill) {
    const skillLower = skill.trim().toLowerCase();
    return this.skills?.some(
      sk => sk.keywords?.some(kw => kw.trim().toLowerCase() === skillLower)
    ) ?? false;
  }

  /**
   * Validate the resume against the JSON Resume schema.
   * @returns {boolean} True if valid
   */
  isValid() {
    const schema = FS.readFileSync(
      PATH.join(__dirname, 'resume.json'),
      'utf8'
    );
    const schemaObj = JSON.parse(schema);
    const validate = validator(schemaObj, {
      formats: {
        date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
      }
    });

    // Temporarily remove internal metadata for validation
    const temp = this.imp;
    delete this.imp;
    const ret = validate(this);
    this.imp = temp;

    if (!ret) {
      this.imp = this.imp ?? {};
      this.imp.validationErrors = validate.errors;
    }

    return ret;
  }

  /**
   * Calculate the total duration of work history.
   * @param {string} [unit='years'] - The unit for duration
   * @returns {number} The duration in the specified unit
   */
  duration(unit) {
    const inspector = require('../inspectors/duration-inspector');
    return inspector.run(this, 'work', 'startDate', 'endDate', unit);
  }

  /**
   * Sort dated items by start date descending.
   * @returns {JRSResume} This instance for chaining
   */
  sort() {
    const byDateDesc = (a, b) => {
      if (!a.safeStartDate || !b.safeStartDate) return 0;
      if (a.safeStartDate.isBefore(b.safeStartDate)) return 1;
      if (a.safeStartDate.isAfter(b.safeStartDate)) return -1;
      return 0;
    };

    const byDateDescSimple = (a, b, dateField) => {
      if (!a[dateField] || !b[dateField]) return 0;
      if (a[dateField].isBefore(b[dateField])) return 1;
      if (a[dateField].isAfter(b[dateField])) return -1;
      return 0;
    };

    this.work?.sort(byDateDesc);
    this.education?.sort(byDateDesc);
    this.volunteer?.sort(byDateDesc);
    this.awards?.sort((a, b) => byDateDescSimple(a, b, 'safeDate'));
    this.publications?.sort((a, b) => byDateDescSimple(a, b, 'safeReleaseDate'));

    return this;
  }

  /**
   * Create a deep copy of this resume.
   * @returns {JRSResume} A new JRSResume instance
   */
  dupe() {
    const rnew = new JRSResume();
    rnew.parse(this.stringify(), {});
    return rnew;
  }

  /**
   * Create a hardened copy with all fields escaped.
   * @returns {JRSResume} A hardened copy
   */
  harden() {
    const ret = this.dupe();
    const HD = txt => `@@@@~${txt}~@@@@`;
    const transformer = require('../utils/string-transformer');

    return transformer(
      ret,
      [
        'skills', 'url', 'website', 'startDate', 'endDate', 'releaseDate', 'date',
        'phone', 'email', 'address', 'postalCode', 'city', 'country', 'region',
        'safeStartDate', 'safeEndDate'
      ],
      (key, val) => HD(val)
    );
  }

  /**
   * Parse and format all dates in the resume.
   * @private
   */
  _parseDates() {
    const { fmt } = require('./fluent-date');

    // Parse dates for each collection
    parseDatesForCollection(this.work, fmt, 'startDate', 'endDate');
    parseDatesForCollection(this.education, fmt, 'startDate', 'endDate');
    parseDatesForCollection(this.volunteer, fmt, 'startDate', 'endDate');

    // Awards use 'date' field
    if (this.awards) {
      this.awards.forEach(awd => {
        awd.safeDate = fmt(awd.date);
      });
    }

    // Publications use 'releaseDate' field
    if (this.publications) {
      this.publications.forEach(pub => {
        pub.safeReleaseDate = fmt(pub.releaseDate);
      });
    }
  }

  /**
   * Get the default (empty) resume.
   * @returns {JRSResume} A new default resume
   */
  static default() {
    return new JRSResume().parseJSON(require('./jrs-starter').jrs);
  }

  /**
   * Convert a resume object to a JSON string.
   * @param {Object} obj - The object to stringify
   * @returns {string} The JSON string
   */
  static stringify(obj) {
    const replacer = (key, value) => {
      return STRINGIFY_EXCLUDE_KEYS.has(key.trim()) ? undefined : value;
    };
    return JSON.stringify(obj, replacer, 2);
  }
}

module.exports = JRSResume;
