 Adhese.prototype.SafeFrame = function(poolHost) {
	this.poolHost = poolHost;
	this.adhesePositions = new Array();
	this.ads = [
		{
			"adType":"imu",
			"width":300,
			"height":250
		},
		{
			"adType":"leaderboard",
			"width":720,
			"height":90
		},
		{
			"adType":"skyscraper",
			"width":120,
			"height":600
		}
	];
	return this.init();
 };

Adhese.prototype.SafeFrame.prototype.init = function() {

	// make config object for already known positions
	this.adhesePositionConfig = new Object();
	
	if (this.ads && this.ads.length>0) {
		for (index in this.ads) {
			var ad = this.ads[index];
			this.adhesePositionConfig[ad.adType] = {
				"w": ad.width,
				"h": ad.height,
				"size" : ad.width+"x"+ad.height,
				"dest":	ad.adType
			};
		}
	}
	
	// create a config										
	var conf = new $sf.host.Config({
		auto: false,
		debug: true,
		// Should be absolute path to render file hosted on CDN
		renderFile:	this.poolHost + "/sf/r.html",
		positions: this.adhesePositionConfig
	});
	
	return this;
};

Adhese.prototype.SafeFrame.prototype.addPositions = function(inAds) {
	// populate the array of positions
	for (var index in inAds) {
		var ad = inAds[index];
		ad.sfHtml = ad.tag;
		if(ad.ext=="js") {
			if (ad.body != undefined && ad.body!="" && ad.body.match(/<script|<SCRIPT/)) {
				ad.sfHtml = ad.body;
			} else {
				ad.sfSrc = ad.swfSrc;
			}							
		}

		this.adhesePositions.push(new $sf.host.Position({
			"id": ad.adType,
			"html": ad.sfHtml,
			"src": ad.sfSrc,
			"conf": {
				"w": ad.width,
				"h": ad.height,
				"size" : ad.width+"x"+ad.height,
				"dest":	ad.adType
			}
		}));
	}
};

Adhese.prototype.SafeFrame.prototype.render = function(id) {
	for (var x in this.adhesePositions) {
		if (this.adhesePositions[x].id == id) {
			console.log(this.adhesePositions[x]);
			$sf.host.render(this.adhesePositions[x]);
		}
	}
};