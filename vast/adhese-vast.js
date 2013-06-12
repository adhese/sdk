// vast linear ads for html/js
// http://www.iab.net/media/file/VASTv3.0.pdf

function AdheseVastWrapper() {
	
}

AdheseVastWrapper.prototype.init = function() {
	this.eventListeners = new Array(); // stores registered event listeners
	this.trackedImpressions = new Array(); // stores fired impressions, to prevent multiple impression tracking (some players might simply listen to "playing" events)
	this.schedule = {};
	this.helper = new AdheseVastHelper();
};

AdheseVastWrapper.prototype.requestAds = function(inHost, inPath) {
	this.currentScript = null;  
    var newScript = document.createElement("script");
    newScript.type = "text/javascript";  
    newScript.src = inHost + "/jsonp/a.parseVastJson" + inPath + (inPath.indexOf("?")+1 ? "&" : "?") + "t=" + new Date().getTime();
    if(this.currentScript) head.removeChild(currentScript);
    document.getElementsByTagName("head")[0].appendChild(newScript);     
}

AdheseVastWrapper.prototype.parseVastJson = function(inJson) {
	var xml = this.parseXML(inJson[0].tag);
	//console.log(xml.getElementsByTagName("Ad"));
		
	var ads = xml.getElementsByTagName("Ad");
	for (var i=0; i<ads.length; i++) {
		// get one or more mediafiles
		var mediafiles = new Array();
		var mf = ads[i].getElementsByTagName("MediaFile");
		for (var j=0; j<mf.length; j++) {
			mediafiles.push(
				new AdheseVastMediaFile(
					mf[j].firstChild.nodeValue,
					mf[j].attributes.getNamedItem("type").nodeValue
				)
			);
		}

		//get on or more impression trackers
		var impression = new Array();
		var im = ads[i].getElementsByTagName("Impression");
		for (var j=0; j<im.length; j++) {
			impression.push(im[j].firstChild.nodeValue);	
		}
		
		// insert the AdheseVastAd object in the schedule array using the ad's id as index to allow the palyer to retrieve it by id (as requested)
		console.log(ads[i].attributes.getNamedItem("id").nodeValue);
		this.schedule[ads[i].attributes.getNamedItem("id").nodeValue] = new AdheseVastAd(
			ads[i].attributes.getNamedItem("id").nodeValue,
			mediafiles,
			ads[i].getElementsByTagName("Duration")[0].firstChild.nodeValue,
			impression,
			this.helper.getDurationInSeconds(ads[i].getElementsByTagName("Duration")[0].firstChild.nodeValue)
		);
		console.log(this.schedule);
	}
	this.fireAdsLoaded();
};

AdheseVastWrapper.prototype.parseXML = function(inXml) {
	console.log(typeof window.DOMParser);
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

//player can register as listener for ADS_LOADED
AdheseVastWrapper.prototype.addEventListener = function(event, listener) {
	this.eventListeners.push(
		new AdheseVastEventListener(event, listener)
	);
};

AdheseVastWrapper.prototype.fireAdsLoaded = function() {
	for (var i=0; i<this.eventListeners.length; i++) {
		if (this.eventListeners[i].getEvent()=="ADS_LOADED") {
			console.log("ADS_LOADED sent to listener");
			this.eventListeners[i].getListener().apply();
		}
	}
};

// ad schedule is available before display, it contains the id's of the active ads, as requested, only active ads are returned, if no ads, an empty array is returned
AdheseVastWrapper.prototype.getSchedule = function() {
	var arr = new Array();
	for (var name in this.schedule) {
		arr.push(name);
	}
	return arr;
};

AdheseVastWrapper.prototype.hasAd = function(adId) {
	return this.schedule[adId]!=undefined;
};

AdheseVastWrapper.prototype.getImpression = function(adId) {
	return this.schedule[adId].getImpression();	
};

AdheseVastWrapper.prototype.getMediafile = function(adId, type) {
	var mf = this.schedule[adId].getMediafile();
	for (var y=0; y<mf.length; y++) {
		if (mf[y].getType() == type)
		return mf[y].getSrc();
	}
	return undefined;
};

AdheseVastWrapper.prototype.getDuration = function(adId) {
	console.log("getDuration " + adId);
	return this.schedule[adId].getDuration();	
};

// whenever a player shows an ad, it should call it's Impressions uri
AdheseVastWrapper.prototype.track = function(uri) {
	for (var x=0; x<uri.length; x++) {
		// add uri to tracked, if already exists, do not track again
		if (!this.trackedImpressions[uri[x]]) {
			this.trackedImpressions[uri[x]] = 1;
			var i = document.createElement("img");
			i.src = uri[x] + ((uri[x].indexOf("?")==-1?"?adhche=":"&adhche=") + new Date().getTime());
		}		
	}	
};

AdheseVastWrapper.prototype.timeupdate = function(adId, currentTime) {
	//console.log(adId + " timeupdate @" + currentTime + " sec.");
	// at start, log an impressions
	if (currentTime==0) {
		console.log("Tracking impression for " + adId);
		this.track(this.getImpression(adId));
	} else {
		var perc = currentTime / this.schedule[adId].getDurationInSeconds();
		if (perc.toFixed(2)==0.25) {
			// first quartile reached, this will be reached probably twice due to rounding
			// but unique tracker uri's will only be called once in the AdheseVastWrapper.track function
			// so we let it simply happen
			console.log("Tracking first quartile for " + adId);
		} else if (perc.toFixed(2)==0.50) {
			//mid point reached
			console.log("Tracking mid point for " + adId);
		} else if (perc.toFixed(2)==0.75) {
			//third quartile
			console.log("Tracking third quartile for " + adId);
		}
	}
};

AdheseVastWrapper.prototype.clicked = function(adId) {
	console.log("tracker clicked for " + adId);
	console.log("open new window with VideoClicks>ClickThrough");
};

AdheseVastWrapper.prototype.ended = function(adId, currentTime) {
	console.log(adId + " ended @" + currentTime);
	console.log("tracker complete for " + adId);
};


// AdheseVastAd
function AdheseVastAd(inId, inMediaFile, inDuration, inImpression, inDurationInSeconds) {
	this.id = inId;
	this.mediafile = inMediaFile;
	this.duration = inDuration;
	this.impression = inImpression;
	this.durationInSeconds = inDurationInSeconds;
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



// AdheseVastHelper
function AdheseVastHelper() {

}

// duration should be of format hh:mm:ss, fallbacks for mm:ss and ss
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






