/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the HandlebarsGenerator class.
@license MIT. See LICENSE.md for details.
@module renderers/handlebars-generator
*/


const _ = require('underscore');
const HANDLEBARS = require('handlebars');
const FS = require('fs');
const registerHelpers = require('../helpers/handlebars-helpers');
const HMSTATUS = require('../core/status-codes');



/**
Perform template-based resume generation using Handlebars.js.
@class HandlebarsGenerator
*/
module.exports = {



  generateSimple( data, tpl ) {

    let template;
    try {
      // Compile and run the Handlebars template.
      template = HANDLEBARS.compile(tpl, {
        strict: false,
        assumeObjects: false,
        noEscape: data.opts.noescape
      }
      );
      return template(data);
    } catch (err) {
      throw{
        fluenterror:
          HMSTATUS[ template ? 'invokeTemplate' : 'compileTemplate' ],
        inner: err
      };
    }
  },



  generate( json, jst, format, curFmt, opts, theme ) {

    // Preprocess text
    let encData = json;
    if ((format === 'html') || (format === 'pdf')) {
      encData = json.markdownify();
    }
    if( format === 'doc' ) {
      encData = json.xmlify();
    }

    // Set up partials and helpers
    registerPartials(format, theme);
    registerHelpers(theme, encData, opts);

    // Set up the context
    const ctx = {
      r: encData,
      RAW: json,
      filt: opts.filters,
      format,
      opts,
      engine: this,
      results: curFmt.files,
      headFragment: opts.headFragment || ''
    };

    // Render the template
    return this.generateSimple(ctx, jst);
  }
};



var registerPartials = function(format, theme) {

  if (_.contains( ['html','doc','md','txt','pdf'], format )) {

    // Partials folder is now in the theme itself or optional
    // Since fresh-themes is removed, partials registration is skipped
    // unless the theme provides its own partials
    theme.partialsInitialized = true;
  }

  // Register theme-specific partials
  return _.each(theme.partials, function( el ) {
    const tplData = FS.readFileSync(el.path, 'utf8');
    const compiledTemplate = HANDLEBARS.compile(tplData);
    return HANDLEBARS.registerPartial(el.name, compiledTemplate);
  });
};
