/**
 * @class
 * Ad object represents an internal advertisement that can be requested from the server.
 * Both request and response are defined by this object. An ad can be found in the mainObject.ads array, through it's format code.
 *
 * Options can be passed to determine how the ad will behave:
 * write: true/false, if true, Ad will immediately be written to the document via document.write when .tag is called
 * 
 * 
 * @formatCode {string} The format code for this Ad, will be used as id in further reference to this Ad.
 * @options	{object}	An object containing the available options for this Ad.
 * @return {void}
 */
 Adhese.prototype.Ad = function(adhese, formatCode, options) {
 	var defaults = { write:false };
 	this.format = formatCode;
 	this.options = adhese.helper.merge(defaults, options);
 	return this;
 };
