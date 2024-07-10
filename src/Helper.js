/**
 * @class
 * Helper object with convenience methods
 * @return {Object}
 */
 Adhese.prototype.Helper = function() {
	 this.oslist = [
		 {
			 string: navigator.userAgent,
			 subString: "Windows Phone",
			 identity: "WindowsPhone"
		 },
		 {
			 string: navigator.userAgent,
			 subString: "Windows NT 10.0",
			 identity: "Windows10"
		 },
		 {
			 string: navigator.userAgent,
			 subString: "Windows NT 6.3",
			 identity: "Windows8.1"
		 },
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
			 string: navigator.userAgent,
			 subString: "Android",
			 identity: "Android"
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
			 string: navigator.platform,
			 subString: "Linux",
			 identity: "Linux"
		 }
	 ];

	 this.browserlist = [
		{
			string: navigator.userAgent,
			subString: "AppleTV",
			identity: "AppleTV"
		}, {
			string: navigator.userAgent,
			subString: "CrKey",
			identity: "Chromecast"
		}, {
			string: navigator.userAgent,
			subString: "FBAN",
			identity: "Facebook"
		}, {
			string: navigator.userAgent,
			subString: "FBAV",
			identity: "Facebook"
		}, {
			string: navigator.userAgent,
			subString: "Instagram",
			identity: "Instagram"
		}, {
			 string: navigator.userAgent,
			 subString: "Trident/7",
			 identity: "Explorer",
			 versionSearch: "rv"
		 }, {
			 string: navigator.userAgent,
			 subString: "MSIE",
			 identity: "Explorer",
			 versionSearch: "MSIE"
		 }, {
			 string: navigator.userAgent,
			 subString: "Chrome",
			 identity: "Chrome"
		 }, {
			 prop: window.opera,
			 identity: "Opera"
		 }, {
			 string: navigator.userAgent,
			 subString: "Firefox",
			 identity: "Firefox"
		 }, {
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		}
	 ];
 };

/**
 * Log function used in debug mode. Simply logs to the console and saves the log messages in a private array
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.log = function(){
 	this.logObjs = this.logObjs || {};
	this.logs = this.logs || [];
	var logArgs = '';
	var logTime = new Date().getTime();
	for (var i = 0, a = arguments; i < a.length; i++) {
		if (a[i]) {
			logArgs += a[i] + ' ';
		}
	}
	this.logObjs[logTime] = logObj = {
		msg: logArgs
	};
	//this.logs.push(logTime + ": " + logArgs);
	this.logs.push([logTime, arguments]);
	if (window.location.search.match("debug")) {
		console.log(logTime, arguments)
	};
};


/*helper.debug()
prints all log messages
*/


Adhese.prototype.Helper.prototype.debug = function() {
	for (var i in this.logs) {
    var l = this.logs[i];
		console.log(l[0], l[1]);
	}
};
Adhese.prototype.Helper.prototype.debugTable = function() {
	if (typeof console.table == 'function') {
		console.table(this.logObjs);
	}
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
	var match = RegExp('[?&]' + inName + '=([^&]*)').exec(window.location.search);
	return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : "";
};

/**
 * Creates img element of 1 pixel and adds it to the document outside the viewport.
 * @param  {string} uri	The uri used as source for the image element.
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.addTrackingPixel = function(uri) {
 	var img = document.createElement('img');
 	//img.src = uri + this.timestamp(uri);
 	img.src = uri;
 	img.style.height = "1px";
 	img.style.width = "1px";
 	img.style.margin = "-1px";
 	img.style.border = "0";
 	img.style.position = "absolute";
 	img.style.top = "0";
	img.alt = "";
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
 Adhese.prototype.Helper.prototype.addEvent = function(ev, fu, param, element) {
 	if(typeof element == "undefined"){
		element = window;
	}
 	if(element.addEventListener){ // W3C standard
		element.addEventListener(ev, function() {fu(param);}, false);
	} else if(element.attachEvent){ // Microsoft
		element.attachEvent('on'+ev, function() {fu(param);});
	}
}

/**
 * Adds a listener to a DOM event
 * @param  {string} event The name of the DOM event.
 * @param  {function} listener The function name that was listening to the event.
 * @return {void}
 */
 Adhese.prototype.Helper.prototype.removeEvent = function(e, l, el){
 	if(window.removeEventListener) {
 		window.removeEventListener(e, l, false);
 	} else if(window.detachEvent) {
 		window.detachEvent('on'+e, l);
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
/**
 * Internal method for generating a hexadecimal representation of a string
 * @param  {string} The string to be converted to a hexadecimal value
 * @return {number} A hexadecimal number generated from the input string
 */
Adhese.prototype.Helper.prototype.stringToHex = function(str, hex) {
    try{
        hex = unescape(encodeURIComponent(str)).split('').map(
            function(v){
                return v.charCodeAt(0).toString(16);
            }).join('');
  }
  catch(e){
    hex = str
    console.log('invalid text input: ', e, str)
  }
  return hex
}
/**
 * Internal method for generating a string representation of a hexadecimal
 * @param  {number} A hexadecimal number generated from the input string
 * @return {string} The string to be converted to a hexadecimal value
 */
 Adhese.prototype.Helper.prototype.hexToString = function(hex, str){
	try{
    	str = decodeURIComponent(hex.replace(/(..)/g,'%$1'))
	} catch(e){
    str = hex
    console.log('invalid hex input: ', e, hex)
  }
  return str
}

Adhese.prototype.Helper.prototype.base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
		if (typeof btoab == "function") {
			return btoa(input);
		} else {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = this._utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}
				output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
			}
			return output;
		}
	},
	urlencode : function (input) {
		if (typeof btoa == "function") {
			return btoa(input).replace(/\+/g, '-').replace(/\//g, '_');
		} else {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = this._utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}
				output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
			}
			return output.replace(/\+/g, '-').replace(/\//g, '_');
		}
	},
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	}
}

/**
 * Function that creates a new cookie or overwrites an existing one with the same name
 * @param  {string} name  the name of this cookie, if it already exists, it will be overwrittem
 * @param  {string} value the value to be stored in the cookie
 * @param  {number} days  the number of days this cookie will remain valid
 * @return {void}
 */
Adhese.prototype.Helper.prototype.createCookie = function(name,value,days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime( date.getTime() + (days*24*60*60*1000) - (date.getTimezoneOffset()*60*1000) );
		expires = "; expires="+date.toUTCString();
	}
	document.cookie = name+"="+value+expires+"; path=/; SameSite=None; Secure";
}

/**
 * Function to read the value of a cookie with a specific name
 * @param  {string} name the name of the cookie to be read
 * @return {string}      the value of the cookie, of no cookie exists, null is returned
 */
Adhese.prototype.Helper.prototype.readCookie = function(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

/**
 * Function to remove a cookie
 * @param  {string} name the name of the cookie to be removed
 * @return {void}
 */
Adhese.prototype.Helper.prototype.eraseCookie = function(name) {
	this.createCookie(name,"",-1);
}

/**
 * Function to test if the client will eat our cookies.
 * @return {boolean}	returns true if user accepts cookie, false if not
 */
Adhese.prototype.Helper.prototype.eatsCookie = function() {
	this.createCookie("adheseTestCookie","",1);
	if (this.readCookie("adheseTestCookie")!=null) {
		this.eraseCookie("adheseTestCookie");
		return true;
	} else {
		return false;
	}
}

/**
 * Function to get the values from meta elements
 * @param {string} the name or property of the meta elements
 * @return {array} list of contents from the matching elements
 */
Adhese.prototype.Helper.prototype.getMetaContent = function(meta_name) {
	var meta_elements = document.getElementsByTagName("META");
	var meta_contents = [];
	for (var i = meta_elements.length - 1; i >= 0; i--){
		var meta_element = meta_elements[i];
		if(meta_element && (meta_element.name === meta_name || meta_element.getAttribute("property") === meta_name) && meta_element.content){
			meta_contents.push(meta_element.content);
		}
	}
	return meta_contents;
};

/**
 * Function to check if an element is visible or not
 * @param {string} the id from the element to be checked or the element itself
 * @return {boolean} true if visible, false if not
 */
 Adhese.prototype.Helper.prototype.adhElementInViewport = function(element) {
  return this.adhElementInViewportWithPercentage(element, 1.0);
};

/**
 * Function to check if an element is visible or not
 * @param {string} the id from the element to be checked or the element itself
 * @param {float} the percentage of container that needs to be visible to return true, set as a floating point number between 1.0 and 0.0
 * @return {boolean} true if visible, false if not
 */
Adhese.prototype.Helper.prototype.adhElementInViewportWithPercentage = function (element, w, h, percentage) {
    if (typeof element == "string") {
        element = document.getElementById(element);
    }
    if (element) {
        var rect = element.getBoundingClientRect();
        var calY = rect.top + h * percentage;
        var calX = rect.left + w * percentage;
        return rect.top >= 0 && rect.left >= 0 && calY <= (window.innerHeight || document.documentElement.clientHeight) && calX <= (window.innerWidth || document.documentElement.clientWidth);
    } else {
        return false;
    }
};
