/**
High-level API test routines for HackMyResume. Test HackMyResume verbs such
as build, new, peek, etc., by creating and invoking a Verb object.
@module test-verbs.js
@license MIT. See LICENSE.md for details.
*/

var chai = require('chai')
  , chaiAsPromised = require("chai-as-promised")
  , path = require('path')
  , _ = require('underscore')
  , JRSResume = require('../../src/core/jrs-resume')
  , FCMD = require( '../../src/index')
  , validator = require('is-my-json-valid')
  , EXTEND = require('extend');

// Initialize Chai As Promised
chai.use(chaiAsPromised);
expect = chai.expect;
assert = chai.assert;
should = chai.should();
chai.config.includeStack = false;

var _sheet;

var opts = {
  format: 'JRS',
  prettify: true,
  silent: false,
  assert: true  // Causes validation errors to throw exceptions
};

var opts2 = {
  format: 'JRS',
  prettify: true,
  silent: true
};

var sb = 'test/sandbox/';
var ft = 'test/fixtures/jrs/';  // Use local test fixtures

// Assemble an array of tests, taking the form of parameters we'll pass to
// each of the defined HackMyResume verbs.
var tests = [

  [ 'new',
    [sb + 'new-jrs-resume.json'],
    [],
    opts,
    ' (JRS format)'
  ],

  [ 'new',
    [sb + 'new-jrs-1.json', sb + 'new-jrs-2.json', sb + 'new-jrs-3.json'],
    [],
    opts,
    ' (multiple JRS resumes)'
  ],

  [ '!new',
    [],
    [],
    opts,
    " (when a filename isn't specified)"
  ],

  [ 'validate',
    [ft + 'jane-fullstacker.json'],
    [],
    opts,
    ' (jane-fullstacker|JRS)'
  ],

  [ 'validate',
    [ft + 'richard-hendriks.json'],
    [],
    opts,
    ' (richard-hendriks.json|JRS)'
  ],

  [ 'analyze',
    [ft + 'jane-fullstacker.json'],
    [],
    opts,
    ' (jane-fullstacker|JRS)'
  ],

  [ 'analyze',
    [ft + 'richard-hendriks.json'],
    [],
    opts,
    ' (richard-hendriks|JRS)'
  ]

];

// Set up the main test suite for the API interface
describe('Testing API interface', function () {

  this.timeout(5000);

  function run( verb, src, dst, opts, msg, fnTest ) {

    msg = msg || '.';
    var shouldSucceed = true;
    if( verb[0] === '!' ) {
      verb = verb.substr(1);
      shouldSucceed = false;
    }

    it( 'The ' + verb.toUpperCase() + ' command should ' +
        (shouldSucceed ? ' SUCCEED' : ' FAIL') + msg, function (done) {

      var v = new FCMD.verbs[verb]();
      v.on('hmr:error', function(ex) {
        assert(false);
      });
      var prom = v.invoke( src, dst, opts );
      var fulfillMethod = shouldSucceed ? 'fulfilled' : 'rejected';

      if( fnTest ) {
        prom.should.be[ fulfillMethod ].then( function( obj ) {
          fnTest(obj.sheet);
        }).should.notify(done);
      }
      else {
        prom.should.be[fulfillMethod].notify(done);
      }

    });

  }

  tests.forEach( function(a) {
    run.apply( /* The players of */ null, a );
  });

});
