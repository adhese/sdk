 /**
 * @class
 * This file contains the SafeFrame object that makes the IAB Safeframe reference implementation available in the Adhese context.
 */
 Adhese.prototype.SafeFrame = function(poolHost, containerID, viewabilityTracking, messages, helper) {
	this.poolHost = poolHost;
	this.containerID = "adType";
	if (containerID) this.containerID = containerID;
	this.viewability = viewabilityTracking;
	if (this.viewability) Adhese.prototype.enableViewabilityTracking(this, this.viewability);
	this.adhesePositions = new Array();
	this.ads = [];
	this.logMessages = messages || '';
	this.helper = helper;
	return this.init();
 };

/**
 * Initialises a new SafeFrame context. Only one can be available in a page.
 * @return {object} Returns this object.
 */
Adhese.prototype.SafeFrame.prototype.init = function() {

	// make config object for already known positions
	this.adhesePositionConfig = new Object();

	if (this.ads && this.ads.length>0) {
		for (index in this.ads) {
			var ad = this.ads[index];
			this.adhesePositionConfig[ad[this.containerID]] = {
				"w": ad.width,
				"h": ad.height,
				"size" : ad.width+"x"+ad.height,
				"dest":	ad[this.containerID],
				"tgt": "_blank"
			};
		}
	}
  
	// create a config
	var conf = new $sf.host.Config({
		auto: false,
		debug: true,
		// Should be absolute path to render file hosted on CDN
		renderFile:	this.poolHost + "sf/r.html",
		positions: this.adhesePositionConfig,
		onBeforePosMsg: this.logMessages
	});

	return this;
};

/**
 * Function to add new SafeFrame positions to the context. For each passed Adehse.Ad object, a new SafeFrame Position and PositionConfig is created. The Adehse.Ad.adType identification will serve as the unique SafeFrame Position id. So if a Position with that id already exists it will be replaced by the current Position.
 * @param {Ad[]} inAds an array of Adhese.Ad objects
 * @return {void}
 */
Adhese.prototype.SafeFrame.prototype.addPositions = function(inAds) {
	// populate the array of positions
	for (var index in inAds) {
		var ad = inAds[index];
		ad.sfHtml = ad.tag;
		if(ad.ext=="js") {
			//if (ad.body != undefined && ad.body!="" && ad.body.match(/<script|<SCRIPT/)) {
				ad.sfHtml = ad.body;
			// } else {
			// 	ad.sfSrc = ad.swfSrc;
			// }
		}
		var tgtValue = '_blank';
        if(ad.sfHtml && ad.sfHtml.indexOf("TARGET='_self'") > 0) tgtValue = '_self';
		var posConf = new $sf.host.PosConfig({
			"id": ad[this.containerID],
			"w": ad.width,
			"h": ad.height,
			"size" : ad.width+"x"+ad.height,
			"dest":	ad[this.containerID],
			"tgt": tgtValue
		});
		this.adhesePositions.push(new $sf.host.Position({
			"id": ad[this.containerID],
			"html": ad.sfHtml,
			"src": ad.sfSrc,
			"conf": posConf,
			"viewableTracker": ad.viewableImpressionCounter || '',
			"impressionTracker": ad.impressionCounter || ''
		}));
	}
};

/**
 * Function that displays the content of an added position.
 * @param  {string} id the identficiation of the position, was based obn the Adhese.Ad.adType when created
 * @return {void}
 */
Adhese.prototype.SafeFrame.prototype.render = function(id) {
	for (var x in this.adhesePositions) {
		if (this.adhesePositions[x].id == id) {
			$sf.host.render(this.adhesePositions[x]);
			if (this.adhesePositions[x].impressionTracker ){
				this.helper.addTrackingPixel(this.adhesePositions[x].impressionTracker)
			}
			if (this.viewability && this.adhesePositions[x].viewableTracker && this.adhesePositions[x].viewableTracker !== '') {
				this.viewability.trackers[id] = this.adhesePositions[x].viewableTracker;
				this.viewability.adObserver.observe(document.getElementById(id));
			}
		}
	}
};
