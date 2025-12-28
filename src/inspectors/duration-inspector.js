/**
 * Duration inspector for HackMyResume.
 * Computes the total duration of work history.
 * @module inspectors/duration-inspector
 * @license MIT. See LICENSE.md for details.
 */

'use strict';

const FluentDate = require('../core/fluent-date');
const _ = require('underscore');
const lo = require('lodash');

/**
 * Extract and format date pairs from a job entry.
 * @param {Object} job - The job entry
 * @param {string} startKey - The key for the start date
 * @param {string} endKey - The key for the end date
 * @returns {Array|null} Array of [key, moment] pairs or null
 * @private
 */
const extractDatePairs = (job, startKey, endKey) => {
  const picked = _.pick(job, [startKey, endKey]);

  // Only process entries that have at least a start or end value
  const hasStart = picked[startKey] != null && String(picked[startKey]).trim() !== '';
  const hasEnd = picked[endKey] != null && String(picked[endKey]).trim() !== '';

  if (!hasStart && !hasEnd) {
    return null;
  }

  // Synthesize an end date if this is a "current" job
  if (!_.has(picked, endKey) || !hasEnd) {
    picked[endKey] = 'current';
  }

  // Convert to pairs and format dates
  const pairs = _.pairs(picked).map(([key, value]) => {
    const formattedDate = FluentDate.fmt(value);
    return [key, formattedDate];
  });

  return pairs;
};

/**
 * Compute the total duration of work history.
 * @param {Object} rez - The resume object
 * @param {string} collKey - The collection key (e.g., 'work')
 * @param {string} startKey - The start date key (e.g., 'startDate')
 * @param {string} endKey - The end date key (e.g., 'endDate')
 * @param {string} [unit='years'] - The unit for duration calculation
 * @returns {number} The total duration in the specified unit
 */
const run = (rez, collKey, startKey, endKey, unit = 'years') => {
  const hist = lo.get(rez, collKey);

  if (!hist || !Array.isArray(hist) || hist.length === 0) {
    return 0;
  }

  // Convert employment history to an array of date pairs
  const datePairs = hist
    .map(job => extractDatePairs(job, startKey, endKey))
    .filter(Boolean)
    .flat()
    .filter(pair => pair && pair.length === 2 && pair[0] && pair[1]);

  if (datePairs.length === 0) {
    return 0;
  }

  // Sort by date (unix timestamp)
  const sortedPairs = _.sortBy(datePairs, pair => pair[1].unix());

  // Calculate duration from first to last date
  const firstDate = sortedPairs[0][1];
  const lastDate = sortedPairs[sortedPairs.length - 1][1];

  return lastDate.diff(firstDate, unit);
};

module.exports = { run };
