/**
 * @class
 * Ad object represents an internal advertisement that can be requested from the server.
 * Both request and response are defined by this object. An ad can be found in the mainObject.ads array, through it's format code.
 *
 * @formatCode {string} The format code for this Ad, will be used as id in further reference to this Ad.
 * @param	{object} options	An object containing the available options for this Ad.
 * @param {boolean} options.write if true the ad will be inserted into the DOM on creation, using Javascript's document.write function
 * @param {string} options.location An optional string that identifies this Ad's location. Beware, this will overwrite the global Adhese.location property for this Ad.
 * @param {string} options.position An optional string defining this Ad's position. The string will be added to Adhese.location to identifiy this Ad. Intended for using the same formatCode more than once in the same location.
 * @return {void}
 */
 Adhese.prototype.Ad = function(adhese, formatCode, options) {
 	var defaults = { write:false };
 	this.format = formatCode;
    this.options = adhese.helper.merge(defaults, options);
	this.uid = formatCode;
 	if (this.options.position!=undefined) {
		this.uid = this.options.position + this.format;
	} 	
 	return this;
 };
