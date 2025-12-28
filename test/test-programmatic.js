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
  return b.invoke([PATH.join('test','fixtures','jrs','jane-fullstacker.json')], [PATH.join('test','sandbox','prog','jane-resume.html')], {theme: 'modern', pdf: 'none'}).then((res) => {
      expect(res).to.have.property('processed');
      expect(res.processed).to.be.an('array');
      expect(res.processed.length).to.be.greaterThan(0);
    });
  });

  it('should expose utils.pdfEngines module', function() {
    expect(HMR.utils).to.be.an('object');
    expect(HMR.utils.pdfEngines).to.be.an('object');
    expect(HMR.utils.pdfEngines.checkPdfEngine).to.be.a('function');
    expect(HMR.utils.pdfEngines.getAvailablePdfEngines).to.be.a('function');
    expect(HMR.utils.pdfEngines.getBestAvailablePdfEngine).to.be.a('function');
  });

  it('should check PDF engine availability', function() {
    const { checkPdfEngine } = HMR.utils.pdfEngines;
    const result = checkPdfEngine('wkhtmltopdf');
    expect(result).to.be.an('object');
    expect(result).to.have.property('available');
    expect(result).to.have.property('engine');
  });

  it('should expose utils.resumeDetector module', function() {
    expect(HMR.utils.resumeDetector).to.be.a('function');
  });

  it('should detect JRS resume format', function() {
    const detectFormat = HMR.utils.resumeDetector;
    const jrsResume = { basics: { name: 'Test' } };
    expect(detectFormat(jrsResume)).to.equal('jrs');
  });

  it('should detect FRESH resume format', function() {
    const detectFormat = HMR.utils.resumeDetector;
    const freshResume = { info: { name: 'Test' }, employment: {} };
    expect(detectFormat(freshResume)).to.equal('fresh');
  });
});
