/**
 * @class
 * The Adhese Vast JS library is meant to ease the integration of VAST (2.0 & 3.0) ads in video players.
 * It contains cross-domain safe methods for requesting ads from your adhese account as well as convenience methods for playing and tracking the ads.
 * It is however not a player on its own and it does not insert anything in the DOM.
 * This implementation is based on the requirements as defined in {@link http://www.iab.net/media/file/VASTv3.0.pdf}.
 * AdheseVastWrapper is the main object through which you will request ads and access the response.
 * @example
 * var wrapper = new AdheseVastWrapper();
 * @param {boolean} debug true for debug mode
 */
function AdheseVastWrapper(inDebug) {
	this.debug = inDebug!=undefined?inDebug:false;
}

/**
 * Needs to be called after constructing or whenever you want to start your use of the wrapper all over again.
 * Resets listeners, trackers and scheduled ads.
 * @example
 * wrapper.init();
 * @return {void}
 */
AdheseVastWrapper.prototype.init = function() {
	this.eventListeners = new Array(); // stores registered event listeners
	this.trackedImpressions = new Array(); // stores fired impressions, to prevent multiple impression tracking (some players might simply listen to "playing" events)
	this.schedule = {};
	this.helper = new AdheseVastHelper();
};

/**
 * Gets ads from Adhese account at given host for location and given array of formats. Fires ADS_LOADED event when finished. See {@link AdheseVastWrapper#addEventListener}
 * @example
 * wrapper.requestAds("http://ads.demo.adhese.com", "_test_", ["preroll","postroll"]);
 * @param  {string} host     The protocol and host of your Adhese account
 * @param  {string} location The location indentification for the Ad position you are requesting.
 * @param  {Array.<String>} formats  An array of strings containing the identification of the formats you want to request. These strings will be used as id for accessing scheduled Ad's properties.
 * @return {void}
 */
AdheseVastWrapper.prototype.requestAds = function(inHost, inLocation, inFormats) {
	var uri = inHost + "/jsonp/a.parseVastJson";
	for (var f in inFormats) {
		uri += "/sl" + inLocation + "-" + inFormats[f];
	}
	uri += "/?t=" + new Date().getTime();

	var newScript = document.createElement("script");
    newScript.type = "text/javascript";
    newScript.src = uri;
    document.getElementsByTagName("head")[0].appendChild(newScript);
}

AdheseVastWrapper.prototype.parseInLine = function(ad) {
	// get one or more mediafiles
	var mediafiles = new Array();
	var mf = ad.getElementsByTagName("MediaFile");
	for (var j=0; j<mf.length; j++) {
		mediafiles.push(
			new AdheseVastMediaFile(
				mf[j].firstChild.nodeValue,
				mf[j].attributes.getNamedItem("type").value
			)
		);
	}

	//get on or more impression trackers
	var impression = new Array();
	var im = ad.getElementsByTagName("Impression");
	for (var j=0; j<im.length; j++) {
		impression.push(im[j].firstChild.nodeValue);
	}

	//get Trackers and add to object, attribute is event name
	var trackers = new Object();
	var tr = ad.getElementsByTagName("Tracking");
	for (var j=0; j<tr.length; j++) {
		// add this uri to the array for this event
		if (!trackers[tr[j].attributes.getNamedItem("event").nodeValue]) trackers[tr[j].attributes.getNamedItem("event").value] = new Array();
		trackers[tr[j].attributes.getNamedItem("event").nodeValue].push(tr[j].firstChild.nodeValue);
	}

	// get ClickTracking uri's and add them to the tracking array as well, with the event name "click"
	var ctr = ad.getElementsByTagName("ClickTracking");
	for (var j=0; j<tr.length; j++) {
		// add this uri to the array for this event
		if (!trackers["click"]) trackers["click"] = new Array();
		if (ctr[j] && ctr[j].firstChild.nodeValue && ctr[j].firstChild.nodeValue!="") {
			trackers["click"].push(ctr[j].firstChild.nodeValue);
		}
	}

	//get ClickThrough
	var click = "";
	var ci = ad.getElementsByTagName("ClickThrough");
	for (var j=0; j<ci.length; j++) {
		click = ci[j].firstChild.nodeValue;
	}

	// insert the AdheseVastAd object in the schedule array using the ad's id as index to allow the palyer to retrieve it by id (as requested)
	// id is replaced by code in the advar template so a change has to be made here too
	// console.log(ads2);
	var code = '';//ad.attributes.getNamedItem("code") ? ad.attributes.getNamedItem("code").nodeValue : "preroll";
	if (ad.attributes.getNamedItem("id") && isNaN(ad.attributes.getNamedItem("id").nodeValue)) {
		code = ad.attributes.getNamedItem("id").nodeValue;
	}else if (ad.attributes.getNamedItem("code")) {
		code = ad.attributes.getNamedItem("code").nodeValue;
	} else {
		code = 'preroll';
	}
	if (this.debug) console.log(code);
	var durationTag = ad.getElementsByTagName("Duration")[0].firstChild,
	duration;
	if(durationTag !== null) {
		duration = ad.getElementsByTagName("Duration")[0].firstChild.nodeValue;
	}else {
  	duration = 0;
	}
	this.schedule[code] = new AdheseVastAd(
		code,
		mediafiles,
		duration,
		impression,
		this.helper.getDurationInSeconds(duration),
		trackers,
		click
	);
	if (this.debug) console.log(this.schedule);
}

AdheseVastWrapper.prototype.parseVastJson = function(inJson) {
	var xml = this.parseXML(inJson[0].tag);
	var ads = xml.getElementsByTagName("Ad");
	var that = this;
	if(ads.length === 0) {
		this.fireAdsLoaded();
		return;
	}
	for (var i=0; i<ads.length; i++) {
		// InLine ads, parse and execute
		if (ads[i].getElementsByTagName("InLine").length>0) {
			this.parseInLine(ads[i]);
			this.fireAdsLoaded();
		}
		else { // Wrapper ads, need to be executed to get the xml
			var code = '';//ads[i].attributes.getNamedItem("code").nodeValue;
			var ad = ads[i];
			if (ad.attributes.getNamedItem("id") && isNaN(ad.attributes.getNamedItem("id").nodeValue)) {
				code = ad.attributes.getNamedItem("id").nodeValue;
			}else if (ad.attributes.getNamedItem("code")) {
				code = ad.attributes.getNamedItem("code").nodeValue;
			} else {
				code = 'preroll';
			}

			var impressionNodes = ad.getElementsByTagName("Impression");

			AdheseAjax.request({
	    		url: ads[i].getElementsByTagName("VASTAdTagURI")[0].firstChild.nodeValue,
	    		method: 'get',
	    		json: false
			})
			.done(function(result) {
	    		var xml2 = that.parseXML(result);
	    		var ads2 = xml2.getElementsByTagName("Ad");
	    		for (var j=0; j<ads2.length; j++) {
	    			ads2[j].setAttribute("code", code);
	    			for (var z=0; z<impressionNodes.length; z++) {
	    				ads2[j].getElementsByTagName("InLine")[0].insertBefore(impressionNodes[z], ads2[j].getElementsByTagName("Impression")[0]);
	    			}
	    			if (ads2[j].getElementsByTagName("InLine").length>0) {
	    				that.parseInLine(ads2[j]);
					} else {
						if (that.debug) console.log("Too many redirects");
					}
	    		}
	    		that.fireAdsLoaded();
			});
		}
	}
};

AdheseVastWrapper.prototype.parseXML = function(inXml) {
	if (this.debug) console.log(typeof window.DOMParser);
	if (typeof window.DOMParser != "undefined") {
	    return ( new window.DOMParser() ).parseFromString(inXml, "text/xml");
	} else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
	    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
	    xmlDoc.async = "false";
	    xmlDoc.loadXML(inXml);
	    return xmlDoc;
	} else {
	    return undefined;
	}
};

/**
 * Add a listener for the "ADS_LOADED" event.
 * Every time you perform a call to requestAds, the event will be fired and you will be able to handle the Ads through your callback function.
 * @example
 * wrapper.addEventListener("ADS_LOADED", yourPlayerInstance.yourCallBackFunction);
 * @param  {string} event    The name of the event. "ADS_LOADED" is currently the only option.
 * @param  {function} callBackFunction The name of the function to be executed when the event is fired.
 * @return {void}
 */
AdheseVastWrapper.prototype.addEventListener = function(event, listener) {
	this.eventListeners.push(
		new AdheseVastEventListener(event, listener)
	);
};

/**
 * ADS_LOADED event. Fired whenever a request has been completed and the schedule array is ready.
 * Upon firing this event, all requested ads and their properties are available to the implementing player.
 * @event AdheseVastWrapper#ADS_LOADED
 * @type {object}
 */

/**
 * Fires the ADS_LOADED event.
 * @fires AdheseVastWrapper#ADS_LOADED
 */
AdheseVastWrapper.prototype.fireAdsLoaded = function() {
	for (var i=0; i<this.eventListeners.length; i++) {
		if (this.eventListeners[i].getEvent()=="ADS_LOADED") {
			if (this.debug) console.log("ADS_LOADED sent to listener");
			this.eventListeners[i].getListener().apply();
		}
	}
};

/**
 * Gets the format names of the scheduled ads. This function will only return a value of a request has been amde and the ADS_LOADED event has been fired. If there is no ad available for a requested format, no entry will be included in the schedule array.
 * @example
 * // request two formats: "preroll" and "postroll"
 * wrapper.requestAds("http://ads.demo.adhese.com", "_test_", ["preroll","postroll"]);
 * // from your callback het the schedule
 * var schedule = wrapper.getSchedule();
 * // if only one of the two ads is actually scheduled, the array contains only one item
 * // fi.: ["preroll"]
 * @return {Array.<String>} Returns array of strings containing the scheduled format codes.
 */
AdheseVastWrapper.prototype.getSchedule = function() {
	var arr = new Array();
	for (var name in this.schedule) {
		arr.push(name);
	}
	return arr;
};

/**
 * Checks if an Ad has been scheduled for a given format code.
 * @example
 * if (a.hasAd("preroll")) {
 * //do something
 * }
 * @param  {string} formatCode 	The format code for the requested ad.
 * @return {boolean}      		Returns true if an Ad has been scheduled.
 */
AdheseVastWrapper.prototype.hasAd = function(adId) {
	return this.schedule[adId]!=undefined;
};

/**
 * Gets the "Impression" URI for a scheduled Ad. The Impression URI is used for racking the initial start of the Ad.
 * You will normally not call this directly.
 * @param  {string} formatCode The format to identify the Ad.
 * @return {string}      Returns a string containing the URI for tracking a "VAST Impression Event".
 */
AdheseVastWrapper.prototype.getImpression = function(adId) {
	return this.schedule[adId].getImpression();
};

/**
 * Gets the "Click" target URI for handling a click on the player. This URI will also perform "VAST ClickThrough Tracking".
 * @param  {string} formatCode 	The format to identify the Ad.
 * @return {string}      		Returns a string containing the URI for tracking a "VAST ClickThrough".
 */
AdheseVastWrapper.prototype.getClick = function(adId) {
	return this.schedule[adId].getClick();
};

AdheseVastWrapper.prototype.getTrackers = function(adId) {
	return this.schedule[adId].getTrackers();
};

/**
 * Returns the URI for the ad's media actual media file. The media type parameter contains the actual mime type of the needed media file (eg: video/mp4, video/ogg).
 * @example
 * // create source element for video
 * var adSrc = document.createElement("source");
 * adSrc.src = wrapper.getMediafile("preroll","video/mp4");
 * adSrc.type = "video/mp4";
 * @param  {string} formatCode 	The format to identify the Ad.
 * @param  {string} type 		The mime type of the requested file.
 * @return {string}      		Returns the URI for the requested media type or undefined if no media type is available.
 */
AdheseVastWrapper.prototype.getMediafile = function(adId, type) {
	var mf = this.schedule[adId].getMediafile();
	for (var y=0; y<mf.length; y++) {
		if (mf[y].getType() == type)
		return mf[y].getSrc();
	}
	return undefined;
};

/**
 * Get the duration of a scheduled Ad.
 * @example
 * // display duration
 * infoContainer.innerHTML = "ad takes " + wrapper.getDuration("preroll") + " time, stay tuned";
 * @param  {string} formatCode 	The format to identify the Ad.
 * @return {string}      		Returns a string of format hh:mm:ss.
 */
AdheseVastWrapper.prototype.getDuration = function(adId) {
	return this.schedule[adId].getDuration();
};

/**
 * Get the duration of a scheduled ad in seconds.
 * @example
 * wrapper.getDurationInSeconds("preroll")
 * @param  {string} formatCode 	The format to identify the Ad.
 * @return {number}      		A positive integer number.
 */
AdheseVastWrapper.prototype.getDurationInSeconds = function(adId) {
	return this.schedule[adId].getDurationInSeconds();
};

AdheseVastWrapper.prototype.track = function(uri) {
	if (uri) {
		for (var x=0; x<uri.length; x++) {
			// add uri to tracked, if already exists, do not track again
			if (!this.trackedImpressions[uri[x]]) {
				this.trackedImpressions[uri[x]] = 1;
				var i = document.createElement("img");
				i.src = uri[x] + ((uri[x].indexOf("?")==-1?"?adhche=":"&adhche=") + new Date().getTime());
			}
		}
	}
};

/**
 * Callback function for player media event "timeupdate". This function will handle all tracking of impressions, progress, ... .
 * @example
 * // attach to timeupdate event for passing the currentTime, this allows adhese to track the actual viewing of the ad
 * adPlayer.addEventListener("timeupdate", function() { wrapper.timeupdate("preroll", adPlayer.currentTime); }, true);
 * @param  {string} formatCode 	The format to identify the Ad.
 * @param  {number} currentTime The current time of the player, in seconds.
 * @return {void}
 */
AdheseVastWrapper.prototype.timeupdate = function(adId, currentTime) {
	if (this.debug) console.log(adId + " timeupdate @" + currentTime + " sec.");
	// at start, log an impressions
	if (currentTime==0) {
		if (this.debug) console.log("Tracking impression for " + adId);
		this.track(this.getImpression(adId));
	} else {
		var perc = currentTime / this.schedule[adId].getDurationInSeconds();
		if (perc.toFixed(2)==0) {
			if (this.debug) console.log("Tracking start for " + adId);
			this.track(this.getTrackers(adId).start);
		} else if (perc.toFixed(2)==0.25) {
			// first quartile reached, this will be reached probably twice due to rounding
			// but unique tracker uri's will only be called once in the AdheseVastWrapper.track function
			// so we let it simply happen
			if (this.debug) console.log("Tracking first quartile for " + adId + " - " + this.getTrackers(adId).firstQuartile);
			this.track(this.getTrackers(adId).firstQuartile);
		} else if (perc.toFixed(2)==0.50) {
			//mid point reached
			if (this.debug) console.log("Tracking mid point for " + adId);
			this.track(this.getTrackers(adId).midpoint);
		} else if (perc.toFixed(2)==0.75) {
			//third quartile
			if (this.debug) console.log("Tracking third quartile for " + adId);
			this.track(this.getTrackers(adId).thirdQuartile);
		}
	}
};

/**
 * Callback function for "click" on player (or any container defined as clickable by you). This function will track the click and open a new window containing the click-through url of the ad.
 * @example
 * // clicks on video player should be sent to adhese for handling and reporting
 * adPlayer.addEventListener("click", function() { wrapper.clicked("preroll", adPlayer.currentTime); }, true);
 * @param  {string} formatCode 	The format to identify the Ad.
 * @param  {number} currentTime The current time of the player, in seconds.
 * @return {void}
 */
AdheseVastWrapper.prototype.clicked = function(adId, currentTime) {
	if (this.debug) console.log("tracker clicked for " + adId + " @" + currentTime);
	if (this.debug) console.log("open new window with VideoClicks>ClickThrough");
	this.helper.openNewWindow(this.getClick(adId));
	this.track(this.getTrackers(adId).click);
};

/**
 * Callback function for player media event "ended". This function will track completion of the ad.
 * @example
 * // when playing has ended, tell and adhese and than continue to showing content
 * adPlayer.addEventListener("ended", function() { wrapper.ended("preroll", adPlayer.currentTime);
 * @param  {string} formatCode 	The format to identify the Ad.
 * @param  {number} currentTime The current time of the player, in seconds.
 * @return {void}
 */
AdheseVastWrapper.prototype.ended = function(adId, currentTime) {
	if (this.debug) console.log(adId + " ended @" + currentTime);
	if (this.debug) console.log("tracker complete for " + adId);
	this.track(this.getTrackers(adId).complete);
};


function AdheseVastAd(inId, inMediaFile, inDuration, inImpression, inDurationInSeconds, inTrackers, inClick) {
	this.id = inId;
	this.mediafile = inMediaFile;
	this.duration = inDuration;
	this.impression = inImpression;
	this.durationInSeconds = inDurationInSeconds;
	this.trackers = inTrackers;
	this.click = inClick;
}

AdheseVastAd.prototype.getId = function() {
	return this.id;
};

AdheseVastAd.prototype.getMediafile = function() {
	return this.mediafile;
};

AdheseVastAd.prototype.getDuration = function() {
	return this.duration;
};

AdheseVastAd.prototype.getDurationInSeconds = function() {
	return this.durationInSeconds;
};

AdheseVastAd.prototype.getImpression = function() {
	return this.impression;
};

AdheseVastAd.prototype.getTrackers = function() {
	return this.trackers;
};

AdheseVastAd.prototype.getClick = function() {
	return this.click;
};


// AdheseVastMediaFile
function AdheseVastMediaFile(inSrc, inType) {
	this.src = inSrc;
	this.type = inType;
}

AdheseVastMediaFile.prototype.getSrc = function() {
	return this.src;
};

AdheseVastMediaFile.prototype.getType = function() {
	return this.type;
};



// AdheseVastEventListener
function AdheseVastEventListener(inEvent, inListener) {
	this.event = inEvent;
	this.listener = inListener;
}

AdheseVastEventListener.prototype.getEvent = function() {
	return this.event;
};

AdheseVastEventListener.prototype.getListener = function() {
	return this.listener;
};


/**
 * @class
 * Helper class for utility functions.
 */
function AdheseVastHelper() {

}

/**
 * Method to get the value in seconds of a string representing time in one of these formats: "hh:mm:ss", "mm:ss" or "ss".
 * @param  {string} timeAsString 	The time to convert as a string of format "hh:mm:ss", "mm:ss" or "ss".
 * @return {number}            		The value of the time in seconds or 0 if not a valid string.
 */
AdheseVastHelper.prototype.getDurationInSeconds = function(inDuration) {
	if (inDuration) {
		var d = inDuration.split(":");
		if (d.length==3) {
			return parseInt(d[0]*3600) + parseInt(d[1]*60) + parseInt(d[2]);
		} else if (d.length==2) {
			//assume mm:ss
			return parseInt(d[0]*60) + parseInt(d[1]);
		} else if (d.length==1) {
			//assume seconds
			return parseInt(d[0]);
		}
		return 0;
	}
	return 0;
};

/**
 * Method to open a new window ("_blank") from the DOM window object and give it focus.
 * If now window object is available, nothing happens.
 * @param  {string} uri The URI to be used as the location of the new window.
 * @return {void}
 */
AdheseVastHelper.prototype.openNewWindow = function(uri) {
	if (window) {
		var win = window.open(uri, '_blank');
	  	win.focus();
	}
};
