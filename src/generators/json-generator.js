/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the JsonGenerator class.
@module generators/json-generator
@license MIT. See LICENSE.md for details.
*/

const BaseGenerator = require('./base-generator');
const FS = require('fs');

/** The JsonGenerator generates a JRS resume as an output. */

class JsonGenerator extends BaseGenerator {

  constructor() { super('json'); }

  invoke( rez ) {
    // Return the resume as a formatted JSON string
    return rez.stringify ? rez.stringify() : JSON.stringify(rez, null, 2);
  }

  generate( rez, f ) {
    FS.writeFileSync(f, this.invoke(rez), 'utf8');
  }
}

module.exports = JsonGenerator;
