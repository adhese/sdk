Adhese.prototype.genericUserSync = function(option) {
	// if no account given, do nothing
	if (option && option.url && option.syncName) {
		var lastSyncCookieName = option.syncName + "_uid_last_sync";
		if (typeof option.onload == "undefined") option.onload = true;
		if(document.cookie.indexOf(lastSyncCookieName)==-1 || !option.syncRefreshPeriod) {
			if (option.onload) {
				if (option.iframe) {
                                	this.helper.addEvent("load", this.appendSyncIframe, option);
                        	} else {
                                	this.helper.addEvent("load", this.appendSyncPixel, option);
				}
			} else {
				if (option.iframe) {
                                	this.appendSyncIframe(option);
                        	} else {
                                	this.appendSyncPixel(option);
				}
			}
			if(option.syncRefreshPeriod) {
				var date = new Date();
				date.setDate(date.getDate()+1);
				date.setHours(0);
				date.setMinutes(0);
				date.setSeconds(0);
				var diff = date.getTime() - new Date().getTime();
				this.helper.createCookie(lastSyncCookieName, diff, (diff/option.syncRefreshPeriod));
				// also create domain cookie, so do a request to an .adhese.com endpoint with the current domain as qs param
			}
			if (this.config && this.config.hostname) new Image().src = "https://user-sync.adhese.com/handlers/" + option.syncName + "/user_sync_discovery?domain=" + this.config.hostname + "&tl=" + this.getBooleanConsent();
			// this endpoint wil create a cookie on .adhese.com containing the domain as passed
		}
	}
};

Adhese.prototype.appendSyncIframe = function(options) {
	var iframe = document.createElement("IFRAME");
	iframe.setAttribute("id", "sync_iframe_" + options.syncName);
	iframe.setAttribute("height", "0");
	iframe.setAttribute("width", "0");
	iframe.setAttribute("marginwidth", "0");
	iframe.setAttribute("marginheight", "0");
	iframe.setAttribute("frameborder", "0");
	iframe.setAttribute("scrolling", "no");
	iframe.setAttribute("style", "border: 0px; display: none;");
	iframe.setAttribute("src", options.url); 
	document.body.appendChild(iframe);
};

Adhese.prototype.appendSyncPixel = function(options) {
        var pixel = document.createElement("IMG");
        pixel.setAttribute("id", "sync_pixel_" + options.syncName);
        pixel.setAttribute("height", "0");
        pixel.setAttribute("width", "0");
        pixel.setAttribute("style", "border: 0px; display: none;");
        pixel.setAttribute("src", options.url);
	pixel.setAttribute("alt","");
        document.body.appendChild(pixel);
};

