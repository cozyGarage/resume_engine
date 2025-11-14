/* Programmatic API tests for HackMyResume */

const expect = require('chai').expect;
const PATH = require('path');
const HMR = require('../src/index');

describe('Programmatic API', function() {
  this.timeout(20000);

  it('should analyze a resume programmatically', function() {
    const Analyze = HMR.verbs.analyze;
    const a = new Analyze();
    return a.invoke([PATH.join('node_modules','fresh-test-resumes','src','fresh','jane-fullstacker.json')], null, {}).then((res) => {
      expect(res).to.be.an('array');
      expect(res.length).to.be.greaterThan(0);
    });
  });

  it('should build a resume programmatically', function() {
    const Build = HMR.verbs.build;
    const b = new Build();
    return b.invoke([PATH.join('node_modules','fresh-test-resumes','src','fresh','jane-fullstacker.json')], [PATH.join('test','sandbox','prog','jane-resume.html')], {theme: 'modern', pdf: 'none'}).then((res) => {
      expect(res).to.have.property('processed');
      expect(res.processed).to.be.an('array');
      expect(res.processed.length).to.be.greaterThan(0);
    });
  });
});
