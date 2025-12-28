/**
 * The HackMyResume date representation.
 * @license MIT. See LICENSE.md for details.
 * @module core/fluent-date
 */

'use strict';

const moment = require('moment');
require('../utils/string');

// Pre-compute month name mappings for efficiency
const months = new Map();
const abbr = new Map();
moment.months().forEach((m, idx) => months.set(m.toLowerCase(), idx + 1));
moment.monthsShort().forEach((m, idx) => abbr.set(m.toLowerCase(), idx + 1));
abbr.set('sept', 9); // Handle common abbreviation

// Regex patterns for date parsing
const DATE_PATTERNS = {
  PRESENT: /^(present|now|current)$/i,
  MONTH_YEAR: /^\D+\s+\d{4}$/,      // "Mar 2015"
  YEAR_MONTH: /^\d{4}-\d{1,2}$/,    // "2015-03" or "1998-4"
  YEAR_ONLY: /^\s*\d{4}\s*$/,        // "2015"
  EMPTY: /^\s*$/                     // "", " "
};

/**
 * Create a FluentDate from a string or Moment date object.
 * Supported date formats:
 * 1. "Present", "Now", "Current" - referring to the current date
 * 2. "YYYY-MM-DD" - JSON Resume format ("2015-02-10")
 * 3. "YYYY-MM" - Year and month only ("2015-04")
 * 4. "YYYY" - Year only ("2015")
 * 5. "mmm YYYY" - HackMyResume friendly format ("Mar 2015")
 * 6. Empty dates ("", " ")
 * 7. Any ISO date format parseable by Moment.js
 *
 * @class FluentDate
 */
class FluentDate {
  /**
   * Create a new FluentDate instance.
   * @param {string|moment.Moment|null} dt - The date to parse
   */
  constructor(dt) {
    this.rep = FluentDate.fmt(dt);
  }

  /**
   * Check if a date value represents "current" or present time.
   * @param {string|null|undefined} dt - The date value to check
   * @returns {boolean} True if the date represents current/present
   */
  static isCurrent(dt) {
    if (!dt) return true;
    if (typeof dt === 'string') {
      return DATE_PATTERNS.PRESENT.test(dt.trim());
    }
    return false;
  }

  /**
   * Get the current moment, respecting HMR_NOW environment variable.
   * @returns {moment.Moment} The current moment
   * @private
   */
  static _getNow() {
    return process.env.HMR_NOW ? moment(process.env.HMR_NOW) : moment();
  }

  /**
   * Parse a "Month Year" format string (e.g., "Mar 2015").
   * @param {string} dt - The date string to parse
   * @returns {moment.Moment|null} Parsed moment or null if invalid
   * @private
   */
  static _parseMonthYear(dt) {
    const parts = dt.split(/\s+/);
    if (parts.length !== 2) return null;

    const monthName = parts[0].toLowerCase();
    const year = parts[1];
    const month = months.get(monthName) || abbr.get(monthName);

    if (!month) return null;

    const monthStr = month < 10 ? `0${month}` : String(month);
    return moment(`${year}-${monthStr}`, 'YYYY-MM');
  }

  /**
   * Format and parse a date value into a Moment object.
   * @param {string|moment.Moment|null|undefined} dt - The date to format
   * @param {boolean} [throws=true] - Whether to throw on invalid dates
   * @returns {moment.Moment|null} The parsed moment or null
   */
  static fmt(dt, throws = true) {
    // Handle null/undefined
    if (dt == null) {
      return FluentDate._getNow();
    }

    // Handle Moment objects
    if (typeof dt === 'object' && dt.isValid && dt.isValid()) {
      return dt;
    }

    // Handle string dates
    if (typeof dt === 'string') {
      const trimmed = dt.trim().toLowerCase();

      // Present/Now/Current
      if (DATE_PATTERNS.PRESENT.test(trimmed)) {
        return FluentDate._getNow();
      }

      // Empty string
      if (DATE_PATTERNS.EMPTY.test(trimmed)) {
        return FluentDate._getNow();
      }

      // "Mar 2015" format
      if (DATE_PATTERNS.MONTH_YEAR.test(trimmed)) {
        const result = FluentDate._parseMonthYear(trimmed);
        if (result) return result;
      }

      // "2015-03" or "2015-4" format
      if (DATE_PATTERNS.YEAR_MONTH.test(trimmed)) {
        return moment(trimmed, 'YYYY-MM');
      }

      // "2015" year-only format
      if (DATE_PATTERNS.YEAR_ONLY.test(trimmed)) {
        return moment(trimmed, 'YYYY');
      }

      // Try default Moment parsing for other formats
      const mt = moment(trimmed);
      if (mt.isValid()) {
        return mt;
      }
    }

    // Invalid date handling
    if (throws) {
      throw new Error(`Invalid date format encountered: ${dt}`);
    }
    return null;
  }
}

module.exports = FluentDate;
