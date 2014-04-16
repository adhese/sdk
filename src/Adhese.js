/**
 * @class
 * This file contains the main Adhese object used for most implementations of Adhese on webpages. 
 * It defines a number of private objects. 
 */
 function Adhese() {
 	this.config = {debug:false};
 	this.request = {};
 	this.ads = [];
 	this.that = this;
 	this.helper = new this.Helper();
 	return this; 
 }

/**
 * Initializes the object. Resets all saved objects.
 * This method should be called at least just after creation of the Adhese object.
 * In most cases re-initialsation is not need, but depending on your implementation, 
 * it is available by simply calling init on an existing instance of Adhese.
 *
 * The options object can contain the following attributes:
 * debug: true/false, for setting debug logging, not intended for production use
 * host: the host of your adhese account, available in your support account
 * location: can be either a string containing the actual location to be passed ot the adserver or a function to be called to retreive the location 
 * 
 * The method will check if jQuery is available, and if so, mkae it available for ad templates as well.
 *
 * @param  {object} options An object that contains properties defined by your Adhese implementation
 * @return {void}
 */
 Adhese.prototype.init = function(options) {
 	if (options.debug)
 		this.config.debug = options.debug;

 	if (this.config.debug)
 		this.helper.log("Adhese: initializing...");

 	this.config.jquery =  typeof jQuery !== 'undefined';

 	if (options.host)
 		this.config.host = options.host;

 	if (options.location && typeof options.location=="function")
 		this.config.location = options.location();
 	else if (options.location && typeof options.location=="string")
 		this.config.location = options.location;

 	this.userAgent = this.helper.getUserAgent();

 	this.registerRequestParameter('rn', Math.round(Math.random()*10000));
 	this.registerRequestParameter('br', 'screen3');
 	this.registerRequestParameter('br', 'desktop');
 	
 	for (var p in this.userAgent) {
 		this.registerRequestParameter('br', this.userAgent[p]);
 	}

 	if (this.config.debug) {
 		this.helper.log('Adhese: initialized with config:');
 		this.helper.log(this.config);
 	}		

 };

/**
 * Function to add target parameters to an Adhese instance. These parameters will be appended to each request.
 * @param  {string} key   the prefix for this target
 * @param  {string} value the value to be added
 * @return {void}       
 */
Adhese.prototype.registerRequestParameter = function(key, value) {
	var v = this.request[key];
	if (!v) v = new Array();
	v.push(value);
	this.request[key] = v;
}

/**
 * The tag function is the default function to be called from within an ad container.
 * It requires at least the formatCode parameter.
 * The function creates an Ad object 
 * @param  {string} formatCode Contains the format code as defined in Adhese
 * @param  {object} options An object that contains properties that define targeting, location and other request properties defined by your Adhese implementation
 * @return {object}	The newly created Ad object.
 */
 Adhese.prototype.tag = function(formatCode, options) {
 	var ad = new this.Ad(this, formatCode, options);
 	this.ads.push([formatCode, ad]);
 	if (ad.options.write) {
 		this.write(ad);
 	}
 	return ad;
 };

/**
 * Executes a document.write and creates a script tag when called. 
 * The script tag requests a javascript advertisment from the server. 
 * @param  {object} ad The Ad object instance to be written to the document.
 * @return {void}
 */
 Adhese.prototype.write = function(ad) {
 	if (this.config.debug) {
 		console.log('Adhese.write: request uri: ' + this.getRequestUri(ad, {type:'js'}));
 	}
 	document.write('<scri'+'pt language="text/javascript" src="' + this.getRequestUri(ad, {type:'js'}) + '"></scr'+'ipt>');
 };

/**
 * Creates an invisible pixel in the document that sends a request to Adhese for tracking an impression or action.
 * @param  {string} uri The URI used for tracking.
 * @return {void}
 */
 Adhese.prototype.track = function(uri) {
	this.helper.addTrackingPixel(uri);
};

/**
 * Returns the uri to execute the actual request for this ad
 *
 * @param {object} ad the Ad instance whose uri is needed
 * @param {object} options Possible options: type:'js'|'json'|'jsonp', when useing type:'jsonp' you can alos provide the name of a callback function callback:'callbackFunctionName'. Type 'js' is the default if no options are given. Callback 'callback' is the default for type 'jsonp'
 * @return {string}
 */
 Adhese.prototype.getRequestUri = function(ad, options) {
 	var uri = this.config.host;
 	
 	if (!options) options = {'type':'js'};

 	switch(options.type) {
 		case 'json':
 		uri += 'json/sl' + this.config.location + '-' + ad.format + '/';
 		break;

 		case 'jsonp':
 		uri += 'jsonp/callback/sl' + this.config.location + '-' + ad.format + '/';
 		break;

 		default:
 		uri += 'ad/sl' + this.config.location + '-' + ad.format + '/';
 		break;
 	}
 	
 	for (var a in this.request) {
 		var s = a;
 		for (var x=0; x<this.request[a].length; x++) { 			
 			s += this.request[a][x] + (this.request[a].length-1>x?';':'');
 		}
 		uri += s + '/';
 	}
 	uri += '?t=' + new Date().getTime();
 	return uri;
 };
