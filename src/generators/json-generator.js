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
let FJCV = null;
try {
  FJCV = require('fresh-jrs-converter');
} catch (e) {
  FJCV = null;
}

/** The JsonGenerator generates a FRESH or JRS resume as an output. */

class JsonGenerator extends BaseGenerator {

  constructor() { super('json'); }

  invoke( rez ) {
    // If we are a JSON Resume, prefer the resume stringify method. Otherwise
    // we only support conversion if the converter is available.
    if (rez && typeof rez.format === 'function' && rez.format() === 'JRS') {
      if (rez.stringify && typeof rez.stringify === 'function') {
        return rez.stringify();
      } else {
        return JSON.stringify(rez, null, 2);
      }
    }

    if (!FJCV) {
      throw new Error('FRESH conversion support was removed; to generate FRESH from a JRS resume install fresh-jrs-converter or convert to JRS first.');
    }
    let altRez = FJCV[ `to${rez.format() === 'FRESH' ? 'JRS' : 'FRESH'}` ](rez);
    return altRez = FJCV.toSTRING( altRez );
  }
    //altRez.stringify()

  generate( rez, f ) {
    FS.writeFileSync(f, this.invoke(rez), 'utf8');
  }
}

module.exports = JsonGenerator;
