/**
Test routines for HackMyResume dates, times, and datetimes.
@module test-dates.js
@license MIT. See LICENSE.md for details.
*/

'use strict';

const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const _ = require('underscore');
const JRSResume = require('../../src/core/jrs-resume');
const FCMD = require('../../src/index');
const validator = require('is-my-json-valid');
const EXTEND = require('extend');

chai.config.includeStack = true;

// Base JRS resume structure for testing
const createTestResume = (workEntries) => ({
  basics: {
    name: 'John Doe',
    label: 'Test',
    email: 'test@test.com'
  },
  work: workEntries.map(entry => ({
    company: entry.employer || 'Test Company',
    position: 'Developer',
    startDate: entry.start || entry.startDate,
    endDate: entry.end || entry.endDate
  }))
});

// Test cases: [workEntries..., expectedDuration]
const tests = [
  // single job, concrete start, no end (current job)
  [{ start: '2010-01-01', employer: 'E1' }, { val: 8, unit: 'years' }],
  [{ start: '2010-01', employer: 'E1' }, { val: 8, unit: 'years' }],
  [{ start: '2010', employer: 'E1' }, { val: 8, unit: 'years' }],

  // single job, concrete start, concrete end
  [{ start: '2010-01-01', end: '2015-01-01', employer: 'E1' }, { val: 5, unit: 'years' }],
  [{ start: '2010-01', end: '2015-01', employer: 'E1' }, { val: 5, unit: 'years' }],
  [{ start: '2010', end: '2015', employer: 'E1' }, { val: 5, unit: 'years' }],

  // single job, falsy start, falsy end (should return 0 duration)
  [{ employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: null, employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ end: null, employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: undefined, employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ end: undefined, employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: null, end: null, employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: '', end: '', employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: ' ', end: ' ', employer: 'E1' }, { val: 0, unit: 'years' }],
  [{ start: undefined, end: undefined, employer: 'E1' }, { val: 0, unit: 'years' }],

  // two jobs (concrete start + end) -> (concrete start, current)
  [
    { start: '2000-01', end: '2013-01', employer: 'E1' },
    { start: '2013-01', employer: 'E2' },
    { val: 18, unit: 'years' }
  ],
  [
    { start: '2000-01', end: '2013-01', employer: 'E1' },
    { start: '2013-01', end: '', employer: 'E2' },
    { val: 18, unit: 'years' }
  ],
  [
    { start: '2000-01', end: '2013-01', employer: 'E1' },
    { start: '2013-01', end: null, employer: 'E2' },
    { val: 18, unit: 'years' }
  ],
  [
    { start: '2000-01', end: '2013-01', employer: 'E1' },
    { start: '2013-01', end: 'current', employer: 'E2' },
    { val: 18, unit: 'years' }
  ]
];

describe('Testing DATES', function () {

  tests.forEach((testCase) => {
    // Last element is the expected result, rest are work entries
    const expected = testCase[testCase.length - 1];
    const workEntries = testCase.slice(0, -1);

    it(`Duration for ${JSON.stringify(workEntries)}`, function () {
      const resumeData = createTestResume(workEntries);
      const rObj = new JRSResume();
      rObj.parseJSON(resumeData, { date: true, sort: false, compute: false });
      const dur = rObj.duration(expected.unit);
      expect(dur).to.equal(expected.val);
    });
  });

  // Additional edge case tests
  describe('Edge Cases', function () {

    it('should handle empty work array', function () {
      const rObj = new JRSResume();
      rObj.parseJSON({ basics: { name: 'Test' }, work: [] });
      expect(rObj.duration()).to.equal(0);
    });

    it('should handle missing work property', function () {
      const rObj = new JRSResume();
      rObj.parseJSON({ basics: { name: 'Test' } });
      expect(rObj.duration()).to.equal(0);
    });

    it('should handle "Present" as end date', function () {
      const rObj = new JRSResume();
      rObj.parseJSON(createTestResume([{ start: '2010-01-01', end: 'Present' }]));
      const dur = rObj.duration('years');
      expect(dur).to.equal(8); // From 2010 to 2018 (HMR_NOW)
    });

    it('should handle "Now" as end date', function () {
      const rObj = new JRSResume();
      rObj.parseJSON(createTestResume([{ start: '2010-01-01', end: 'Now' }]));
      const dur = rObj.duration('years');
      expect(dur).to.equal(8);
    });

  });

});
