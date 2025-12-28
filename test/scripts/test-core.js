/**
 * Comprehensive tests for core resume modules.
 * @module test/scripts/test-core
 */

const { expect } = require('chai');
const PATH = require('path');
const FS = require('fs');

// Core modules
const JRSResume = require('../../src/core/jrs-resume');
const FluentDate = require('../../src/core/fluent-date');
const DurationInspector = require('../../src/inspectors/duration-inspector');
const ResumeDetector = require('../../src/utils/resume-detector');

// Test fixtures
const SANDBOX = PATH.join(__dirname, '../sandbox');
const FIXTURES = PATH.join(__dirname, '../fixtures');

describe('Core Module Tests', function() {

  describe('JRSResume Class', function() {

    it('should create a default JRS resume', function() {
      const rez = JRSResume.default();
      expect(rez).to.be.an('object');
      expect(rez.basics).to.be.an('object');
    });

    it('should parse a valid JRS resume', function() {
      const rezJson = {
        basics: {
          name: 'Test User',
          email: 'test@example.com'
        },
        work: [{
          company: 'Test Corp',
          position: 'Developer',
          startDate: '2020-01-01',
          endDate: '2023-01-01'
        }],
        skills: [{
          name: 'Programming',
          keywords: ['JavaScript', 'Python', 'Node.js']
        }]
      };

      const rez = new JRSResume().parseJSON(rezJson);
      expect(rez.basics.name).to.equal('Test User');
      expect(rez.work).to.have.lengthOf(1);
      expect(rez.skills).to.have.lengthOf(1);
    });

    it('should extract unique keywords from skills', function() {
      const rezJson = {
        basics: { name: 'Test' },
        skills: [
          { name: 'Web', keywords: ['JavaScript', 'HTML', 'CSS'] },
          { name: 'Backend', keywords: ['Node.js', 'JavaScript', 'Python'] }
        ]
      };

      const rez = new JRSResume().parseJSON(rezJson);
      const keywords = rez.keywords();
      
      expect(keywords).to.include('JavaScript');
      expect(keywords).to.include('HTML');
      expect(keywords).to.include('Python');
      // JavaScript should appear only once (unique)
      expect(keywords.filter(k => k === 'JavaScript')).to.have.lengthOf(1);
    });

    it('should handle empty skills array', function() {
      const rezJson = { basics: { name: 'Test' }, skills: [] };
      const rez = new JRSResume().parseJSON(rezJson);
      expect(rez.keywords()).to.deep.equal([]);
    });

    it('should check for social profiles', function() {
      const rezJson = {
        basics: {
          name: 'Test',
          profiles: [
            { network: 'GitHub', url: 'https://github.com/test' },
            { network: 'LinkedIn', url: 'https://linkedin.com/in/test' }
          ]
        }
      };

      const rez = new JRSResume().parseJSON(rezJson);
      expect(rez.hasProfile('GitHub')).to.be.true;
      expect(rez.hasProfile('github')).to.be.true; // case insensitive
      expect(rez.hasProfile('Twitter')).to.be.false;
    });

    it('should check for specific skills', function() {
      const rezJson = {
        basics: { name: 'Test' },
        skills: [
          { name: 'Web', keywords: ['JavaScript', 'React'] }
        ]
      };

      const rez = new JRSResume().parseJSON(rezJson);
      expect(rez.hasSkill('JavaScript')).to.be.true;
      expect(rez.hasSkill('javascript')).to.be.true; // case insensitive
      expect(rez.hasSkill('Python')).to.be.false;
    });

    it('should stringify without internal metadata', function() {
      const rezJson = {
        basics: { name: 'Test User' },
        work: []
      };

      const rez = new JRSResume().parseJSON(rezJson);
      const str = rez.stringify();
      const parsed = JSON.parse(str);

      expect(parsed.basics.name).to.equal('Test User');
      expect(parsed.imp).to.be.undefined;
      expect(parsed.computed).to.be.undefined;
    });

    it('should duplicate a resume', function() {
      const rezJson = {
        basics: { name: 'Original' },
        work: [{ company: 'Test Corp' }]
      };

      const rez = new JRSResume().parseJSON(rezJson);
      const dupe = rez.dupe();

      expect(dupe.basics.name).to.equal('Original');
      
      // Modify dupe and check original is unchanged
      dupe.basics.name = 'Modified';
      expect(rez.basics.name).to.equal('Original');
    });

    it('should return format as JRS', function() {
      const rez = JRSResume.default();
      expect(rez.format()).to.equal('JRS');
    });

    it('should add new items to sections', function() {
      const rez = JRSResume.default();
      const newJob = rez.add('work');
      
      expect(newJob).to.be.an('object');
      expect(rez.work).to.include(newJob);
    });

    it('should save and load resume from file', function() {
      const testFile = PATH.join(SANDBOX, 'test-save-resume.json');
      const rezJson = {
        basics: { name: 'Save Test' },
        work: []
      };

      const rez = new JRSResume().parseJSON(rezJson);
      rez.save(testFile);

      expect(FS.existsSync(testFile)).to.be.true;
      
      const content = JSON.parse(FS.readFileSync(testFile, 'utf8'));
      expect(content.basics.name).to.equal('Save Test');
    });

  });

  describe('FluentDate Module', function() {

    it('should parse ISO date strings', function() {
      const date = FluentDate.fmt('2020-06-15');
      expect(date.isValid()).to.be.true;
      expect(date.year()).to.equal(2020);
      expect(date.month()).to.equal(5); // 0-indexed
    });

    it('should handle partial dates (year-month)', function() {
      const date = FluentDate.fmt('2020-06');
      expect(date.isValid()).to.be.true;
      expect(date.year()).to.equal(2020);
    });

    it('should handle year-only dates', function() {
      const date = FluentDate.fmt('2020');
      expect(date.isValid()).to.be.true;
      expect(date.year()).to.equal(2020);
    });

    it('should handle "current" keyword', function() {
      const date = FluentDate.fmt('current');
      expect(date.isValid()).to.be.true;
    });

    it('should handle "present" keyword', function() {
      const date = FluentDate.fmt('present');
      expect(date.isValid()).to.be.true;
    });

    it('should handle null/undefined dates', function() {
      const nullDate = FluentDate.fmt(null);
      const undefDate = FluentDate.fmt(undefined);
      
      // The module may return null or current date for null/undefined inputs
      expect(nullDate === null || nullDate.isValid()).to.be.true;
      expect(undefDate === null || undefDate.isValid()).to.be.true;
    });

    it('should handle empty string dates', function() {
      const date = FluentDate.fmt('');
      // Empty strings may return current date or null depending on implementation
      expect(date === null || date.isValid()).to.be.true;
    });

    it('should handle whitespace-only dates', function() {
      const date = FluentDate.fmt('   ');
      // Whitespace may return current date or null depending on implementation
      expect(date === null || date.isValid()).to.be.true;
    });

    it('should parse month names', function() {
      const date = FluentDate.fmt('January 2020');
      expect(date.isValid()).to.be.true;
      expect(date.year()).to.equal(2020);
      expect(date.month()).to.equal(0); // January
    });

    it('should parse various date formats', function() {
      const formats = [
        '2020-01-15',
        '2020-01',
        '2020',
        'Jan 2020',
        'January 2020'
      ];

      formats.forEach(fmt => {
        const date = FluentDate.fmt(fmt);
        expect(date, `Failed for format: ${fmt}`).to.not.be.null;
        expect(date.isValid(), `Invalid date for format: ${fmt}`).to.be.true;
      });
    });

  });

  describe('DurationInspector Module', function() {

    it('should calculate duration for single job', function() {
      const resume = {
        work: [{
          startDate: '2015-01-01',
          endDate: '2020-01-01'
        }]
      };

      const years = DurationInspector.run(resume, 'work', 'startDate', 'endDate');
      expect(years).to.equal(5);
    });

    it('should calculate duration for multiple jobs', function() {
      const resume = {
        work: [
          { startDate: '2018-01-01', endDate: '2020-01-01' },
          { startDate: '2015-01-01', endDate: '2018-01-01' }
        ]
      };

      const years = DurationInspector.run(resume, 'work', 'startDate', 'endDate');
      expect(years).to.equal(5);
    });

    it('should handle overlapping jobs', function() {
      const resume = {
        work: [
          { startDate: '2015-01-01', endDate: '2020-01-01' },
          { startDate: '2018-01-01', endDate: '2022-01-01' }
        ]
      };

      const years = DurationInspector.run(resume, 'work', 'startDate', 'endDate');
      expect(years).to.equal(7); // 2015-2022
    });

    it('should handle empty work array', function() {
      const resume = { work: [] };
      const years = DurationInspector.run(resume, 'work', 'startDate', 'endDate');
      expect(years).to.equal(0);
    });

    it('should handle missing work property', function() {
      const resume = {};
      const years = DurationInspector.run(resume, 'work', 'startDate', 'endDate');
      expect(years).to.equal(0);
    });

    it('should handle different units', function() {
      const resume = {
        work: [{
          startDate: '2020-01-01',
          endDate: '2020-07-01'
        }]
      };

      const months = DurationInspector.run(resume, 'work', 'startDate', 'endDate', 'months');
      expect(months).to.equal(6);
    });

  });

  describe('ResumeDetector Module', function() {

    it('should detect JRS format', function() {
      const jrsResume = {
        basics: { name: 'Test' },
        work: []
      };

      const format = ResumeDetector(jrsResume);
      expect(format.toLowerCase()).to.equal('jrs');
    });

    it('should detect JRS format via meta.format', function() {
      const jrsResume = {
        meta: { format: 'JRS@1.0' },
        basics: { name: 'Test' }
      };

      const format = ResumeDetector(jrsResume);
      expect(format.toLowerCase()).to.equal('jrs');
    });

    it('should return unknown for unrecognized format', function() {
      const unknownResume = {
        foo: 'bar',
        baz: 123
      };

      const format = ResumeDetector(unknownResume);
      expect(format).to.equal('unk');
    });

    it('should handle null input', function() {
      const format = ResumeDetector(null);
      expect(format).to.equal('unk');
    });

  });

});
