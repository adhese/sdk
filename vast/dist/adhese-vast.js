function AdheseVastWrapper(inDebug) {
    this.debug = inDebug != undefined ? inDebug : false;
}

AdheseVastWrapper.prototype.init = function() {
    this.eventListeners = new Array();
    this.trackedImpressions = new Array();
    this.schedule = {};
    this.helper = new AdheseVastHelper();
};

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
};

AdheseVastWrapper.prototype.parseInLine = function(ad) {
    var mediafiles = new Array();
    var mf = ad.getElementsByTagName("MediaFile");
    for (var j = 0; j < mf.length; j++) {
        mediafiles.push(new AdheseVastMediaFile(mf[j].firstChild.nodeValue, mf[j].attributes.getNamedItem("type").value));
    }
    var impression = new Array();
    var im = ad.getElementsByTagName("Impression");
    for (var j = 0; j < im.length; j++) {
        impression.push(im[j].firstChild.nodeValue);
    }
    var trackers = new Object();
    var tr = ad.getElementsByTagName("Tracking");
    for (var j = 0; j < tr.length; j++) {
        if (!trackers[tr[j].attributes.getNamedItem("event").value]) trackers[tr[j].attributes.getNamedItem("event").value] = new Array();
        trackers[tr[j].attributes.getNamedItem("event").value].push(tr[j].firstChild.nodeValue);
    }
    var ctr = ad.getElementsByTagName("ClickTracking");
    for (var j = 0; j < tr.length; j++) {
        if (!trackers["click"]) trackers["click"] = new Array();
        if (ctr[j] && ctr[j].firstChild.nodeValue && ctr[j].firstChild.nodeValue != "") {
            trackers["click"].push(ctr[j].firstChild.nodeValue);
        }
    }
    var click = "";
    var ci = ad.getElementsByTagName("ClickThrough");
    for (var j = 0; j < ci.length; j++) {
        click = ci[j].firstChild.nodeValue;
    }
    var code = ad.attributes.getNamedItem("code") ? ad.attributes.getNamedItem("code").value : "preroll";
    if (this.debug) console.log(code);
    var durationTag = ad.getElementsByTagName("Duration")[0].firstChild, duration;
    if (durationTag !== null) {
        duration = ad.getElementsByTagName("Duration")[0].firstChild.nodeValue;
    } else {
        duration = 0;
    }
    this.schedule[code] = new AdheseVastAd(code, mediafiles, duration, impression, this.helper.getDurationInSeconds(duration), trackers, click);
    if (this.debug) console.log(this.schedule);
};

AdheseVastWrapper.prototype.parseVastJson = function(inJson) {
    var xml = this.parseXML(inJson[0].tag);
    var ads = xml.getElementsByTagName("Ad");
    var that = this;
    if (ads.length === 0) {
        this.fireAdsLoaded();
        return;
    }
    for (var i = 0; i < ads.length; i++) {
        if (ads[i].getElementsByTagName("InLine").length > 0) {
            this.parseInLine(ads[i]);
            this.fireAdsLoaded();
        } else {
            var code = ads[i].attributes.getNamedItem("code").value;
            var impressionNodes = ads[i].getElementsByTagName("Impression");
            AdheseAjax.request({
                url: ads[i].getElementsByTagName("VASTAdTagURI")[0].firstChild.nodeValue,
                method: "get",
                json: false
            }).done(function(result) {
                var xml2 = that.parseXML(result);
                var ads2 = xml2.getElementsByTagName("Ad");
                for (var j = 0; j < ads2.length; j++) {
                    ads2[j].setAttribute("code", code);
                    for (var z = 0; z < impressionNodes.length; z++) {
                        ads2[j].getElementsByTagName("InLine")[0].insertBefore(impressionNodes[z], ads2[j].getElementsByTagName("Impression")[0]);
                    }
                    if (ads2[j].getElementsByTagName("InLine").length > 0) {
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
        return new window.DOMParser().parseFromString(inXml, "text/xml");
    } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(inXml);
        return xmlDoc;
    } else {
        return undefined;
    }
};

AdheseVastWrapper.prototype.addEventListener = function(event, listener) {
    this.eventListeners.push(new AdheseVastEventListener(event, listener));
};

AdheseVastWrapper.prototype.fireAdsLoaded = function() {
    for (var i = 0; i < this.eventListeners.length; i++) {
        if (this.eventListeners[i].getEvent() == "ADS_LOADED") {
            if (this.debug) console.log("ADS_LOADED sent to listener");
            this.eventListeners[i].getListener().apply();
        }
    }
};

AdheseVastWrapper.prototype.getSchedule = function() {
    var arr = new Array();
    for (var name in this.schedule) {
        arr.push(name);
    }
    return arr;
};

AdheseVastWrapper.prototype.hasAd = function(adId) {
    return this.schedule[adId] != undefined;
};

AdheseVastWrapper.prototype.getImpression = function(adId) {
    return this.schedule[adId].getImpression();
};

AdheseVastWrapper.prototype.getClick = function(adId) {
    return this.schedule[adId].getClick();
};

AdheseVastWrapper.prototype.getTrackers = function(adId) {
    return this.schedule[adId].getTrackers();
};

AdheseVastWrapper.prototype.getMediafile = function(adId, type) {
    var mf = this.schedule[adId].getMediafile();
    for (var y = 0; y < mf.length; y++) {
        if (mf[y].getType() == type) return mf[y].getSrc();
    }
    return undefined;
};

AdheseVastWrapper.prototype.getDuration = function(adId) {
    return this.schedule[adId].getDuration();
};

AdheseVastWrapper.prototype.getDurationInSeconds = function(adId) {
    return this.schedule[adId].getDurationInSeconds();
};

AdheseVastWrapper.prototype.track = function(uri) {
    for (var x = 0; x < uri.length; x++) {
        if (!this.trackedImpressions[uri[x]]) {
            this.trackedImpressions[uri[x]] = 1;
            var i = document.createElement("img");
            i.src = uri[x] + ((uri[x].indexOf("?") == -1 ? "?adhche=" : "&adhche=") + new Date().getTime());
        }
    }
};

AdheseVastWrapper.prototype.timeupdate = function(adId, currentTime) {
    if (this.debug) console.log(adId + " timeupdate @" + currentTime + " sec.");
    if (currentTime == 0) {
        if (this.debug) console.log("Tracking impression for " + adId);
        this.track(this.getImpression(adId));
    } else {
        var perc = currentTime / this.schedule[adId].getDurationInSeconds();
        if (perc.toFixed(2) == 0) {
            if (this.debug) console.log("Tracking start for " + adId);
            this.track(this.getTrackers(adId).start);
        } else if (perc.toFixed(2) == .25) {
            if (this.debug) console.log("Tracking first quartile for " + adId + " - " + this.getTrackers(adId).firstQuartile);
            this.track(this.getTrackers(adId).firstQuartile);
        } else if (perc.toFixed(2) == .5) {
            if (this.debug) console.log("Tracking mid point for " + adId);
            this.track(this.getTrackers(adId).midpoint);
        } else if (perc.toFixed(2) == .75) {
            if (this.debug) console.log("Tracking third quartile for " + adId);
            this.track(this.getTrackers(adId).thirdQuartile);
        }
    }
};

AdheseVastWrapper.prototype.clicked = function(adId, currentTime) {
    if (this.debug) console.log("tracker clicked for " + adId + " @" + currentTime);
    if (this.debug) console.log("open new window with VideoClicks>ClickThrough");
    this.helper.openNewWindow(this.getClick(adId));
    this.track(this.getTrackers(adId).click);
};

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

function AdheseVastHelper() {}

AdheseVastHelper.prototype.getDurationInSeconds = function(inDuration) {
    if (inDuration) {
        var d = inDuration.split(":");
        if (d.length == 3) {
            return parseInt(d[0] * 3600) + parseInt(d[1] * 60) + parseInt(d[2]);
        } else if (d.length == 2) {
            return parseInt(d[0] * 60) + parseInt(d[1]);
        } else if (d.length == 1) {
            return parseInt(d[0]);
        }
        return 0;
    }
    return 0;
};

AdheseVastHelper.prototype.openNewWindow = function(uri) {
    if (window) {
        var win = window.open(uri, "_blank");
        win.focus();
    }
};

var AdheseAjax = {
    request: function(ops) {
        if (typeof ops == "string") ops = {
            url: ops
        };
        ops.url = ops.url || "";
        ops.method = ops.method || "get";
        ops.data = ops.data || {};
        var getParams = function(data, url) {
            var arr = [], str;
            for (var name in data) {
                arr.push(name + "=" + encodeURIComponent(data[name]));
            }
            str = arr.join("&");
            if (str != "") {
                return url ? url.indexOf("?") < 0 ? "?" + str : "&" + str : str;
            }
            return "";
        };
        var api = {
            host: {},
            process: function(ops) {
                var self = this;
                this.xhr = null;
                try {
                    this.xhr = new ActiveXObject("Msxml2.XMLHTTP");
                } catch (e) {
                    try {
                        this.xhr = new ActiveXObject("Microsoft.XMLHTTP");
                    } catch (e) {
                        try {
                            this.xhr = new XMLHttpRequest();
                        } catch (e) {
                            this.xhr = false;
                        }
                    }
                }
                if (this.xhr) {
                    this.xhr.onreadystatechange = function() {
                        if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                            var result = self.xhr.responseText;
                            if (ops.json === true && typeof JSON != "undefined") {
                                result = JSON.parse(result);
                            }
                            self.doneCallback && self.doneCallback.apply(self.host, [ result, self.xhr ]);
                        } else if (self.xhr.readyState == 4) {
                            self.failCallback && self.failCallback.apply(self.host, [ self.xhr ]);
                        }
                        self.alwaysCallback && self.alwaysCallback.apply(self.host, [ self.xhr ]);
                    };
                }
                if (ops.method == "get") {
                    this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
                } else {
                    this.xhr.open(ops.method, ops.url, true);
                    this.setHeaders({
                        "X-Requested-With": "XMLHttpRequest",
                        "Content-type": "application/x-www-form-urlencoded"
                    });
                }
                if (ops.headers && typeof ops.headers == "object") {
                    this.setHeaders(ops.headers);
                }
                setTimeout(function() {
                    ops.method == "get" ? self.xhr.send() : self.xhr.send(getParams(ops.data));
                }, 20);
                return this;
            },
            done: function(callback) {
                this.doneCallback = callback;
                return this;
            },
            fail: function(callback) {
                this.failCallback = callback;
                return this;
            },
            always: function(callback) {
                this.alwaysCallback = callback;
                return this;
            },
            setHeaders: function(headers) {
                for (var name in headers) {
                    this.xhr && this.xhr.setRequestHeader(name, headers[name]);
                }
            }
        };
        return api.process(ops);
    }
};