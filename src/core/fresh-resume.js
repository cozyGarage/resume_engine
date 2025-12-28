/**
 * Definition of the FRESHResume class.
 * @license MIT. See LICENSE.md for details.
 * @module core/fresh-resume
 */

'use strict';

const FS = require('fs');
const extend = require('extend');
const validator = require('is-my-json-valid');
const _ = require('underscore');
const __ = require('lodash');
const XML = require('xml-escape');
const MD = require('marked');
const CONVERTER = require('fresh-jrs-converter');
const JRSResume = require('./jrs-resume');

// Keys to exclude during JSON stringification
const STRINGIFY_EXCLUDE_KEYS = new Set([
  'imp', 'warnings', 'computed', 'filt', 'ctrl', 'index',
  'safe', 'result', 'isModified', 'htmlPreview', 'display_progress_bar'
]);

/**
 * Parse and format dates recursively in an object.
 * We preserve the raw textual date as entered by the user and store
 * the Moment.js date as a separate property with .safe prefix.
 * @param {Object} that - The resume instance
 * @private
 */
const parseDates = (that) => {
  const { fmt } = require('./fluent-date');

  const replaceDatesInObject = (obj) => {
    if (!obj) return;

    if (Array.isArray(obj)) {
      obj.forEach(elem => replaceDatesInObject(elem));
      return;
    }

    if (typeof obj === 'object') {
      // Skip moment objects or objects with safe dates
      if (obj._isAMomentObject || obj.safe) return;

      // Recursively process nested objects
      Object.keys(obj).forEach(key => replaceDatesInObject(obj[key]));

      // Process date fields
      ['start', 'end', 'date'].forEach(val => {
        if (obj[val] !== undefined && (!obj.safe || !obj.safe[val])) {
          obj.safe = obj.safe ?? {};
          obj.safe[val] = fmt(obj[val]);

          // If start date exists but no end, default to current
          if (obj[val] && val === 'start' && !obj.end) {
            obj.safe.end = fmt('current');
          }
        }
      });
    }
  };

  Object.keys(that).forEach(member => {
    replaceDatesInObject(that[member]);
  });
};

/**
 * A FRESH resume or CV. FRESH resumes are backed by JSON, and each FreshResume
 * object is an instantiation of that JSON decorated with utility methods.
 * @class FreshResume
 */
class FreshResume {
  /**
   * Initialize the FreshResume from a JSON string.
   * @param {string} stringData - The JSON string to parse
   * @param {Object} [opts] - Parsing options
   * @returns {FreshResume} This instance for chaining
   */
  parse(stringData, opts) {
    this.imp = this.imp ?? { raw: stringData };
    return this.parseJSON(JSON.parse(stringData), opts);
  }

  /**
   * Initialize the FreshResume from JSON.
   * @param {Object} rep - The raw JSON representation
   * @param {Object} [opts={}] - Resume loading and parsing options
   * @param {boolean} [opts.date=true] - Perform safe date conversion
   * @param {boolean} [opts.sort=true] - Sort resume items by date
   * @param {boolean} [opts.compute=true] - Prepare computed resume totals
   * @param {boolean} [opts.privatize=false] - Remove private fields
   * @returns {FreshResume} This instance for chaining
   */
  parseJSON(rep, opts = {}) {
    let scrubbed;

    // Handle privatization if requested
    if (opts.privatize) {
      const scrubber = require('../utils/resume-scrubber');
      const ret = scrubber.scrubResume(rep, opts);
      scrubbed = ret.scrubbed;
    }

    // Apply the resume representation onto this object
    extend(true, this, opts.privatize ? scrubbed : rep);

    // Process only if not already processed (prevents reprocessing in .dupe())
    if (!this.imp?.processed) {
      // Set up metadata
      if (opts.imp === undefined || opts.imp) {
        this.imp = this.imp ?? {};
        this.imp.title = opts.title || this.imp.title || this.name;
        if (!this.imp.raw) {
          this.imp.raw = JSON.stringify(rep);
        }
      }
      this.imp.processed = true;

      // Parse dates, sort, and calculate computed values
      if (opts.date !== false) {
        parseDates(this);
      }

      if (opts.sort !== false) {
        this.sort();
      }

      if (opts.compute !== false) {
        this.computed = {
          numYears: this.duration(),
          keywords: this.keywords()
        };
      }
    }

    return this;
  }

  /**
   * Save the sheet to disk.
   * @param {string} [filename] - The filename to save to
   * @returns {FreshResume} This instance for chaining
   */
  save(filename) {
    this.imp.file = filename || this.imp.file;
    FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
    return this;
  }

  /**
   * Save the sheet in a specific format (FRESH or JRS).
   * @param {string} filename - The filename to save to
   * @param {string} [format='FRESH'] - The format ('FRESH' or 'JRS')
   * @returns {FreshResume} This instance for chaining
   */
  saveAs(filename, format) {
    const safeFormat = format?.trim() || 'FRESH';
    const parts = safeFormat.split('@');

    if (parts[0] === 'FRESH') {
      this.imp.file = filename || this.imp.file;
      FS.writeFileSync(this.imp.file, this.stringify(), 'utf8');
    } else if (parts[0] === 'JRS') {
      const useEdgeSchema = parts.length > 1 && parts[1] === '1';
      const newRep = CONVERTER.toJRS(this, { edge: useEdgeSchema });
      FS.writeFileSync(filename, JRSResume.stringify(newRep), 'utf8');
    } else {
      throw { badVer: safeFormat };
    }
    return this;
  }

  /**
   * Create a deep copy of this resume.
   * @returns {FreshResume} A new FreshResume instance
   */
  dupe() {
    const jso = extend(true, {}, this);
    const rnew = new FreshResume();
    rnew.parseJSON(jso, {});
    return rnew;
  }

  /**
   * Convert this object to a JSON string.
   * @returns {string} The JSON representation
   */
  stringify() {
    return FreshResume.stringify(this);
  }

  /**
   * Create a copy of this resume with all string fields transformed.
   * @param {Array<string>} filt - Keys to filter
   * @param {Function} transformer - The transformation function
   * @returns {FreshResume} The transformed copy
   */
  transformStrings(filt, transformer) {
    const ret = this.dupe();
    const trx = require('../utils/string-transformer');
    return trx(ret, filt, transformer);
  }

  /**
   * Create a copy with all fields interpreted as Markdown.
   * @returns {FreshResume} The markdownified copy
   */
  markdownify() {
    const MDIN = txt => MD(txt || '').replace(/^\s*<p>|<\/p>\s*$/gi, '');

    const trx = (key, val) => {
      if (key === 'summary') {
        return MD(val);
      }
      return MDIN(val);
    };

    return this.transformStrings(['skills', 'url', 'start', 'end', 'date'], trx);
  }

  /**
   * Create a copy with all fields XML-escaped.
   * @returns {FreshResume} The XML-escaped copy
   */
  xmlify() {
    return this.transformStrings([], (key, val) => XML(val));
  }

  /**
   * Return the resume format.
   * @returns {string} The format identifier ('FRESH')
   */
  format() {
    return 'FRESH';
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
   * Return a unique list of all skills declared in the resume.
   * @returns {Array<string>} Array of unique skill names
   */
  keywords() {
    if (!this.skills) {
      return [];
    }

    let flatSkills = [];

    if (this.skills.sets) {
      flatSkills = this.skills.sets
        .map(sk => sk.skills)
        .reduce((a, b) => a.concat(b), []);
    } else if (this.skills.list) {
      flatSkills = this.skills.list.map(sk => sk.name);
    }

    return [...new Set(flatSkills)];
  }

  /**
   * Reset the sheet to an empty state.
   * @param {boolean} [clearMeta=true] - Whether to clear metadata
   */
  clear(clearMeta = true) {
    if (clearMeta) {
      delete this.imp;
    }
    delete this.computed;
    delete this.employment;
    delete this.service;
    delete this.education;
    delete this.recognition;
    delete this.reading;
    delete this.writing;
    delete this.interests;
    delete this.skills;
    delete this.social;
  }

  /**
   * Get a safe count of items in a section.
   * @param {Object} obj - The section object
   * @returns {number} The count
   */
  count(obj) {
    if (!obj) return 0;
    if (obj.history) return obj.history.length;
    if (obj.sets) return obj.sets.length;
    return obj.length || 0;
  }

  /**
   * Add a new item to a resume section.
   * @param {string} moniker - The section name
   * @returns {Object} The newly added object
   */
  add(moniker) {
    const defSheet = FreshResume.default();

    let newObject;
    if (defSheet[moniker].history) {
      newObject = extend(true, {}, defSheet[moniker].history[0]);
    } else if (moniker === 'skills') {
      newObject = extend(true, {}, defSheet.skills.sets[0]);
    } else {
      newObject = extend(true, {}, defSheet[moniker][0]);
    }

    this[moniker] = this[moniker] || [];
    if (this[moniker].history) {
      this[moniker].history.push(newObject);
    } else if (moniker === 'skills') {
      this.skills.sets.push(newObject);
    } else {
      this[moniker].push(newObject);
    }

    return newObject;
  }

  /**
   * Check if the sheet includes a specific social profile.
   * @param {string} socialNetwork - The network name (e.g., 'GitHub')
   * @returns {boolean} True if the profile exists
   */
  hasProfile(socialNetwork) {
    const network = socialNetwork.trim().toLowerCase();
    return this.social?.some(
      p => p.network?.trim().toLowerCase() === network
    ) ?? false;
  }

  /**
   * Get the specified network profile.
   * @param {string} socialNetwork - The network name
   * @returns {Object|undefined} The profile object
   */
  getProfile(socialNetwork) {
    const network = socialNetwork.trim().toLowerCase();
    return this.social?.find(
      sn => sn.network?.trim().toLowerCase() === network
    );
  }

  /**
   * Get all profiles for the specified network.
   * @param {string} socialNetwork - The network name
   * @returns {Array<Object>} Array of matching profiles
   */
  getProfiles(socialNetwork) {
    const network = socialNetwork.trim().toLowerCase();
    return this.social?.filter(
      sn => sn.network?.trim().toLowerCase() === network
    ) ?? [];
  }

  /**
   * Check if the sheet includes a specific skill.
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
   * Validate the sheet against the FRESH Resume schema.
   * @returns {boolean} True if valid
   */
  isValid() {
    const schemaObj = require('fresh-resume-schema');
    const validate = validator(schemaObj, {
      formats: {
        date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
      }
    });

    const ret = validate(this);

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
    return inspector.run(this, 'employment.history', 'start', 'end', unit);
  }

  /**
   * Sort dated items by start date descending.
   * @returns {FreshResume} This instance for chaining
   */
  sort() {
    const byDateDesc = (a, b) => {
      if (!a.safe?.start || !b.safe?.start) return 0;
      if (a.safe.start.isBefore(b.safe.start)) return 1;
      if (a.safe.start.isAfter(b.safe.start)) return -1;
      return 0;
    };

    const sortSection = (key) => {
      const ar = __.get(this, key);
      if (ar?.length) {
        const datedThings = ar.filter(o => o.start);
        datedThings.sort(byDateDesc);
      }
    };

    sortSection('employment.history');
    sortSection('education.history');
    sortSection('service.history');
    sortSection('projects');

    // Sort writing by date
    if (this.writing?.length) {
      this.writing.sort((a, b) => {
        if (!a.safe?.date || !b.safe?.date) return 0;
        if (a.safe.date.isBefore(b.safe.date)) return 1;
        if (a.safe.date.isAfter(b.safe.date)) return -1;
        return 0;
      });
    }

    return this;
  }

  /**
   * Get the default (starter) sheet.
   * @returns {FreshResume} A new default resume
   */
  static default() {
    return new FreshResume().parseJSON(require('fresh-resume-starter').fresh);
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

module.exports = FreshResume;
