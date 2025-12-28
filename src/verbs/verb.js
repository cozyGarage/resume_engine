/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the Verb class.
@module verbs/verb
@license MIT. See LICENSE.md for details.
*/



const EVENTS = require('events');
const HMEVENT = require('../core/event-codes');
const Promise = require('pinkie-promise');



/**
An abstract invokable verb.
Provides base class functionality for verbs. Provide common services such as
error handling, event management, and promise support.
@class Verb
*/

class Verb {



  /** Constructor. Automatically called at creation. */
  /**
  Create a verb instance.
  @param {String} moniker An identifying name for the command (e.g. "build").
  @param {Function} workhorse The implementation function invoked by this verb.
  */
  constructor(moniker, workhorse) {
    this.moniker = moniker;
    this.workhorse = workhorse;
    this.emitter = new EVENTS.EventEmitter();
  }



  /** Invoke the command. */
  invoke(...args) {
    // Emit the 'begin' notification for this verb
    this.stat(HMEVENT.begin, { cmd: this.moniker });

    // Create a promise for this verb instance and call the underlying
    // workhorse function. Save resolve/reject handlers for external control.
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.workhorse.apply(this, args);
    });
    return this.promise;
  }



  /** Forward subscriptions to the event emitter. */
  on(...args) { return this.emitter.on.apply(this.emitter, args); }



  /** Fire an arbitrary event, scoped to "hmr:". */
  /**
  Emit an event prefixed with "hmr:" for this verb instance.
  The payload will always include the command name under the `cmd` key.
  */
  fire(evtName, payload = {}) {
    const pl = Object.assign({}, payload, { cmd: this.moniker });
    this.emitter.emit(`hmr:${evtName}`, pl);
    return true;
  }



  /** Handle an error condition. */
  /**
  Handle an error condition during command invocation.

  - `errorCode` is an HMR status code (numeric/string).
  - `payload` is additional contextual information about the error.
  - `hot` indicates whether the error should be thrown immediately.
  */
  err(errorCode, payload = {}, hot = false) {
    payload.sub = (payload.fluenterror = errorCode);
    payload.throw = hot;
    this.setError(errorCode, payload);
    if (payload.quit && typeof this.reject === 'function') {
      this.reject(errorCode);
    }
    this.fire('error', payload);
    if (hot) { throw payload; }
    return true;
  }



  /** Fire the 'hmr:status' error event. */
  /**
  Publish a status event (e.g. "begin", "afterRead", "beforeGenerate").
  The `subEvent` is often an HMEVENT constant.
  */
  stat(subEvent, payload = {}) {
    payload.sub = subEvent;
    this.fire('status', payload);
    return true;
  }



  /** Has an error occurred during this verb invocation? */
  hasError() { return Boolean(this.errorCode || this.errorObj); }



  /** Associate error info with the invocation. */
  setError(code, obj) {
    this.errorCode = code;
    this.errorObj = obj;
  }
}

module.exports = Verb;
