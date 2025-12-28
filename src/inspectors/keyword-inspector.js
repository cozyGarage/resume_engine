/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Keyword analysis for HackMyResume.
@license MIT. See LICENSE.md for details.
@module inspectors/keyword-inspector
*/

const transformStrings = require('../utils/string-transformer');
const SEARCH_FILTERS = ['imp', 'computed', 'safeStartDate', 'safeEndDate', 'safeDate', 'safeReleaseDate'];

/**
Analyze the resume's use of keywords.
TODO: BUG: Keyword search regex is inaccurate, especially for one or two
letter keywords like "C" or "CLI".
@class keywordInspector
*/
module.exports = {

  /** A unique name for this inspector. */
  moniker: 'keyword-inspector',

  /**
  Run the Keyword Inspector on a resume.
  @method run
  @return An collection of statistical keyword data.
  */
  run( rez ) {

    // "Quote" or safely escape a keyword so it can be used as a regex. For
    // example, if the keyword is "C++", yield "C\+\+".
    // http://stackoverflow.com/a/2593661/4942583
    const regex_quote = str => (str + '').replace(/[.?*+^$[\]\\(){}|-]/ig, '\\$&');

    // Get all keywords from the resume first
    const allKeywords = rez.keywords ? rez.keywords() : [];

    // Create a searchable plain-text digest of the resume
    // Fix for BUG: Don't search within keywords for other keywords.
    // We replace exact keyword matches with placeholders before searching.
    let searchable = '';
    const snapshot = (rez && typeof rez.dupe === 'function')
      ? rez.dupe()
      : JSON.parse(JSON.stringify(rez || {}));
    transformStrings(snapshot, SEARCH_FILTERS, ( key, val ) => {
      searchable += ` ${val}`;
      return val;
    });

    // Sort keywords by length (longest first) to prevent partial matches
    // when masking. E.g., "foo & bar" should be masked before "foo".
    const sortedKeywords = [...allKeywords].sort((a, b) => b.length - a.length);

    // Create a masked version of searchable for each keyword
    // This prevents keywords from being counted within other keywords
    const createMaskedSearchable = (searchText, currentKeyword) => {
      let masked = searchText;
      // Mask all other keywords that contain the current keyword as a substring
      sortedKeywords.forEach(kw => {
        if (kw !== currentKeyword && kw.toLowerCase().includes(currentKeyword.toLowerCase())) {
          // Replace the longer keyword with a placeholder that won't match
          const kwRegex = new RegExp(regex_quote(kw), 'gi');
          masked = masked.replace(kwRegex, '\x00'.repeat(kw.length));
        }
      });
      return masked;
    };

    // Assemble a regex skeleton we can use to test for keywords with a bit
    // more accuracy
    const prefix = `(?:${['^', '\\s+', '[\\.,]+'].join('|')})`;
    const suffix = `(?:${['$', '\\s+', '[\\.,]+'].join('|')})`;

    return allKeywords.map(function(kw) {

      // 1. Using word boundary or other regex class is inaccurate
      //
      //    var regex = new RegExp( '\\b' + regex_quote( kw )/* + '\\b'*/, 'ig');
      //
      // 2. Searching for the raw keyword is inaccurate ("C" will match any
      // word containing a 'c'!).
      //
      //    var regex = new RegExp( regex_quote( kw ), 'ig');
      //
      // 3. Instead, use a custom regex with special delimeters.

      const regex_str = prefix + regex_quote( kw ) + suffix;
      const regex = new RegExp( regex_str, 'ig');

      // Use masked searchable to prevent counting keywords within other keywords
      const maskedSearchable = createMaskedSearchable(searchable, kw);

      let count = 0;
      while (regex.exec( maskedSearchable ) !== null) {
        count++;
      }
      return {
        name: kw,
        count
      };
    });
  }
};
