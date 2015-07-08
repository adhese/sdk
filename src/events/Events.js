/**
 * @class
 * Events defines a generic class dealing with all trypes of events being listened to through the Adhese context.
 */
Adhese.prototype.Events = function(){};

/**
 * add a new Event
 * @param {string} type of event: scroll, load, ...
 * @param {function} to call when event is fired
 * @param {HTMLElement} optional, the element to attach the event on, defaults to window object
 * @return nothing
 */
Adhese.prototype.Events.prototype.add = function(type, handler, element) {
  if (!element) {
    element = window;
  }
  if (window.addEventListener) {
    element.addEventListener(type, handler, false);
  } else if (window.attachEvent) {
    element.attachEvent('on' + type, handler);
  }
}
/**
* remove an exisiting Event
* @param {string} type of event: scroll, load, ...
* @param {function} the function attached to be removed
* @param {HTMLElement} optional, the element the event was attach to, defaults to window object
* @return nothing
*/
Adhese.prototype.Events.prototype.remove = function(type, handler, element) {
  if (!element) {
    element = window;
  }
  if (window.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else if (window.attachEvent) {
    element.detachEvent('on' + type, handler);
  }
}
