/**
 * @class
 * This class contains the main Adhese object used for most implementations of Adhese on webpages.
  */
 function Adhese() {
 	this.config = {debug:false};
 	this.request = {};
 	this.requestExtra = [];
 	this.ads = [];
 	this.that = this;
 	this.helper = new this.Helper();
 	this.detection = new this.Detection();
 	return this;
 }

/**
 * Initializes the object. Resets all saved objects.
 * This method should be called at least just after creation of the Adhese object.
 * In most cases re-initialization is not needed, but depending on your implementation,
 * it is available by simply calling init on an existing instance of Adhese.
 * The method will check if jQuery is available, and if so, make it available for ad templates as well.
 *
 * @param {object} options An object that contains properties defined by your Adhese implementation
 * @param {boolean} options.debug for setting debug logging, not intended for production use
 * @param {string} options.account the identification of your Adhese account, available through the support portal.
 * @param {string} options.host (optional) the host of your adhese account, available in your support account
 * @param {string} options.poolHost (optional) the host of your CDN
 * @param {string} options.location  can be either a string containing the actual location to be passed to the adserver or a function to be called to retrieve the location
 * @param {boolean} options.safeframe true/false, for switching on the use of the IAB SafeFrame standard, the default value is false
 * @param {boolean} options.safeframeContainerID string containing the object property of Ad to be used as id for the safeframe container
 * @param {boolean} options.referrer true/false, for adding the document.referrer to the req as a base64 string, the default value is true
 * @param {boolean} options.url true/false, for adding the window.location.href to the req as a base64 string, the default value is true
 * @return {void}
 */
 Adhese.prototype.init = function(options) {
 	this.config.debug = options.debug;
  	this.helper.log("Adhese: initializing...");

 	this.config.jquery =  typeof jQuery !== 'undefined';

 	if (options.account) {
 		this.config.account = options.account;
 		var protocol = "http:";
 		if (window.location.protocol != "file:") {
 			protocol = window.location.protocol;
		}
		if (!options.prefixVersion || (options.prefixVersion && options.prefixVersion==1)) {
			this.config.host = protocol + "//ads-" + options.account + ".adhese.com/";
			this.config.poolHost = protocol + "//pool-" + options.account + ".adhese.com/";
			this.config.clickHost = protocol + "//click-" + options.account + ".adhese.com/";
		} else if (options.prefixVersion && options.prefixVersion==2) {
			this.config.host = protocol + "//ads-" + options.account + ".adhese.com/";
			this.config.poolHost = protocol + "//pool-" + options.account + ".adhese.com/";
			this.config.clickHost = protocol + "//ads-" + options.account + ".adhese.com/";
		} 
 		 
		 this.config.previewHost = "https://" + options.account + "-preview.adhese.org/";
 		this.config.hostname = undefined;
 	} else if (options.host && options.poolHost) {
		this.config.host = options.host;
		this.config.clickHost = options.host;
		this.config.poolHost = options.poolHost;
 		//make anchor to extract some info about domain
 		var adHost = document.createElement("a");
		adHost.href = this.config.host;
		this.config.hostname = adHost.hostname;
 	}

	if (options.previewHost) {
		this.config.previewHost = options.previewHost;
	}

 	if (options.location && typeof options.location=="function"){
 		this.config.location = options.location();
     	this.helper.log('options.location=="function"')
 	} else if (options.location && typeof options.location=="string"){
 		this.config.location = options.location;
     	this.helper.log('options.location=="string"')
  } else {
    	this.config.location = 'testlocation'
	}
	
	if (options.viewabilityTracking) {
			this.config.viewabilityTracking = options.viewabilityTracking
	} else {
			this.config.viewabilityTracking = false;
	}

 	if (typeof options.safeframe == 'undefined' || options.safeframe == false) {
 		this.config.safeframe = false;
 	} else {
		  this.config.safeframe = options.safeframe;
		  this.initSafeFrame(options.safeframeContainerID);
	 }
	 this.config.logSafeframeMessages = options.safeframeMsg || this.logSafeframeMessages;

 	this.registerRequestParameter('rn', Math.round(Math.random()*10000));
  	if(typeof(Fingerprint) === "function"){
      	this.registerRequestParameter('fp', new Fingerprint({canvas: true}).get());
  	}
	this.registerRequestParameter('pr', (window.devicePixelRatio || 1));
	if (typeof options.referrer == 'undefined' || options.referrer == true) {
		this.registerRequestParameter('re', this.helper.base64.urlencode(document.referrer.substr(0, 200)));
	}
	if (typeof options.url == 'undefined' || options.url == true) {
		this.registerRequestParameter('ur', this.helper.base64.urlencode(window.location.href));
	}
 	this.userAgent = this.helper.getUserAgent();
	for (var p in this.userAgent) {
 		this.registerRequestParameter('br', this.userAgent[p]);
 	}
  	if(typeof(this.Detection) === "function"){
      	this.registerRequestParameter('dt', this.detection.device());
      	this.registerRequestParameter('br', this.detection.device());
  	}
    this.config.previewExclusive = false;
    if(options.previewExclusive) this.config.previewExclusive = options.previewExclusive;
	this.checkPreview();
	this.checkAdheseInfo();
    if(this.checkVisible){
        addEventListener("load", this.checkVisible.bind(this), false);
        addEventListener("scroll", this.checkVisible.bind(this), false);
    }

 	this.helper.log('Adhese: initialized with config:', JSON.stringify(this.config));
 };

Adhese.prototype.initSafeFrame = function(safeframeContainerID) {
	if (!this.safeframe) {
		if (safeframeContainerID) {
			this.safeframe = new this.SafeFrame(this.config.poolHost, safeframeContainerID, this.config.viewabilityTracking,this.config.logSafeframeMessages, this.helper);	
		} else {
			this.safeframe = new this.SafeFrame(this.config.poolHost, this.config.viewabilityTracking, this.config.logSafeframeMessages, this.helper);
		}		
	}	
}

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
 * Function to remove a parameter from an Adhese instance.
 * @param  {string} key   the prefix for this target
 * @param  {string} value the value to be removed
 * @return {void}
 */

Adhese.prototype.removeRequestParameter = function(key, value) {
	var v = this.request[key];
    if (v){
        var index = v.indexOf(value);
        if(index != -1) v.splice(index,1);
    }
};

Adhese.prototype.getBooleanConsent = function() {
	try {
		return this.request.tl[0];
	} catch(e) {
		return 'none';
	}
}

/**
 * Function to add a string to an Adhese instance. This string will be appended to each request.
 * @param  {string} value the string to be added
 * @return {void}
 */
Adhese.prototype.addRequestString = function(value) {
    this.requestExtra.push(value);
};

/**
 * The tag function is the default function to be called from within an ad container.
 * It requires at least the formatCode parameter.
 * The function creates an Ad object
 * @param  {string} formatCode Contains the format code as defined in Adhese
 * @param  {object} options An object containing the configuration of the Adhese.Ad object to be created. See Adhese.Ad documentaion for a full list of options.
 * @return {object}	The newly created Ad object.
 */
 Adhese.prototype.tag = function(formatCode, options) {
	var that = this;
 	this.helper.log(formatCode, JSON.stringify(options));

	// if safeframe, check and init
	if (options && options.safeframe) {
		if (options.safeframeContainerID) {
			this.initSafeFrame(options.safeframeContainerID);
		} else {
			this.initSafeFrame();
		}
	}

  	var ad = new this.Ad(this, formatCode, options);
	 	
	if (this.previewActive) {
		var pf = this.previewFormats
	   for (var key in pf) {
		   if (key  == formatCode + (options.position?options.position:"")) {
			   var previewformat = pf[formatCode + (options.position?options.position:"")];
			   // create Ad for preview
			   var previewAd = new this.Ad(this, formatCode, options);
			   previewAd.adType = formatCode;
			   previewAd.ext = "js";
			   var previewJsonRequest = "";
			   if(!previewAd.options.write)previewJsonRequest = "json/";
			   previewAd.swfSrc = that.config.previewHost + "/creatives/preview/"+previewJsonRequest+"tag.do?id=" + previewformat.creative + "&slotId=" + previewformat.slot;
			   previewAd.width = previewformat.width;
			   previewAd.height = previewformat.height;
			   ad = previewAd;
			   if (document.readyState === 'complete') {
				   this.showPreviewSign();
			   } else {
				   addEventListener("load", that.showPreviewSign.bind(that));
			   }
		   }
	   }
	}
	 
 	this.ads.push([formatCode, ad]);
 	if (ad.options.write) {
        if(this.config.previewExclusive == false || (this.config.previewExclusive == true && ad.swfSrc)){
            this.write(ad);
        }     
 	}
 	return ad;
 };

/**
 * Executes a document.write and creates a script tag when called.
 * The script tag requests a javascript advertisement from the server.
 * @param  {object} ad The Ad object instance to be written to the document.
 * @return {void}
 */
 Adhese.prototype.write = function(ad) {
 	if (this.config.safeframe || ad.safeframe) {
 		var adUrl = "";
 		if (this.previewActive && ad.swfSrc) {
 			adUrl = ad.swfSrc;
 		} else {
 			adUrl = this.getRequestUri(ad, {'type':'json'});
 		}

		this.helper.log('Adhese.write: request uri: ' + adUrl + ', safeframe enabled');

		var safeframeContainerID = this.safeframe.containerID;
 		AdheseAjax.request({
    		url: adUrl,
    		method: 'get',
    		json: true
		}).done(function(result) {
			adhese.safeframe.addPositions(result);
			for (var i = result.length - 1; i >= 0; i--) {
				adhese.safeframe.render(result[i][safeframeContainerID]);
    		};
		});

 	} else {

 		var adUrl = "";
 		if (this.previewActive && ad.swfSrc) {
 			adUrl = ad.swfSrc;
 		} else {
 			adUrl = this.getRequestUri(ad, {'type':'js'});
 		}

 		this.helper.log('Adhese.write: request uri: ' + adUrl);
 		document.write('<scri'+'pt type="text/javascript" src="' + adUrl + '"></scr'+'ipt>');
 	}
 };

/**
 * Creates an invisible pixel in the document that sends a request to Adhese for tracking an impression or action.
 * @param  {string} uri The URI used for tracking.
 * @return {void}
 */
Adhese.prototype.track = function(uri) {
	this.helper.addTrackingPixel(uri);
};

Adhese.prototype.trackByUrl = function (uri) {
  this.helper.addTrackingPixel(uri);
};

/**
 * render the markup for the given ad and fire of a "paid impression" tracker
 */
Adhese.prototype.renderAndTrackAd = function(ad) {
    this.safeframe.render(ad.containingElementId);
    AdheseAjax.request({
        url: ad.tracker,
        method: "get"
    });
};

/**
 * This function can be used to create a request for several slots at once. For each ad object passed, a sl part is added to the request. The target parameters are added once.
 * @param  {Ad[]} adArray An array of Ad objects that need to be included in the URI
 * @param  {object} options Possible options: type:'js'|'json'|'jsonp', when using type:'jsonp' you can also provide the name of a callback function callback:'callbackFunctionName'. Type 'js' is the default if no options are given. Callback 'callback' is the default for type 'jsonp'
 * @return {string}         The URI to be used to retrieve an array of ads.
 */
Adhese.prototype.getMultipleRequestUri = function(adArray, options) {
	var uri = this.config.host;
 	if (!options) options = {'type':'js'};

 	// add prefix depending on request type
 	switch(options.type) {
	 	case 'json':
	 	uri += 'json/';
	 	break;

	 	case 'jsonp':
	 	if (!options.callbackFunctionName) options.callbackFunctionName = 'callback';
	 	uri += 'jsonp/' + options.callbackFunctionName + '/';
	 	break;

	 	default:
	 	uri += 'ad/';
	 	break;
	}

	 // add an sl clause for each Ad in adArray
	for (var i = adArray.length - 1; i >= 0; i--) {
		var ad = adArray[i];
		if (!ad.swfSrc || (ad.swfSrc && ad.swfSrc.indexOf('preview') == -1)){
			uri += "sl" + this.getSlotName(ad) + "/";
		}
    }

	for (var a in this.request) {
		var s = a;
		for (var x=0; x<this.request[a].length; x++) {
			s += this.request[a][x] + (this.request[a].length-1>x?';':'');
		}
		uri += s + '/';
	}

	for (var i = 0, a = this.requestExtra; i < a.length; i++) {
        if (a[i]) {
            uri += a[i] + "/";
        }
    }
	uri += '?t=' + new Date().getTime();
	return uri;
};

/**
 * Function that translates array opf ads and target parameters into a payload object for use in a POST request to the ad endpoint
 * @param  {Ad[]} adArray An array of Ad objects that need to be included in the URI
 * @param {object} options	options object
 * @param {object} options.vastContentAsUrl	set to false if you want to receive VAST markup inline, if set to true, response contains a url to retrieve the VAST markup (default true)
 * @return {object}         Object in the Adhese payload structure
 */
Adhese.prototype.getRequestPayload = function(adArray, options) {
	
	let slots = [];
	for (var i = adArray.length - 1; i >= 0; i--) {
		var ad = adArray[i];
		if (!ad.swfSrc || (ad.swfSrc && ad.swfSrc.indexOf('preview') == -1)){
			slots.push({
				"slotname": this.getSlotName(ad),
				"parameters": ad.parameters
			});
		}
	}

	let commonParams = {};
	for (var a in this.request) {
		var values = [];
		for (var x=0; x<this.request[a].length; x++) {
			values.push(this.request[a][x]);
		}
		commonParams[a] = values;
	}
	
	let payload = {
		"slots": slots,
		"parameters": commonParams,
		"vastContentAsUrl": (options && options.vastContentAsUrl ? options.vastContentAsUrl : true)
	 };
	 return payload;
};

/**
 * Returns the slot name for this ad
 *
 * @param {Ad} ad the Ad instance whose uri is needed
 * @return {string}
 */
Adhese.prototype.getSlotName = function(ad) {
	if(ad.options.position && ad.options.location) {
		u = ad.options.location + ad.options.position;
	} else if(ad.options.position) {
		u = this.config.location + ad.options.position;
	} else if (ad.options.location) {
		u = ad.options.location;
	} else {
		u = this.config.location;
	}
	return u  + "-" + ad.format;	
}

/**
 * Returns the uri to execute the actual request for this ad
 *
 * @param {Ad} ad the Ad instance whose uri is needed
 * @param {object} options Possible options: type:'js'|'json'|'jsonp', when using type:'jsonp' you can also provide the name of a callback function callback:'callbackFunctionName'. Type 'js' is the default if no options are given. Callback 'callback' is the default for type 'jsonp'
 * @return {string}
 */
Adhese.prototype.getRequestUri = function(ad, options) {
    if(options.preview  && options.preview == true){
       return ad.swfSrc;
    }else{
        var adArray = [ ad ];
        return this.getMultipleRequestUri(adArray, options);
    }

};

/**
 * Generic syn method that passes the option object to the internal synching method for each known network.
 * @param  {string} network        String to select the correct network. Current options: "rubicon"
 * @param  {object} identification Account identification with the selected network. See network-specific methods elsewhere in this doc.
 * @return {void}
 */
 Adhese.prototype.syncUser = function(network, identification) {
 	if (network=="rubicon") {
 		this.rubiconUserSync(identification);
 	} else if (network=="improvedigital") {
		this.improvedigitalUserSync(identification);
	} else if (network=="pubmatic") {
        this.pubmaticUserSync(identification);
    } else if (network=="spotx") {
        this.spotxUserSync(identification);
    } else if (network=="appnexus") {
        this.appnexusUserSync(identification);
    } else if (network=="smartadserver") {
        this.smartadserverUserSync(identification);
    } else if (network=="multi") {
        this.multiUserSync(identification);
    }
 };
/**
 * This function can be used in a SafeFrame implementation to create a preview request and write out the result.
 * @param  {Ad[]} adArray An array of Ad objects that need to be included in the URI
 */
 Adhese.prototype.getSfPreview = function(sf_array){
     var adhSelf = this;
     for (var i = sf_array.length - 1; i >= 0; i--) {
         var ad = sf_array[i];
         if(ad.swfSrc && ad.swfSrc.indexOf('tag.do') > -1){
             AdheseAjax.request({
                 url: adhSelf.getRequestUri(ad, {'type':'json','preview':true}),
                 method: 'get',
                 json: true
             })
             .done(function(result) {
                 adhSelf.safeframe.addPositions(result);
                 for (var i = result.length - 1; i >= 0; i--) {
                     adhSelf.safeframe.render(result[i].adType);
                 };
             });
         }
    }
 };
/**
 * This function can be used in a SafeFrame implementation to create a request for several slots at once and write out the result. For each ad object passed, a sl part is added to the request. The target parameters are added once.
 * @param  {Ad[]} adArray An array of Ad objects that need to be included in the URI
 */
 Adhese.prototype.getSfAds = function(sf_array){
     var adhSelf = this;
     AdheseAjax.request({
         url: adhSelf.getMultipleRequestUri(sf_array, {'type':'json'}),
         method: 'get',
         json: true
     }).done(function(result){
         adhSelf.safeframe.addPositions(result);
         for(var i = result.length-1; i >= 0; i--){
             adhSelf.safeframe.render(result[i].adType);
         }
     });
     adhSelf.getSfPreview(sf_array);
 };


/**
 * This function is used for saving requests in a prebid environment
 * @param  {string} key        The format uid used for this ad
 * @param  {object} identification The Ad object
 * @return {void}
 */
Adhese.prototype.registerResponse = function(key, ad) {
	if (!adhese.responses) {
      adhese.responses = new Object();
    }
	adhese.responses[key] = ad;
}

/**
 * This function is used in Safeframe implementations to catch messages originating from Safeframe containers with requests for functionality
 * @param  {string} id   Saframe container ID
 * @param  {string} type Functionality type
 * @param  {string} data Functionality data
 * @return {void}
 */
Adhese.prototype.logSafeframeMessages = function(id,status,data) {
	this.helper.log(id,status,data);
}

/**
* This function is used for viewability measurement and makes use of the IntersectionObserver API. Default settings are based on IAB.
* @param  {object} target   Object to which we will add the observer. Can be the safeframe object or another one.
* @param  {object} settings Viewability settings such as duration and in view percentage. When set to true, default IAB settings will be used.
*/
Adhese.prototype.enableViewabilityTracking = function (target, settings) {

	target.viewability = {
		contentBox: document.querySelector("body"),
		trackers: {},
		trackerTimeout: 0
	}

	observerOptions = {
		root: null,
		rootMargin: "0px",
		threshold: []
	};

	if (typeof settings === 'object' && settings !== null) {
		settings.inViewPercentage ? observerOptions.threshold.push(settings.inViewPercentage) : observerOptions.threshold.push(0.5);
		if (settings.rootMargin) {
			observerOptions.rootMargin = settings.rootMargin;
		}		
		target.viewability.trackerTimeout = settings.duration && settings.duration !== '' ? settings.duration : 1;
		target.viewability.inViewPercentage = observerOptions.threshold[observerOptions.threshold.length-1];
	} else {
		observerOptions.threshold.push(0.5);
		target.viewability.trackerTimeout = 1;
		target.viewability.inViewPercentage = observerOptions.threshold[observerOptions.threshold.length-1];
	}

	target.viewability.intersectionCallback = function (entries) {
		entries.forEach(function (entry) {
			var adBox = entry.target;
			if (entry.isIntersecting) {
				if (entry.intersectionRatio >= target.viewability.inViewPercentage && target.viewability.trackerTimeout > 0) {
					adBox.timerRunning = true;
					adBox.timer = window.setTimeout(function () {
						target.viewability.adObserver.unobserve(adBox);
						if (target.viewability.trackers[adBox.id]) {
							var tracker = document.createElement("img");
							tracker.src = target.viewability.trackers[adBox.id];
							tracker.style.height = "1px";
							tracker.style.width = "1px";
							tracker.style.margin = "-1px";
							tracker.style.border = "0";
							tracker.style.position = "absolute";
							tracker.style.top = "0";
							document.body.appendChild(tracker);
						}						
					}, target.viewability.trackerTimeout * 1000);
				} else if (entry.intersectionRatio >= target.viewability.inViewPercentage) {
					target.viewability.adObserver.unobserve(adBox);
					if (target.viewability.trackers[adBox.id]) {
						var tracker = document.createElement("img");
						tracker.src = target.viewability.trackers[adBox.id];
						tracker.style.height = "1px";
						tracker.style.width = "1px";
						tracker.style.margin = "-1px";
						tracker.style.border = "0";
						tracker.style.position = "absolute";
						tracker.style.top = "0";
						document.body.appendChild(tracker);
					}
				} 
			} else if (adBox.timerRunning) {
					window.clearTimeout(adBox.timer);
					adBox.timerRunning = false;
			}
		});
	}
	target.viewability.adObserver = new IntersectionObserver(target.viewability.intersectionCallback, observerOptions);
};
