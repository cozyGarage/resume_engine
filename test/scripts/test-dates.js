/**
Test routines for HackMyResume dates, times, and datetimes.
@module test-dates.js
@license MIT. See LICENSE.md for details.
*/



var chai = require('chai')
  , expect = chai.expect
  , should = chai.should()
  , path = require('path')
  , _ = require('underscore')
  , JRSResume = require('../../src/core/jrs-resume')
  , FCMD = require( '../../src/index')
  , validator = require('is-my-json-valid')
  , EXTEND = require('extend');



chai.config.includeStack = true;



var gig = {
  company: 'E1'
};

var r = {
  basics: {
    name: 'John Doe'
  },
  meta: {
    format: 'JRS@1.0'
  },
  work: [ null ]
};



var tests = [
  // single job, concrete start, no end
  [ { startDate: '2010-01-01' } , { val: 8, unit: 'year' } ],
  [ { startDate: '2010-01' } , { val: 8, unit: 'year' } ],
  [ { startDate: '2010' } , { val: 8, unit: 'year' } ],

  // single job, concrete start, concrete end
  [ { startDate: '2010-01-01', endDate: '2015-01-01' } , { val: 5, unit: 'year' } ],
  [ { startDate: '2010-01', endDate: '2015-01' } , { val: 5, unit: 'year' } ],
  [ { startDate: '2010', endDate: '2015' } , { val: 5, unit: 'year' } ],

  // single job, falsy start, falsy end
  [ { } , { val: 0, unit: 'year' } ],
  [ { startDate: null } , { val: 0, unit: 'year' } ],
  [ { endDate: null } , { val: 0, unit: 'year' } ],
  [ { startDate: undefined } , { val: 0, unit: 'year' } ],
  [ { endDate: undefined } , { val: 0, unit: 'year' } ],
  [ { startDate: null, endDate: null } , { val: 0, unit: 'year' } ],
  [ { startDate: '', endDate: '' } , { val: 0, unit: 'year' } ],
  [ { startDate: ' ', endDate: ' ' } , { val: 0, unit: 'year' } ],
  [ { startDate: undefined, endDate: undefined } , { val: 0, unit: 'year' } ],

  // two jobs (concrete start + end) -> ( concrete start )
  [ { startDate: '2000-01', endDate: '2013-01' }, { startDate: '2013-01' }, { val: 18, unit: 'year' } ],
  [ { startDate: '2000-01', endDate: '2013-01' }, { startDate: '2013-01', endDate: '' }, { val: 18, unit: 'year' } ],
  [ { startDate: '2000-01', endDate: '2013-01' }, { startDate: '2013-01', endDate: null }, { val: 18, unit: 'year' } ],
  [ { startDate: '2000-01', endDate: '2013-01' }, { startDate: '2013-01', endDate: 'current' }, { val: 18, unit: 'year' } ]

];



tests.forEach(function(t){
   _.initial( t ).forEach(function(t){ t.company = 'E1'; });
});



describe('Testing DATES', function () {

  tests.forEach( function(t) {

    it( JSON.stringify( _.initial(t) ), function () {
      r.work = _.initial( t );
      var rObj = new JRSResume();
      rObj.parseJSON( r );
      var dur = rObj.duration();
      expect( dur ).to.equal( _.last(t).val );
    });

  });



});
