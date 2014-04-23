/**
 * @class
 * Helper object with convenience methods
 * @return {Object}
 */
 Adhese.prototype.Helper = function() {
 	this.oslist = [
 	{
 		string: navigator.userAgent,
 		subString: "Windows NT 6.2",
 		identity: "Windows8"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "Windows NT 6.1",
 		identity: "Windows7"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "Windows NT 6.0",
 		identity: "WindowsVista"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "Windows NT 5.1",
 		identity: "WindowsXP"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "Windows 98",
 		identity: "Windows98"
 	},
 	{
 		string: navigator.platform,
 		subString: "Linux",
 		identity: "Linux"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "iPhone",
 		identity: "iOS"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "iPad",
 		identity: "iOS"
 	},
 	{
 		string: navigator.platform,
 		subString: "Mac",
 		identity: "OSX"
 	},
 	{
 		string: navigator.userAgent,
 		subString: "Android",
 		identity: "Android"
 	}
 	];

 	this.browserlist = [
 	{
 		string: navigator.userAgent,
 		subString: "MSIE",
 		identity: "Explorer",
 		versionSearch: "MSIE"
 	}, {
 		string: navigator.userAgent,
 		subString: "Chrome",
 		identity: "Chrome"
 	}, {
 		string: navigator.vendor,
 		subString: "Apple",
 		identity: "Safari",
 		versionSearch: "Version"
 	}, {
 		prop: window.opera,
 		identity: "Opera"
 	}, {
 		string: navigator.userAgent,
 		subString: "Firefox",
 		identity: "Firefox"
 	}
 	];

 	this.devicelist = [
 	{
 		string:navigator.userAgent,
 		subString: "iPad",
 		identity: "iPad"
 	},{
 		string:navigator.userAgent,
 		subString: "iPhone",
 		identity: "iPhone"
 	},{
 		string:navigator.userAgent,
 		subString: "Mac",
 		identity: "Mac"
 	}

 	];
 };

/**
 * Log function used in debug mode. Simply logs to the console and saves the log messages in a private array
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.log = function(msg){
 	console.log(msg)
 } 

/**
 * Looks for META tags in the document with name inName. 
 * @param  {string} inName	Name of the META tag to read.
 * @param  {number} limitReturn	Limits the length of the returning array. If omitted or -1, the full array is returned..
 * @return {array}	Returns an array of strings.
 */
 Adhese.prototype.Helper.prototype.getMetaTagContent = function(inName, limitReturn) {
	// body...
};

/**
 * Gets the value of a query string parameter of the location of the document in which the Adhese object resides.
 * Depending on the implementation, this is not necessarily the visible url of a browser or app
 * @param  {string} inName	The name of the parameter to read.
 * @return {array}	Returns an array of strings containing the values read from the location uri.
 */
 Adhese.prototype.Helper.prototype.getQueryStringParameter = function(inName) {
 	var match = RegExp('[?&]' + key + '=([^&]*)').exec(window.location.search);
 	return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : default_;
 };

/**
 * Creates img element of 1 pixel and adds it to the document outside the viewport.
 * @param  {string} uri	The uri used as source for the image element.
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.addTrackingPixel = function(uri) {
 	var img = document.createElement('img');
 	img.src = uri + this.timestamp(s);
 	img.style.height = "1px";
 	img.style.width = "1px";
 	img.style.margin = "-1px";
 	img.style.border = "0";
 	img.style.position = "absolute";
 	img.style.top = "0";
 	document.body.appendChild(img);
 };

/**
 * Gets viewport dimensions.
 * @return {object}	Returns an object containing a width and height attribute.
 */
 Adhese.prototype.Helper.prototype.getScreenProperties = function() {
 	var dim = new Object();
 	dim.width = (window.innerWidth ?  window.innerWidth : document.body.offsetWidth);
 	dim.height = (window.innerHeight ?  window.innerHeight : document.body.offsetHeight);
 	return dim;
 };

/**
 * Adds a listener to a DOM event
 * @param  {string} event The name of the DOM event. 
 * @param  {function} listener A function name that will be called when the event is fired.
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.addEventListener = function(event, listener){
 	if(adhese.config.jquery){
 		$(window).bind(t, f);
	}else if(window.addEventListener){ // W3C standard
		window.addEventListener(t, f, false); // NB 'load' **not** 'onload'
	}else if(window.attachEvent){ // Microsoft
		window.attachEvent('on'+t, f);
	}
}

/**
 * Adds a listener to a DOM event
 * @param  {string} event The name of the DOM event. 
 * @param  {function} listener The function name that was listening to the event.
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.removeEventListener = function(event, listener){
 	if(adhese.config.jquery) {
 		$(window).unbind(t, f);
 	} else if(window.removeEventListener) {
 		window.removeEventListener(t, f, false);
 	} else if(window.detachEvent) {
 		window.detachEvent('on'+t, f);
 	}
 }

/**
 * Gets the offset of an element from the top left of the window.
 * @param  {HTMLElement} element The element who's offset you want to know.
 * @return {object}	Returns an object containing a top and left attribute.
 */
 Adhese.prototype.Helper.prototype.getAbsoluteOffset = function(element) {
 	var o = {"top":0,"left":0};
 	if (typeof(element) != 'undefined') {
 		for (o.left = 0, o.top = 0; element; element = element.offsetParent) {
 			o.left += element.offsetLeft;
 			o.top += element.offsetTop;
 		}
 	}
 	return o;
 }

/**
 * Populates a normalized Operating System, Browser and Browser version object.
 * Is automatically called by the Adhese.init function.
 * @return {object} an object containing an os, browser and browserVersion attribute
 */
 Adhese.prototype.Helper.prototype.getUserAgent = function(){
 	var obj = {};
 	obj.browser = this.searchString(this.browserlist) || "unknownBrowser";
 	obj.browserVersion = obj.browser + this.searchVersion(navigator.userAgent)
 	|| this.searchVersion(navigator.appVersion)
 	|| "unknownVersion";
 	obj.os = this.searchString(this.oslist) || "unknownOS";
 	return obj;
 }

/**
 * Internal method for determining the Operating System identification in the UserAgent 
 * @param  {string} data The list of normalized values to match the found user-agent string with.
 * @return {string}      A string containing the User Agent name.
 */
 Adhese.prototype.Helper.prototype.searchString = function (data) {
 	for (var i=0;i<data.length;i++) {
 		var dataString = data[i].string;
 		var dataProp = data[i].prop;
 		this.versionSearchString = data[i].versionSearch || data[i].identity;
 		if (dataString) {
 			if (dataString.indexOf(data[i].subString) != -1)
 				return data[i].identity;
 		}
 		else if (dataProp) {
 			return data[i].identity;
 		}
 	}
 }

/**
 * Internal method for determining the User Agent version
 * @param  {array} dataString The list of normalized values to match the found user-agent string with.
 * @return {string}            A string containing the User Agent name and version number
 */
 Adhese.prototype.Helper.prototype.searchVersion = function (dataString) {
 	var index = dataString.indexOf(this.versionSearchString);
 	if (index == -1) return;
 	return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
 }

 Adhese.prototype.Helper.prototype.merge = function(a, b){
 	var c = {};
 	for (var k in a) { 
 		c[k] = a[k];
 	}
 	for (var k in b) {
 		c[k] = b[k];
 	}
 	return c;
 }
