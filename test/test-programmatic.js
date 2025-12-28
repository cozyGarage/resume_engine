/* Programmatic API tests for HackMyResume */
/* global describe, it */

const expect = require('chai').expect;
const PATH = require('path');
const HMR = require('../src/index');

describe('Programmatic API', function() {
  this.timeout(20000);

  it('should analyze a resume programmatically', function() {
    const Analyze = HMR.verbs.analyze;
    const a = new Analyze();
    return a.invoke([PATH.join('test','fixtures','jrs','jane-fullstacker.json')], null, {}).then((res) => {
      expect(res).to.be.an('array');
      expect(res.length).to.be.greaterThan(0);
    });
  });

  it('should build a resume programmatically', function() {
    const Build = HMR.verbs.build;
    const b = new Build();
    return b.invoke([PATH.join('test','fixtures','jrs','jane-fullstacker.json')], [PATH.join('test','sandbox','prog','jane-resume.html')], {theme: 'node_modules/jsonresume-theme-classy', pdf: 'none'}).then((res) => {
      expect(res).to.have.property('processed');
      expect(res.processed).to.be.an('array');
      expect(res.processed.length).to.be.greaterThan(0);
    });
  });

  it('should expose utils.resumeDetector module', function() {
    expect(HMR.utils.resumeDetector).to.be.a('function');
  });

  it('should detect JRS resume format', function() {
    const detectFormat = HMR.utils.resumeDetector;
    const jrsResume = { basics: { name: 'Test' } };
    expect(detectFormat(jrsResume)).to.equal('jrs');
  });

  it('should return unknown for non-JRS resume format', function() {
    const detectFormat = HMR.utils.resumeDetector;
    const unknownResume = { foo: 'bar', baz: 123 };
    expect(detectFormat(unknownResume)).to.equal('unk');
  });
});
