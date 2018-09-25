Adhese.prototype.Ad = function(adhese, formatCode, options) {
    var defaults = {
        write: false
    };
    this.format = options && options.format ? options.format : formatCode;
    this.options = adhese.helper.merge(defaults, options);
    this.uid = formatCode;
    this.safeframe = options && options.safeframe ? options.safeframe : false;
    if (this.options.position != undefined) {
        this.uid = this.options.position + this.format;
    }
    return this;
};

function Adhese() {
    this.config = {
        debug: false
    };
    this.request = {};
    this.requestExtra = [];
    this.ads = [];
    this.that = this;
    this.helper = new this.Helper();
    this.detection = new this.Detection();
    return this;
}

Adhese.prototype.init = function(options) {
    this.config.debug = options.debug;
    this.helper.log("Adhese: initializing...");
    this.config.jquery = typeof jQuery !== "undefined";
    if (options.account) {
        this.config.account = options.account;
        var protocol = "http:";
        if (window.location.protocol != "file:") {
            protocol = window.location.protocol;
        }
        this.config.host = protocol + "//ads-" + options.account + ".adhese.com/";
        this.config.poolHost = protocol + "//pool-" + options.account + ".adhese.com/";
        this.config.clickHost = protocol + "//click-" + options.account + ".adhese.com/";
        this.config.previewHost = "https://" + options.account + "-preview.adhese.org/";
        this.config.hostname = undefined;
    } else if (options.host) {
        this.config.host = options.host;
        var adHost = document.createElement("a");
        adHost.href = this.config.host;
        this.config.hostname = adHost.hostname;
    }
    if (options.previewHost) {
        this.config.previewHost = options.previewHost;
    }
    if (options.location && typeof options.location == "function") {
        this.config.location = options.location();
        this.helper.log('options.location=="function"');
    } else if (options.location && typeof options.location == "string") {
        this.config.location = options.location;
        this.helper.log('options.location=="string"');
    } else {
        this.config.location = "testlocation";
    }
    if (typeof options.safeframe == "undefined" || options.safeframe == false) {
        this.config.safeframe = false;
    } else {
        this.config.safeframe = options.safeframe;
        this.initSafeFrame(options.safeframeContainerID);
    }
    this.registerRequestParameter("rn", Math.round(Math.random() * 1e4));
    if (typeof Fingerprint === "function") {
        this.registerRequestParameter("fp", new Fingerprint({
            canvas: true
        }).get());
    }
    this.registerRequestParameter("pr", window.devicePixelRatio || 1);
    if (typeof options.referrer == "undefined" || options.referrer == true) {
        this.registerRequestParameter("re", this.helper.stringToHex(document.referrer.substr(0, 200)));
    }
    if (typeof options.url == "undefined" || options.url == true) {
        this.registerRequestParameter("ur", this.helper.stringToHex(window.location.href));
    }
    this.userAgent = this.helper.getUserAgent();
    for (var p in this.userAgent) {
        this.registerRequestParameter("br", this.userAgent[p]);
    }
    if (typeof this.Detection === "function") {
        this.registerRequestParameter("dt", this.detection.device());
        this.registerRequestParameter("br", this.detection.device());
    }
    this.config.previewExclusive = false;
    if (options.previewExclusive) this.config.previewExclusive = options.previewExclusive;
    this.checkPreview();
    this.checkAdheseInfo();
    if (this.checkVisible) {
        addEventListener("load", this.checkVisible.bind(this), false);
        addEventListener("scroll", this.checkVisible.bind(this), false);
    }
    this.helper.log("Adhese: initialized with config:", JSON.stringify(this.config));
};

Adhese.prototype.initSafeFrame = function(safeframeContainerID) {
    if (!this.safeframe) {
        if (safeframeContainerID) {
            this.safeframe = new this.SafeFrame(this.config.poolHost, safeframeContainerID);
        } else {
            this.safeframe = new this.SafeFrame(this.config.poolHost);
        }
    }
};

Adhese.prototype.registerRequestParameter = function(key, value) {
    var v = this.request[key];
    if (!v) v = new Array();
    v.push(value);
    this.request[key] = v;
};

Adhese.prototype.removeRequestParameter = function(key, value) {
    var v = this.request[key];
    if (v) {
        var index = v.indexOf(value);
        if (index != -1) v.splice(index, 1);
    }
};

Adhese.prototype.addRequestString = function(value) {
    this.requestExtra.push(value);
};

Adhese.prototype.tag = function(formatCode, options) {
    var that = this;
    this.helper.log(formatCode, JSON.stringify(options));
    if (options && options.safeframe) {
        if (options.safeframeContainerID) {
            this.initSafeFrame(options.safeframeContainerID);
        } else {
            this.initSafeFrame();
        }
    }
    var ad = new this.Ad(this, formatCode, options);
    if (this.previewActive) {
        var pf = this.previewFormats;
        for (var key in pf) {
            if (key == formatCode) {
                var previewformat = pf[formatCode];
                var previewAd = new this.Ad(this, formatCode, options);
                previewAd.adType = formatCode;
                previewAd.ext = "js";
                var previewJsonRequest = "";
                if (!previewAd.options.write) previewJsonRequest = "json/";
                previewAd.swfSrc = that.config.previewHost + "/creatives/preview/" + previewJsonRequest + "tag.do?id=" + previewformat.creative + "&slotId=" + previewformat.slot;
                previewAd.width = previewformat.width;
                previewAd.height = previewformat.height;
                ad = previewAd;
                addEventListener("load", that.showPreviewSign.bind(that));
            }
        }
    }
    ad.options.slotName = this.getSlotName(ad);
    this.ads.push([ formatCode, ad ]);
    if (ad.options.write) {
        if (this.config.previewExclusive == false || this.config.previewExclusive == true && ad.swfSrc) {
            this.write(ad);
        }
    }
    return ad;
};

Adhese.prototype.write = function(ad) {
    if (this.config.safeframe || ad.safeframe) {
        var adUrl = "";
        if (this.previewActive && ad.swfSrc) {
            adUrl = ad.swfSrc;
        } else {
            adUrl = this.getRequestUri(ad, {
                type: "json"
            });
        }
        this.helper.log("Adhese.write: request uri: " + adUrl + ", safeframe enabled");
        var safeframeContainerID = this.safeframe.containerID;
        AdheseAjax.request({
            url: adUrl,
            method: "get",
            json: true
        }).done(function(result) {
            adhese.safeframe.addPositions(result);
            for (var i = result.length - 1; i >= 0; i--) {
                adhese.safeframe.render(result[i][safeframeContainerID]);
            }
        });
    } else {
        var adUrl = "";
        if (this.previewActive && ad.swfSrc) {
            adUrl = ad.swfSrc;
        } else {
            adUrl = this.getRequestUri(ad, {
                type: "js"
            });
        }
        this.helper.log("Adhese.write: request uri: " + adUrl);
        document.write("<scri" + 'pt type="text/javascript" src="' + adUrl + '"></scr' + "ipt>");
    }
};

Adhese.prototype.track = function(uri) {
    this.helper.addTrackingPixel(uri);
};

Adhese.prototype.trackByUrl = function(uri) {
    this.helper.addTrackingPixel(uri);
};

Adhese.prototype.getMultipleRequestUri = function(adArray, options) {
    var uri = this.config.host;
    if (!options) options = {
        type: "js"
    };
    switch (options.type) {
      case "json":
        uri += "json/";
        break;

      case "jsonp":
        if (!options.callbackFunctionName) options.callbackFunctionName = "callback";
        uri += "jsonp/" + options.callbackFunctionName + "/";
        break;

      default:
        uri += "ad/";
        break;
    }
    for (var i = adArray.length - 1; i >= 0; i--) {
        var ad = adArray[i];
        if (!ad.swfSrc || ad.swfSrc && ad.swfSrc.indexOf("preview") == -1) {
            uri += "sl" + this.getSlotName(ad) + "/";
        }
    }
    for (var a in this.request) {
        var s = a;
        for (var x = 0; x < this.request[a].length; x++) {
            s += this.request[a][x] + (this.request[a].length - 1 > x ? ";" : "");
        }
        uri += s + "/";
    }
    for (var i = 0, a = this.requestExtra; i < a.length; i++) {
        if (a[i]) {
            uri += a[i] + "/";
        }
    }
    uri += "?t=" + new Date().getTime();
    return uri;
};

Adhese.prototype.getSlotName = function(ad) {
    if (ad.options.position && ad.options.location) {
        u = ad.options.location + ad.options.position;
    } else if (ad.options.position) {
        u = this.config.location + ad.options.position;
    } else if (ad.options.location) {
        u = ad.options.location;
    } else {
        u = this.config.location;
    }
    return u + "-" + ad.format;
};

Adhese.prototype.getRequestUri = function(ad, options) {
    if (options.preview && options.preview == true) {
        return ad.swfSrc;
    } else {
        var adArray = [ ad ];
        return this.getMultipleRequestUri(adArray, options);
    }
};

Adhese.prototype.syncUser = function(network, identification) {
    if (network == "rubicon") {
        this.rubiconUserSync(identification);
    } else if (network == "improvedigital") {
        this.improvedigitalUserSync(identification);
    } else if (network == "pubmatic") {
        this.pubmaticUserSync(identification);
    } else if (network == "spotx") {
        this.spotxUserSync(identification);
    }
};

Adhese.prototype.getSfPreview = function(sf_array) {
    var adhSelf = this;
    for (var i = sf_array.length - 1; i >= 0; i--) {
        var ad = sf_array[i];
        if (ad.swfSrc && ad.swfSrc.indexOf("tag.do") > -1) {
            AdheseAjax.request({
                url: adhSelf.getRequestUri(ad, {
                    type: "json",
                    preview: true
                }),
                method: "get",
                json: true
            }).done(function(result) {
                adhSelf.safeframe.addPositions(result);
                for (var i = result.length - 1; i >= 0; i--) {
                    adhSelf.safeframe.render(result[i].adType);
                }
            });
        }
    }
};

Adhese.prototype.getSfAds = function(sf_array) {
    var adhSelf = this;
    AdheseAjax.request({
        url: adhSelf.getMultipleRequestUri(sf_array, {
            type: "json"
        }),
        method: "get",
        json: true
    }).done(function(result) {
        adhSelf.safeframe.addPositions(result);
        for (var i = result.length - 1; i >= 0; i--) {
            adhSelf.safeframe.render(result[i].adType);
        }
    });
    adhSelf.getSfPreview(sf_array);
};

Adhese.prototype.registerResponse = function(key, ad) {
    if (!adhese.responses) {
        adhese.responses = new Object();
    }
    adhese.responses[key] = ad;
};

Adhese.prototype.Helper = function() {
    this.oslist = [ {
        string: navigator.userAgent,
        subString: "Windows Phone",
        identity: "WindowsPhone"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 10.0",
        identity: "Windows10"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 6.3",
        identity: "Windows8.1"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 6.2",
        identity: "Windows8"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 6.1",
        identity: "Windows7"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 6.0",
        identity: "WindowsVista"
    }, {
        string: navigator.userAgent,
        subString: "Windows NT 5.1",
        identity: "WindowsXP"
    }, {
        string: navigator.userAgent,
        subString: "Windows 98",
        identity: "Windows98"
    }, {
        string: navigator.userAgent,
        subString: "Android",
        identity: "Android"
    }, {
        string: navigator.userAgent,
        subString: "iPhone",
        identity: "iOS"
    }, {
        string: navigator.userAgent,
        subString: "iPad",
        identity: "iOS"
    }, {
        string: navigator.platform,
        subString: "Mac",
        identity: "OSX"
    }, {
        string: navigator.platform,
        subString: "Linux",
        identity: "Linux"
    } ];
    this.browserlist = [ {
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
    } ];
};

Adhese.prototype.Helper.prototype.log = function() {
    this.logObjs = this.logObjs || {};
    this.logs = this.logs || [];
    var logArgs = "";
    var logTime = new Date().getTime();
    for (var i = 0, a = arguments; i < a.length; i++) {
        if (a[i]) {
            logArgs += a[i] + " ";
        }
    }
    this.logObjs[logTime] = logObj = {
        msg: logArgs
    };
    this.logs.push([ logTime, arguments ]);
    if (window.location.search.match("debug")) {
        console.log(logTime, arguments);
    }
};

Adhese.prototype.Helper.prototype.debug = function() {
    for (var i in this.logs) {
        var l = this.logs[i];
        console.log(l[0], l[1]);
    }
};

Adhese.prototype.Helper.prototype.debugTable = function() {
    if (typeof console.table == "function") {
        console.table(this.logObjs);
    }
};

Adhese.prototype.Helper.prototype.getMetaTagContent = function(inName, limitReturn) {};

Adhese.prototype.Helper.prototype.getQueryStringParameter = function(inName) {
    var match = RegExp("[?&]" + key + "=([^&]*)").exec(window.location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : default_;
};

Adhese.prototype.Helper.prototype.addTrackingPixel = function(uri) {
    var img = document.createElement("img");
    img.src = uri;
    img.style.height = "1px";
    img.style.width = "1px";
    img.style.margin = "-1px";
    img.style.border = "0";
    img.style.position = "absolute";
    img.style.top = "0";
    document.body.appendChild(img);
};

Adhese.prototype.Helper.prototype.getScreenProperties = function() {
    var dim = new Object();
    dim.width = window.innerWidth ? window.innerWidth : document.body.offsetWidth;
    dim.height = window.innerHeight ? window.innerHeight : document.body.offsetHeight;
    return dim;
};

Adhese.prototype.Helper.prototype.addEvent = function(ev, fu, param, element) {
    if (typeof element == "undefined") {
        element = window;
    }
    if (element.addEventListener) {
        element.addEventListener(ev, function() {
            fu(param);
        }, false);
    } else if (element.attachEvent) {
        element.attachEvent("on" + ev, function() {
            fu(param);
        });
    }
};

Adhese.prototype.Helper.prototype.removeEvent = function(e, l, el) {
    if (window.removeEventListener) {
        window.removeEventListener(e, l, false);
    } else if (window.detachEvent) {
        window.detachEvent("on" + e, l);
    }
};

Adhese.prototype.Helper.prototype.getAbsoluteOffset = function(element) {
    var o = {
        top: 0,
        left: 0
    };
    if (typeof element != "undefined") {
        for (o.left = 0, o.top = 0; element; element = element.offsetParent) {
            o.left += element.offsetLeft;
            o.top += element.offsetTop;
        }
    }
    return o;
};

Adhese.prototype.Helper.prototype.getUserAgent = function() {
    var obj = {};
    obj.browser = this.searchString(this.browserlist) || "unknownBrowser";
    obj.browserVersion = obj.browser + this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "unknownVersion";
    obj.os = this.searchString(this.oslist) || "unknownOS";
    return obj;
};

Adhese.prototype.Helper.prototype.searchString = function(data) {
    for (var i = 0; i < data.length; i++) {
        var dataString = data[i].string;
        var dataProp = data[i].prop;
        this.versionSearchString = data[i].versionSearch || data[i].identity;
        if (dataString) {
            if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
        } else if (dataProp) {
            return data[i].identity;
        }
    }
};

Adhese.prototype.Helper.prototype.searchVersion = function(dataString) {
    var index = dataString.indexOf(this.versionSearchString);
    if (index == -1) return;
    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
};

Adhese.prototype.Helper.prototype.merge = function(a, b) {
    var c = {};
    for (var k in a) {
        c[k] = a[k];
    }
    for (var k in b) {
        c[k] = b[k];
    }
    return c;
};

Adhese.prototype.Helper.prototype.stringToHex = function(str, hex) {
    try {
        hex = unescape(encodeURIComponent(str)).split("").map(function(v) {
            return v.charCodeAt(0).toString(16);
        }).join("");
    } catch (e) {
        hex = str;
        console.log("invalid text input: ", e, str);
    }
    return hex;
};

Adhese.prototype.Helper.prototype.hexToString = function(hex, str) {
    try {
        str = decodeURIComponent(hex.replace(/(..)/g, "%$1"));
    } catch (e) {
        str = hex;
        console.log("invalid hex input: ", e, hex);
    }
    return str;
};

Adhese.prototype.Helper.prototype.createCookie = function(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3 - date.getTimezoneOffset() * 60 * 1e3);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

Adhese.prototype.Helper.prototype.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

Adhese.prototype.Helper.prototype.eraseCookie = function(name) {
    this.createCookie(name, "", -1);
};

Adhese.prototype.Helper.prototype.eatsCookie = function() {
    this.createCookie("adheseTestCookie", "", 1);
    if (this.readCookie("adheseTestCookie") != null) {
        this.eraseCookie("adheseTestCookie");
        return true;
    } else {
        return false;
    }
};

Adhese.prototype.Helper.prototype.getMetaContent = function(meta_name) {
    var meta_elements = document.getElementsByTagName("META");
    var meta_contents = [];
    for (var i = meta_elements.length - 1; i >= 0; i--) {
        var meta_element = meta_elements[i];
        if (meta_element && (meta_element.name === meta_name || meta_element.getAttribute("property") === meta_name) && meta_element.content) {
            meta_contents.push(meta_element.content);
        }
    }
    return meta_contents;
};

Adhese.prototype.Helper.prototype.adhElementInViewport = function(element) {
    if (typeof element == "string") {
        element = document.getElementById(element);
    }
    if (element) {
        var rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    } else {
        return false;
    }
};

Adhese.prototype.checkPreview = function() {
    this.previewFormats = {};
    if (!this.config.previewHost) {
        return false;
    }
    if (window.location.search.indexOf("adhesePreview") != -1) {
        this.helper.log("checking for preview");
        var b = window.location.search.substring(1);
        var countAd = b.match(/adhesePreviewCreativeId/g).length;
        var p = b.split("&");
        var c = "";
        var s = "";
        var t = "";
        var tf = "";
        var w = 0;
        var h = 0;
        var tc = [];
        if (b.indexOf("adhesePreviewExclusive=true") != -1) {
            this.config.previewExclusive = true;
        }
        if (b.indexOf("adhesePreviewExclusive=false") != -1) {
            this.config.previewExclusive = false;
        }
        for (var x = 0; x < p.length; x++) {
            if (p[x].split("=")[0] == "adhesePreviewCreativeId") {
                c = unescape(p[x].split("=")[1]);
            }
            if (p[x].split("=")[0] == "adhesePreviewSlotId") {
                s = p[x].split("=")[1];
            }
            if (p[x].split("=")[0] == "adhesePreviewCreativeTemplate") {
                t = p[x].split("=")[1];
                tc.push(t);
            }
            if (p[x].split("=")[0] == "adhesePreviewTemplateFile") {
                tf = p[x].split("=")[1];
            }
            if (p[x].split("=")[0] == "adhesePreviewWidth") {
                w = p[x].split("=")[1];
            }
            if (p[x].split("=")[0] == "adhesePreviewHeight") {
                h = p[x].split("=")[1];
            }
            if (p[x].split("=")[0] == "adhesePreviewCreativeKey") {
                if (countAd > 1) {
                    if (s != "" && tc[0] != "") {
                        for (i in tc) {
                            var t = tc[i];
                            this.previewFormats[t] = {
                                slot: s,
                                creative: c,
                                templateFile: tf,
                                width: w,
                                height: h
                            };
                        }
                    }
                    tc = [];
                }
            }
        }
        if (countAd == 1) {
            for (var y = 0; y < tc.length; y++) {
                this.previewFormats[tc[y]] = {
                    slot: s,
                    creative: c,
                    templateFile: tf,
                    width: w,
                    height: h
                };
            }
        }
        var c = [];
        for (k in this.previewFormats) {
            c.push(k + "," + this.previewFormats[k].creative + "," + this.previewFormats[k].slot + "," + this.previewFormats[k].template + "," + this.previewFormats[k].width + "," + this.previewFormats[k].height);
        }
        this.helper.createCookie("adhese_preview", c.join("|"), 0);
        this.previewActive = true;
    } else if (this.helper.readCookie("adhese_preview")) {
        var v = this.helper.readCookie("adhese_preview").split("|");
        for (var x = 0; x < v.length; x++) {
            var c = v[x].split(",");
            this.previewFormats[c[0]] = {
                creative: c[1],
                slot: c[2],
                template: c[3],
                width: c[4],
                height: c[5]
            };
        }
        this.previewActive = true;
    }
};

Adhese.prototype.showPreviewSign = function() {
    var that = this;
    var p = document.createElement("DIV");
    var msg = '<div id="adhPreviewMessage" style="cursor:pointer;font-family:Helvetica,Verdana; font-size:12px; text-align:center; background-color: #000000; color: #FFFFFF; position:fixed; top:10px;left:10px;padding:10px;z-index:9999;width: 100px;"><b>Adhese preview active.</br> Click to disable</div>';
    p.innerHTML = msg;
    document.body.appendChild(p);
    that.helper.addEvent("click", that.closePreviewSign.bind(that), p, p);
};

Adhese.prototype.closePreviewSign = function() {
    this.helper.eraseCookie("adhese_preview");
    if (location.search.indexOf("adhesePreviewCreativeId") != -1) {
        location.href = location.href.split("?")[0];
    } else {
        location.reload();
    }
};

Adhese.prototype.checkAdheseInfo = function() {
    var that = this;
    if (window.location.search.indexOf("adheseInfo=true") == -1) {
        return false;
    } else {
        addEventListener("load", that.showInfoSign.bind(that));
    }
};

Adhese.prototype.showInfoSign = function() {
    var that = this;
    var p = document.createElement("DIV");
    var msg = '<div id="adhInfoMessage" style="cursor:pointer;font-family:Helvetica,Verdana; font-size:12px; text-align:center; background-color: lightgrey; color: black; position:fixed; top:10px;right:10px;padding:10px;z-index:9999;width:auto; max-width:300px; opacity:0.9; border:2px #9e9e9e solid">';
    msg += "<b>Adhese Request Info</b></br>- Click to disable -</br>";
    msg += "</br><b>Location code:</b></br>";
    msg += adhese.config.location + "</br>";
    msg += "</br><b>Format code(s):</b></br>";
    for (x in adhese.ads) {
        msg += adhese.ads[x][0] + "</br>";
    }
    msg += "</br><b>Targeting:</b></br>";
    for (x in adhese.request) {
        if (x != "ur" && x != "rn" && x != "re" && x != "pr" && x != "fp") msg += "<b>" + x + ": </b>" + adhese.request[x] + "</br>";
    }
    msg += "</div>";
    p.innerHTML = msg;
    document.body.appendChild(p);
    that.helper.addEvent("click", that.closeInfoSign.bind(that), p, p);
};

Adhese.prototype.closeInfoSign = function() {
    var infoMsg = document.getElementById("adhInfoMessage");
    infoMsg.style.display = "none";
};

var AdheseAjax = {
    request: function(ops) {
        if (typeof ops == "string") ops = {
            url: ops
        };
        ops.url = ops.url || "";
        ops.method = ops.method || "get";
        ops.data = ops.data || {};
        if (typeof ops.encodeData == "undefined") {
            ops.encodeData = true;
        }
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
                if (document.all && !window.atob) {
                    try {
                        this.xhr = new ActiveXObject("Msxml2.XMLHTTP");
                    } catch (e) {
                        try {
                            this.xhr = new ActiveXObject("Microsoft.XMLHTTP");
                        } catch (e) {
                            this.xhr = false;
                        }
                    }
                } else {
                    try {
                        this.xhr = new XMLHttpRequest();
                    } catch (e) {
                        this.xhr = false;
                    }
                }
                if (this.xhr) {
                    if ("withCredentials" in this.xhr) {
                        this.xhr.withCredentials = true;
                    }
                    this.xhr.onreadystatechange = function() {
                        if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                            var result = self.xhr.responseText;
                            if (ops.json === true && typeof JSON != "undefined") {
                                if (result) {
                                    try {
                                        result = JSON.parse(result);
                                        self.doneCallback && self.doneCallback.apply(self.host, [ result, self.xhr ]);
                                    } catch (e) {
                                        self.errorCallback && self.errorCallback.apply(self.host, [ "Adhese Ajax: " + e ]);
                                    }
                                } else {
                                    self.errorCallback && self.errorCallback.apply(self.host, [ "Adhese Ajax: Response is empty string" ]);
                                }
                            }
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
                    if (ops.method == "get") {
                        self.xhr.send();
                    } else {
                        var data;
                        if (ops.encodeData) {
                            data = getParams(ops.data);
                        } else {
                            data = ops.data;
                        }
                        self.xhr.send(data);
                    }
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
            error: function(callback) {
                this.errorCallback = callback;
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

Adhese.prototype.Detection = function() {
    return this;
};

Adhese.prototype.Detection.prototype.device = function(ua) {
    ua = ua ? ua : window.navigator.userAgent;
    if (ua.match(/webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari|SymbianOS/i) && !ua.match(/Android/i)) {
        this.deviceType = "phone";
    } else if (ua.match(/Mobile/i) && ua.match(/Android/i)) {
        this.deviceType = "phone";
    } else if (ua.match(/iPad|Android|Tablet|Silk/i)) {
        this.deviceType = "tablet";
    } else {
        this.deviceType = "desktop";
    }
    return this.deviceType;
};

if (!window.AdheseVisibleData) {
    window.AdheseVisibleData = [];
}

Adhese.prototype.checkVisible = function() {
    var that = this;
    var ads = new Array();
    var visibleIndex = 0;
    for (var i = 0; i < window.AdheseVisibleData.length; i++) {
        visibleIndex = i;
        ads[i] = window.AdheseVisibleData[i];
        var el = document.getElementById(ads[i].uid);
        if (el) {
            var rect = el.getBoundingClientRect();
            ads[i].visible = rect.height > 0 && rect.width > 0 && rect.top + rect.height * .5 >= 0 && rect.left + rect.width * .5 >= 0 && rect.bottom - rect.height * .5 <= (window.innerHeight || document.documentElement.clientHeight) && rect.right - rect.width * .5 <= (window.innerWidth || document.documentElement.clientWidth);
            if (ads[i].visible && !ads[i].active && !ads[i].tracked) {
                if (ads[i].inviewTracker) {
                    that.track(ads[i].inviewTracker);
                }
                ads[i].active = true;
                ads[i].out = setTimeout(function(activeAd) {
                    that.track(activeAd.visibleTracker);
                    activeAd.tracked = true;
                    window.AdheseVisibleData.splice(window.AdheseVisibleData.indexOf(activeAd), 1);
                }, 1e3, ads[i]);
            } else if (!ads[i].visible && ads[i].active) {
                clearTimeout(ads[i].out);
                ads[i].active = false;
            }
        } else {
            this.helper.log("Can't find <div> width id: " + ads[i].uid);
            ads[i].tracked = true;
        }
    }
};

(function(name, context, definition) {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = definition();
    } else if (typeof define === "function" && define.amd) {
        define(definition);
    } else {
        context[name] = definition();
    }
})("Fingerprint", this, function() {
    "use strict";
    var Fingerprint = function(options) {
        var nativeForEach, nativeMap;
        nativeForEach = Array.prototype.forEach;
        nativeMap = Array.prototype.map;
        this.each = function(obj, iterator, context) {
            if (obj === null) {
                return;
            }
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === {}) return;
                }
            } else {
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (iterator.call(context, obj[key], key, obj) === {}) return;
                    }
                }
            }
        };
        this.map = function(obj, iterator, context) {
            var results = [];
            if (obj == null) return results;
            if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
            this.each(obj, function(value, index, list) {
                results[results.length] = iterator.call(context, value, index, list);
            });
            return results;
        };
        if (typeof options == "object") {
            this.hasher = options.hasher;
            this.screen_resolution = options.screen_resolution;
            this.canvas = options.canvas;
            this.ie_activex = options.ie_activex;
        } else if (typeof options == "function") {
            this.hasher = options;
        }
    };
    Fingerprint.prototype = {
        get: function() {
            var keys = [];
            keys.push(navigator.userAgent);
            keys.push(navigator.language);
            keys.push(screen.colorDepth);
            if (this.screen_resolution) {
                var resolution = this.getScreenResolution();
                if (typeof resolution !== "undefined") {
                    keys.push(this.getScreenResolution().join("x"));
                }
            }
            keys.push(new Date().getTimezoneOffset());
            keys.push(this.hasSessionStorage());
            keys.push(this.hasLocalStorage());
            keys.push(!!window.indexedDB);
            if (document.body) {
                keys.push(typeof document.body.addBehavior);
            } else {
                keys.push(typeof undefined);
            }
            keys.push(typeof window.openDatabase);
            keys.push(navigator.cpuClass);
            keys.push(navigator.platform);
            keys.push(navigator.doNotTrack);
            keys.push(this.getPluginsString());
            if (this.canvas && this.isCanvasSupported()) {
                keys.push(this.getCanvasFingerprint());
            }
            if (this.hasher) {
                return this.hasher(keys.join("###"), 31);
            } else {
                return this.murmurhash3_32_gc(keys.join("###"), 31);
            }
        },
        murmurhash3_32_gc: function(key, seed) {
            var remainder, bytes, h1, h1b, c1, c2, k1, i;
            remainder = key.length & 3;
            bytes = key.length - remainder;
            h1 = seed;
            c1 = 3432918353;
            c2 = 461845907;
            i = 0;
            while (i < bytes) {
                k1 = key.charCodeAt(i) & 255 | (key.charCodeAt(++i) & 255) << 8 | (key.charCodeAt(++i) & 255) << 16 | (key.charCodeAt(++i) & 255) << 24;
                ++i;
                k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
                k1 = k1 << 15 | k1 >>> 17;
                k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
                h1 ^= k1;
                h1 = h1 << 13 | h1 >>> 19;
                h1b = (h1 & 65535) * 5 + (((h1 >>> 16) * 5 & 65535) << 16) & 4294967295;
                h1 = (h1b & 65535) + 27492 + (((h1b >>> 16) + 58964 & 65535) << 16);
            }
            k1 = 0;
            switch (remainder) {
              case 3:
                k1 ^= (key.charCodeAt(i + 2) & 255) << 16;

              case 2:
                k1 ^= (key.charCodeAt(i + 1) & 255) << 8;

              case 1:
                k1 ^= key.charCodeAt(i) & 255;
                k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
                k1 = k1 << 15 | k1 >>> 17;
                k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
                h1 ^= k1;
            }
            h1 ^= key.length;
            h1 ^= h1 >>> 16;
            h1 = (h1 & 65535) * 2246822507 + (((h1 >>> 16) * 2246822507 & 65535) << 16) & 4294967295;
            h1 ^= h1 >>> 13;
            h1 = (h1 & 65535) * 3266489909 + (((h1 >>> 16) * 3266489909 & 65535) << 16) & 4294967295;
            h1 ^= h1 >>> 16;
            return h1 >>> 0;
        },
        hasLocalStorage: function() {
            try {
                return !!window.localStorage;
            } catch (e) {
                return true;
            }
        },
        hasSessionStorage: function() {
            try {
                return !!window.sessionStorage;
            } catch (e) {
                return true;
            }
        },
        isCanvasSupported: function() {
            var elem = document.createElement("canvas");
            return !!(elem.getContext && elem.getContext("2d"));
        },
        isIE: function() {
            if (navigator.appName === "Microsoft Internet Explorer") {
                return true;
            } else if (navigator.appName === "Netscape" && /Trident/.test(navigator.userAgent)) {
                return true;
            }
            return false;
        },
        getPluginsString: function() {
            if (this.isIE() && this.ie_activex) {
                return this.getIEPluginsString();
            } else {
                return this.getRegularPluginsString();
            }
        },
        getRegularPluginsString: function() {
            return this.map(navigator.plugins, function(p) {
                var mimeTypes = this.map(p, function(mt) {
                    return [ mt.type, mt.suffixes ].join("~");
                }).join(",");
                return [ p.name, p.description, mimeTypes ].join("::");
            }, this).join(";");
        },
        getIEPluginsString: function() {
            if (window.ActiveXObject) {
                var names = [ "ShockwaveFlash.ShockwaveFlash", "AcroPDF.PDF", "PDF.PdfCtrl", "QuickTime.QuickTime", "rmocx.RealPlayer G2 Control", "rmocx.RealPlayer G2 Control.1", "RealPlayer.RealPlayer(tm) ActiveX Control (32-bit)", "RealVideo.RealVideo(tm) ActiveX Control (32-bit)", "RealPlayer", "SWCtl.SWCtl", "WMPlayer.OCX", "AgControl.AgControl", "Skype.Detection" ];
                return this.map(names, function(name) {
                    try {
                        new ActiveXObject(name);
                        return name;
                    } catch (e) {
                        return null;
                    }
                }).join(";");
            } else {
                return "";
            }
        },
        getScreenResolution: function() {
            return [ screen.height, screen.width ];
        },
        getCanvasFingerprint: function() {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            var txt = "http://valve.github.io";
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.textBaseline = "alphabetic";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText(txt, 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText(txt, 4, 17);
            return canvas.toDataURL();
        }
    };
    return Fingerprint;
});

Adhese.prototype.Events = function() {};

Adhese.prototype.Events.prototype.add = function(type, handler, element) {
    if (!element) {
        element = window;
    }
    if (window.addEventListener) {
        element.addEventListener(type, handler, false);
    } else if (window.attachEvent) {
        element.attachEvent("on" + type, handler);
    }
};

Adhese.prototype.Events.prototype.remove = function(type, handler, element) {
    if (!element) {
        element = window;
    }
    if (window.removeEventListener) {
        element.removeEventListener(type, handler, false);
    } else if (window.attachEvent) {
        element.detachEvent("on" + type, handler);
    }
};

Adhese.prototype.criteoUserSync = function(options) {
    if (options && options.nid) {
        var crtg_nid = options.nid;
        var crtg_cookiename = "cto_rtt";
        function crtg_getCookie(c_name) {
            var i, x, y, ARRcookies = document.cookie.split(";");
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x == c_name) {
                    return unescape(y);
                }
            }
            return "";
        }
        crtg_content = crtg_getCookie(crtg_cookiename);
        var crtg_rnd = Math.floor(Math.random() * 99999999999);
        var crtg_url = "https://rtax.criteo.com/delivery/rta/rta.js?netId=" + escape(crtg_nid);
        crtg_url += "&cookieName=" + escape(crtg_cookiename);
        crtg_url += "&rnd=" + crtg_rnd;
        crtg_url += "&varName=crtg_content";
        var crtg_script = document.createElement("script");
        crtg_script.type = "text/javascript";
        crtg_script.src = crtg_url;
        crtg_script.async = true;
        if (document.getElementsByTagName("head").length > 0) {
            document.getElementsByTagName("head")[0].appendChild(crtg_script);
        } else if (document.getElementsByTagName("body").length > 0) {
            document.getElementsByTagName("body")[0].appendChild(crtg_script);
        }
        return crtg_content;
    }
};

Adhese.prototype.genericUserSync = function(option) {
    if (option && option.url && option.syncName) {
        var lastSyncCookieName = option.syncName + "_uid_last_sync";
        if (typeof option.onload == undefined || option.onload == "") option.onload = true;
        if (document.cookie.indexOf(lastSyncCookieName) == -1 || !option.syncRefreshPeriod) {
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
            if (option.syncRefreshPeriod) {
                var date = new Date();
                date.setDate(date.getDate() + 1);
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                var diff = date.getTime() - new Date().getTime();
                this.helper.createCookie(lastSyncCookieName, diff, diff / option.syncRefreshPeriod);
            }
            if (this.config && this.config.hostname) new Image().src = "https://user-sync.adhese.com/handlers/" + option.syncName + "/user_sync_discovery?domain=" + this.config.hostname;
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
    document.body.appendChild(pixel);
};

Adhese.prototype.improvedigitalUserSync = function(option) {
    var partner_id = 1;
    var domain = "user-sync.adhese.com";
    if (option && option.partner_id && option.partner_id != "") {
        partner_id = option.partner_id;
    }
    if (option && option.domain && option.domain != "") {
        domain = option.domain;
    }
    if (option && option.onload && option.onload != "") {
        onload = option.onload;
    } else {
        onload = true;
    }
    this.genericUserSync({
        url: "https://ad.360yield.com/server_match?partner_id=" + partner_id + "&r=https%3A%2F%2F" + domain + "%2Fhandlers%2Fimprovedigital%2Fuser_sync%3Fu%3D%7BPUB_USER_ID%7D",
        syncName: "improvedigital",
        iframe: true,
        onload: onload
    });
};

Adhese.prototype.pubmaticUserSync = function(option) {
    if (option && option.pubmatic_publisher_id) {
        this.genericUserSync({
            url: "https://ads.pubmatic.com/AdServer/js/user_sync.html?p=" + option.pubmatic_publisher_id + "&predirect=https%3a%2f%2fuser-sync.adhese.com%2fhandlers%2fpubmatic%2fuser_sync%3fu%3d",
            syncName: "pubmatic",
            iframe: true
        });
    }
};

Adhese.prototype.rubiconUserSync = function(option) {
    if (option && option.rp_account && option.rp_account != "") {
        this.genericUserSync({
            url: "https://secure-assets.rubiconproject.com/utils/xapi/multi-sync.html?p=" + option.rp_account + "&endpoint=eu",
            syncName: "rubicon",
            iframe: true
        });
    }
};

Adhese.prototype.spotxUserSync = function(option) {
    if (option && option.spotx_advertiser_id) {
        this.genericUserSync({
            url: "https://sync.search.spotxchange.com/partner?adv_id=" + option.spotx_advertiser_id + "&redir=https%3A%2F%2Fuser-sync.adhese.com%2Fhandlers%2Fspotx%2Fuser_sync%3Fu%3D%24SPOTX_USER_ID",
            syncName: "spotx",
            iframe: true
        });
    }
};

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
        if (!trackers[tr[j].attributes.getNamedItem("event").nodeValue]) trackers[tr[j].attributes.getNamedItem("event").value] = new Array();
        trackers[tr[j].attributes.getNamedItem("event").nodeValue].push(tr[j].firstChild.nodeValue);
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
    var code = "";
    if (ad.attributes.getNamedItem("id") && isNaN(ad.attributes.getNamedItem("id").nodeValue)) {
        code = ad.attributes.getNamedItem("id").nodeValue;
    } else if (ad.attributes.getNamedItem("code")) {
        code = ad.attributes.getNamedItem("code").nodeValue;
    } else {
        code = "preroll";
    }
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
            var code = "";
            var ad = ads[i];
            if (ad.attributes.getNamedItem("id") && isNaN(ad.attributes.getNamedItem("id").nodeValue)) {
                code = ad.attributes.getNamedItem("id").nodeValue;
            } else if (ad.attributes.getNamedItem("code")) {
                code = ad.attributes.getNamedItem("code").nodeValue;
            } else {
                code = "preroll";
            }
            var impressionNodes = ad.getElementsByTagName("Impression");
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
    if (uri) {
        for (var x = 0; x < uri.length; x++) {
            if (!this.trackedImpressions[uri[x]]) {
                this.trackedImpressions[uri[x]] = 1;
                var i = document.createElement("img");
                i.src = uri[x] + ((uri[x].indexOf("?") == -1 ? "?adhche=" : "&adhche=") + new Date().getTime());
            }
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

Adhese.prototype.SafeFrame = function(poolHost, containerID) {
    this.poolHost = poolHost;
    this.containerID = "adType";
    if (containerID) this.containerID = containerID;
    this.adhesePositions = new Array();
    this.ads = [];
    return this.init();
};

Adhese.prototype.SafeFrame.prototype.init = function() {
    this.adhesePositionConfig = new Object();
    if (this.ads && this.ads.length > 0) {
        for (index in this.ads) {
            var ad = this.ads[index];
            this.adhesePositionConfig[ad[this.containerID]] = {
                w: ad.width,
                h: ad.height,
                size: ad.width + "x" + ad.height,
                dest: ad[this.containerID],
                tgt: "_blank"
            };
        }
    }
    var conf = new $sf.host.Config({
        auto: false,
        debug: true,
        renderFile: this.poolHost + "sf/r.html",
        positions: this.adhesePositionConfig
    });
    return this;
};

Adhese.prototype.SafeFrame.prototype.addPositions = function(inAds) {
    for (var index in inAds) {
        var ad = inAds[index];
        ad.sfHtml = ad.tag;
        if (ad.ext == "js") {
            if (ad.body != undefined && ad.body != "" && ad.body.match(/<script|<SCRIPT/)) {
                ad.sfHtml = ad.body;
            } else {
                ad.sfSrc = ad.swfSrc;
            }
        }
        var posConf = new $sf.host.PosConfig({
            id: ad[this.containerID],
            w: ad.width,
            h: ad.height,
            size: ad.width + "x" + ad.height,
            dest: ad[this.containerID],
            tgt: "_blank"
        });
        this.adhesePositions.push(new $sf.host.Position({
            id: ad[this.containerID],
            html: ad.sfHtml,
            src: ad.sfSrc,
            conf: posConf
        }));
    }
};

Adhese.prototype.SafeFrame.prototype.render = function(id) {
    for (var x in this.adhesePositions) {
        if (this.adhesePositions[x].id == id) {
            $sf.host.render(this.adhesePositions[x]);
        }
    }
};

if (window["$sf"]) {
    try {
        $sf.ver = "1-1-0";
        $sf.specVersion = "1.1";
    } catch (sf_lib_err) {}
} else {
    var $sf = {
        ver: "1-1-0",
        specVersion: "1.1"
    };
}

(function(win) {
    var q = "?", a = "&", eq = "=", OBJ = "object", FUNC = "function", STR = "string", NUM = "number", RP = "replace", LEN = "length", DOC = "document", PROTO = "prototype", N = win && win.Number, M = win && win.Math, d = win && win[DOC], nav = win && win.navigator, ua = nav && nav.userAgent || "", TLC = "toLowerCase", GT = "getAttribute", ST = "setAttribute", RM = "removeAttribute", GTE = "getElementsByTagName", DCLDED = "DOMContentLoaded", S = win && win.String, back_slash = S.fromCharCode(92), two_slashes = back_slash + back_slash, dbl_quote = S.fromCharCode(34), esc_dbl_quote = back_slash + dbl_quote, plus_char = S.fromCharCode(43), scrip_str = "scr" + dbl_quote + plus_char + dbl_quote + "ipt", BLANK_URL = "about:blank", NODE_TYPE = "nodeType", IFRAME = "iframe", GC = "CollectGarbage", ie_attach = "attachEvent", w3c_attach = "addEventListener", ie_detach = "detachEvent", w3c_detach = "removeEventListener", use_attach = "", use_detach = "", use_ie_old_attach = FALSE, IAB_LIB = "$sf.lib", IAB_ENV = "$sf.env", IAB_INF = "$sf.info", IE_GC_INTERVAL = 3e3, TRUE = true, FALSE = false, NULL = null, EVT_CNCL_METHODS = {
        preventDefault: 0,
        stopImmediatePropagation: 0,
        stopPropagation: 0,
        preventBubble: 0
    }, NUM_MAX = N && N.MAX_VALUE, NUM_MIN = -1 * NUM_MAX, _es = win && win.escape, _ue = win && win.unescape, isIE11 = !window.ActiveXObject && "ActiveXObject" in window, isIE = !isIE11 && (win && "ActiveXObject" in win), next_id = 0, useOldStyleAttrMethods = FALSE, gc_timer_id = 0, dom_is_ready = NULL, dom_last_known_tag_count = 0, dom_last_known_child_node = NULL, dom_ready_chk_max_tries = 300, dom_ready_chk_try_interval = 50, dom_ready_chk_tries = 0, dom_ready_chk_timer_id = 0, iframe_next_id = 0, iframe_cbs_attached = {}, evt_tgt_prop_a = "", evt_tgt_prop_b = "", iframe_msg_host_lib = NULL, cached_ua = NULL, _cstr, _cnum, _callable, lang, dom, gc;
    (function() {
        var proto;
        function noop() {}
        function cstr(str) {
            var typ = typeof str;
            if (typ == STR) return str;
            if (typ == NUM && !str) return "0";
            if (typ == OBJ && str && str.join) return str.join("");
            if (str === false) return "false";
            if (str === true) return "true";
            return str ? S(str) : "";
        }
        function cbool(val) {
            return !val || val == "0" || val == "false" || val == "no" || val == "undefined" || val == "null" ? FALSE : TRUE;
        }
        function cnum(val, defVal, minVal, maxVal) {
            var e;
            if (typeof val != NUM) {
                try {
                    if (!val) {
                        val = N.NaN;
                    } else {
                        val = parseFloat(val);
                    }
                } catch (e) {
                    val = N.NaN;
                }
            }
            if (maxVal == NULL) {
                maxVal = NUM_MAX;
            }
            if (minVal == NULL) {
                minVal = NUM_MIN;
            }
            return (isNaN(val) || val < minVal || val > maxVal) && defVal != NULL ? defVal : val;
        }
        function callable(f) {
            var e;
            try {
                f = f && typeof f == FUNC && f.toString() && new f.constructor() ? f : NULL;
            } catch (e) {
                f = NULL;
            }
            return !!f;
        }
        function guid(prefix) {
            return cstr([ prefix || "", "_", time(), "_", rand(), "_", next_id++ ]);
        }
        function mix(r, s, owned, skipFuncs, no_ovr) {
            var item, p, typ;
            if (!s || !r) return r;
            for (p in s) {
                item = s[p];
                typ = typeof item;
                if (owned && !s.hasOwnProperty(p)) continue;
                if (no_ovr && p in r) continue;
                if (skipFuncs && typ == FUNC) continue;
                if (typ == OBJ && item) {
                    if (item.slice) {
                        item = mix([], item);
                    } else {
                        item = mix({}, item);
                    }
                }
                r[p] = item;
            }
            return r;
        }
        function time() {
            return new Date().getTime();
        }
        function rand() {
            return M.round(M.random() * 100);
        }
        function trim(str) {
            var ret = cstr(str);
            return ret && ret[RP](/^\s\s*/, "")[RP](/\s\s*$/, "");
        }
        function def(str_ns, aug, root, no_ovr) {
            var obj = root && typeof root == OBJ ? root : win, idx = 0, per = ".", ret = NULL, ar, item;
            if (str_ns) {
                str_ns = cstr(str_ns);
                aug = aug && typeof aug == OBJ ? aug : NULL;
                if (str_ns.indexOf(per)) {
                    ar = str_ns.split(per);
                    while (item = ar[idx++]) {
                        item = trim(item);
                        if (idx == ar[LEN]) {
                            if (obj[item] && aug) {
                                ret = obj[item] = mix(obj[item], aug, FALSE, NULL, no_ovr);
                            } else {
                                if (no_ovr && item in obj) {
                                    ret = obj[item];
                                } else {
                                    ret = obj[item] = obj[item] || aug || {};
                                }
                            }
                        } else {
                            if (no_ovr && item in obj) {
                                ret = obj[item];
                            } else {
                                ret = obj[item] = obj[item] || {};
                            }
                        }
                        obj = obj[item];
                    }
                } else {
                    if (obj[str_ns] && aug) {
                        ret = obj[str_ns] = mix(obj[str_ns], aug, FALSE, NULL, no_ovr);
                    } else {
                        ret = obj[str_ns] = obj[str_ns] || aug || {};
                    }
                }
            }
            return ret;
        }
        function ns(str_ns, root) {
            var exp = /(\[(.{1,})\])|(\.\w+)/gm, exp2 = /\[(('|")?)((\s|.)*?)(('|")?)\]/gm, exp3 = /(\[.*)|(\..*)/g, exp4 = /\./gm, idx = 0, rootStr = "", exists = TRUE, obj, matches, prop;
            obj = root = root || win;
            if (str_ns) {
                str_ns = cstr(str_ns);
                if (str_ns) {
                    str_ns = trim(str_ns);
                    matches = str_ns.match(exp);
                    if (matches) {
                        rootStr = str_ns[RP](exp3, "");
                        matches.unshift(rootStr);
                        while (prop = matches[idx++]) {
                            prop = prop[RP](exp2, "$3")[RP](exp4, "");
                            if (!obj[prop]) {
                                exists = FALSE;
                                break;
                            }
                            obj = obj[prop];
                        }
                    } else {
                        prop = str_ns;
                        obj = obj[prop];
                    }
                } else {
                    exists = FALSE;
                }
            } else {
                exists = FALSE;
            }
            return exists && obj || FALSE;
        }
        function isArray(obj) {
            if (obj == null) {
                return false;
            }
            if (typeof obj === "string") {
                return false;
            }
            if (obj.length != null && obj.constructor == Array) {
                return true;
            }
            return false;
        }
        function _escaped_backslash() {
            return two_slashes;
        }
        function _escaped_dbl_quote() {
            return esc_dbl_quote;
        }
        function _escaped_return() {
            return "\\r";
        }
        function _escaped_new_line() {
            return "\\n";
        }
        function _safe_script_tag(main_match, back_slash, attrs) {
            return cstr([ "<", back_slash, scrip_str, attrs, ">" ]);
        }
        function jssafe_html(str) {
            var new_str = cstr(str);
            if (new_str) {
                new_str = new_str.replace(/(<noscript[^>]*>)(\s*?|.*?)(<\/noscript>)/gim, "");
                new_str = new_str.replace(/\\/g, _escaped_backslash);
                new_str = new_str.replace(/\"/g, _escaped_dbl_quote);
                new_str = new_str.replace(/\n/g, _escaped_new_line);
                new_str = new_str.replace(/\r/g, _escaped_return);
                new_str = new_str.replace(/<(\/)*script([^>]*)>/gi, _safe_script_tag);
                new_str = new_str.replace(/\t/gi, " ");
                new_str = cstr([ dbl_quote, new_str, dbl_quote ]);
                new_str = dbl_quote + new_str + dbl_quote;
            }
            return new_str;
        }
        function ParamHash(sString, sPropDelim, sValueDelim, bNoOverwrite, bRecurse) {
            var idx, idx2, idx3, sTemp, sTemp2, sTemp3, me = this, pairs, nv, nm, added, cnt, io = "indexOf", ss = "substring", doAdd = FALSE, obj, len, len2;
            if (!(me instanceof ParamHash)) return new ParamHash(sString, sPropDelim, sValueDelim, bNoOverwrite, bRecurse);
            if (!arguments[LEN]) return me;
            if (sString && typeof sString == OBJ) return mix(new ParamHash("", sPropDelim, sValueDelim, bNoOverwrite, bRecurse), sString);
            sString = cstr(sString);
            sPropDelim = cstr(sPropDelim) || a;
            sValueDelim = cstr(sValueDelim) || eq;
            if (!sString) return me;
            if (sPropDelim != q && sValueDelim != q && sString.charAt(0) == q) sString = sString[ss](1);
            idx = sString[io](q);
            idx2 = sString[io](sValueDelim);
            if (idx != -1 && idx2 != -1 && idx > idx2) {
                sTemp = _es(sString[ss](idx2 + 1));
                sTemp2 = sString.substr(0, idx2 + 1);
                sString = sTemp2 + sTemp;
            } else if (idx != -1) {
                sString = sString[ss](idx + 1);
                return new ParamHash(sString, sPropDelim, sValueDelim, bNoOverwrite);
            }
            if (sString.charAt(0) == sPropDelim) sString = sString[ss](1);
            pairs = sString.split(sPropDelim);
            cnt = pairs[LEN];
            idx = 0;
            while (cnt--) {
                sTemp = pairs[idx++];
                added = FALSE;
                doAdd = FALSE;
                if (sTemp) {
                    nv = sTemp.split(sValueDelim);
                    len = nv[LEN];
                    if (len > 2) {
                        nm = _ue(nv[0]);
                        nv.shift();
                        if (bRecurse) {
                            sTemp2 = nm + sValueDelim;
                            idx2 = sString[io](sTemp2);
                            len = sTemp2[LEN];
                            sTemp3 = sString[ss](idx2 + len);
                            sTemp2 = sPropDelim + sPropDelim;
                            len2 = sTemp2[LEN];
                            idx3 = sTemp3[io](sTemp2);
                            if (idx3 != -1) {
                                sTemp3 = sString.substr(idx2 + len, idx3 + len2);
                                obj = new ParamHash(sTemp3, sPropDelim, sValueDelim, bNoOverwrite, bRecurse);
                                sTemp3 = "";
                                len = 0;
                                for (sTemp3 in obj) len++;
                                if (len > 0) idx += len - 1;
                                sTemp = obj;
                            } else {
                                sTemp = _ue(nv.join(sValueDelim));
                            }
                        } else {
                            sTemp = _ue(nv.join(sValueDelim));
                        }
                        doAdd = TRUE;
                    } else if (len == 2) {
                        nm = _ue(nv[0]);
                        sTemp = _ue(nv[1]);
                        doAdd = TRUE;
                    }
                    if (doAdd) {
                        if (bNoOverwrite) {
                            if (!(nm in me)) {
                                me[nm] = sTemp;
                                added = TRUE;
                            }
                        } else {
                            me[nm] = sTemp;
                            added = TRUE;
                        }
                        if (bRecurse && added && nm && sTemp && typeof sTemp != OBJ && (sTemp[io](sPropDelim) >= 0 || sTemp[io](sValueDelim) >= 0)) {
                            me[nm] = new ParamHash(sTemp, sPropDelim, sValueDelim, bNoOverwrite, bRecurse);
                        }
                    }
                }
            }
        }
        proto = ParamHash[PROTO];
        function toString(sPropDelim, sValueDelim, escapeProp, dontEscapeValue) {
            var prop, buffer = [], me = this, itemType, item;
            sPropDelim = sPropDelim || a;
            sValueDelim = sValueDelim || eq;
            for (prop in me) {
                item = me[prop];
                itemType = typeof item;
                if (item && itemType == FUNC) continue;
                if (item && itemType == OBJ) {
                    item = toString.apply(item, [ sPropDelim, sValueDelim, escapeProp, dontEscapeValue ]);
                }
                if (escapeProp) prop = _es(prop);
                if (!dontEscapeValue) item = _es(item);
                buffer.push(prop, sValueDelim, item, sPropDelim);
            }
            return cstr(buffer);
        }
        proto.toString = proto.valueOf = toString;
        lang = def(IAB_LIB + ".lang", {
            ParamHash: ParamHash,
            cstr: cstr,
            cnum: cnum,
            cbool: cbool,
            noop: noop,
            trim: trim,
            callable: callable,
            guid: guid,
            mix: mix,
            time: time,
            rand: rand,
            def: def,
            ns: ns,
            jssafe_html: jssafe_html,
            isArray: isArray
        });
        def("$sf.env", {
            isIE: isIE
        });
        _cstr = cstr;
        _cnum = cnum;
        _callable = callable;
    })();
    (function() {
        function _numberify(s) {
            var c = 0;
            return parseFloat(s.replace(/\./g, function() {
                return c++ == 1 ? "" : ".";
            }));
        }
        function _matchIt(str, regEx, idx) {
            var m = str && str.match(regEx);
            return idx == NULL ? m : m && m[idx] || NULL;
        }
        function _testIt(regEx, str) {
            return regEx.test(str);
        }
        function parse_ua(subUA) {
            var ret = {}, match, date = new Date();
            if (!subUA && cached_ua) return cached_ua;
            ret.ie = ret.opera = ret.gecko = ret.webkit = ret.safari = ret.chrome = ret.air = ret.ipod = ret.ipad = ret.iphone = ret.android = ret.webos = ret.silk = ret.nodejs = ret.phantomjs = 0;
            ret.mobile = ret.ios = ret.os = NULL;
            ret.accel = false;
            ret.caja = nav && nav.cajaVersion;
            ret.cks = FALSE;
            subUA = subUA || ua || "";
            if (subUA) {
                if (_testIt(/windows|win32/i, subUA)) {
                    ret.os = "windows";
                } else if (_testIt(/macintosh|mac_powerpc/i, subUA)) {
                    ret.os = "macintosh";
                } else if (_testIt(/android/i, subUA)) {
                    ret.os = "android";
                } else if (_testIt(/symbos/i, subUA)) {
                    ret.os = "symbos";
                } else if (_testIt(/linux/i, subUA)) {
                    ret.os = "linux";
                } else if (_testIt(/rhino/i, subUA)) {
                    ret.os = "rhino";
                }
                if (_testIt(/KHTML/, subUA)) {
                    ret.webkit = 1;
                }
                if (_testIt(/IEMobile|XBLWP7/, subUA)) {
                    ret.mobile = "windows";
                }
                if (_testIt(/Fennec/, subUA)) {
                    ret.mobile = "gecko";
                }
                match = _matchIt(subUA, /AppleWebKit\/([^\s]*)/, 1);
                if (match) {
                    ret.webkit = _numberify(match);
                    ret.safari = ret.webkit;
                    if (_testIt(/PhantomJS/, subUA)) {
                        match = _matchIt(subUA, /PhantomJS\/([^\s]*)/, 1);
                        if (match) {
                            ret.phantomjs = _numberify(match);
                        }
                    }
                    if (_testIt(/ Mobile\//, subUA) || _testIt(/iPad|iPod|iPhone/, subUA)) {
                        ret.mobile = "Apple";
                        match = _matchIt(subUA, /OS ([^\s]*)/, 1);
                        match = match && _numberify(match.replace("_", "."));
                        ret.ios = match;
                        ret.ipad = ret.ipod = ret.iphone = 0;
                        match = _matchIt(subUA, /iPad|iPod|iPhone/, 0);
                        if (match) {
                            ret[match[TLC]()] = ret.ios;
                        }
                    } else {
                        match = _matchIt(subUA, /NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/, 0);
                        if (match) {
                            ret.mobile = match;
                        }
                        if (_testIt(/webOS/, subUA)) {
                            ret.mobile = "WebOS";
                            match = _matchIt(subUA, /webOS\/([^\s]*);/, 1);
                            if (match) {
                                ret.webos = _numberify(match);
                            }
                        }
                        if (_testIt(/ Android/, subUA)) {
                            ret.mobile = "Android";
                            match = _matchIt(subUA, /Android ([^\s]*);/, 1);
                            if (match) {
                                ret.android = _numberify(match);
                            }
                        }
                        if (_testIt(/Silk/, subUA)) {
                            match = _matchIt(subUA, /Silk\/([^\s]*)\)/, 1);
                            if (match) {
                                ret.silk = _numberify(match);
                            }
                            if (!ret.android) {
                                ret.android = 2.34;
                                ret.os = "Android";
                            }
                            if (_testIt(/Accelerated=true/, subUA)) {
                                ret.accel = true;
                            }
                        }
                    }
                    match = subUA.match(/(Chrome|CrMo)\/([^\s]*)/);
                    if (match && match[1] && match[2]) {
                        ret.chrome = _numberify(match[2]);
                        ret.safari = 0;
                        if (match[1] === "CrMo") {
                            ret.mobile = "chrome";
                        }
                    } else {
                        match = _matchIt(subUA, /AdobeAIR\/([^\s]*)/);
                        if (match) {
                            ret.air = match[0];
                        }
                    }
                }
                if (!ret.webkit) {
                    match = _matchIt(subUA, /Opera[\s\/]([^\s]*)/, 1);
                    if (match) {
                        ret.opera = _numberify(match);
                        match = _matchIt(subUA, /Opera Mini[^;]*/, 0);
                        if (match) {
                            ret.mobile = match;
                        }
                    } else {
                        match = _matchIt(subUA, /MSIE\s([^;]*)/, 1);
                        if (match) {
                            ret.ie = _numberify(match);
                        } else {
                            match = _matchIt(subUA, /Gecko\/([^\s]*)/);
                            if (match) {
                                ret.gecko = 1;
                                match = _matchIt(subUA, /rv:([^\s\)]*)/, 1);
                                if (match) {
                                    ret.gecko = _numberify(match);
                                }
                            }
                        }
                    }
                }
            }
            try {
                date.setTime(date.getTime() + 1e3);
                d.cookie = cstr([ "sf_ck_tst=test; expires=", date.toGMTString(), "; path=/" ]);
                if (d.cookie.indexOf("sf_ck_tst") != -1) ret.cks = TRUE;
            } catch (e) {
                ret.cks = FALSE;
            }
            try {
                if (typeof process == OBJ) {
                    if (process.versions && process.versions.node) {
                        ret.os = process.platform;
                        ret.nodejs = numberify(process.versions.node);
                    }
                }
            } catch (e) {
                ret.nodejs = 0;
            }
            return ret;
        }
        cached_ua = parse_ua();
        cached_ua.parse = parse_ua;
        lang.def(IAB_ENV + ".ua", cached_ua, NULL, TRUE);
    })();
    (function() {
        function _clear_ready_timer_check() {
            if (dom_ready_chk_timer_id) {
                clearTimeout(dom_ready_chk_timer_id);
                dom_ready_chk_timer_id = 0;
            }
        }
        function _handle_dom_load_evt(evt) {
            detach(win, "load", _handle_dom_load_evt);
            detach(win, DCLDED, _handle_dom_load_evt);
            dom_is_ready = TRUE;
        }
        function _ready_state_check() {
            var b, kids, tag_cnt, lst, e;
            _clear_ready_timer_check();
            if (dom_ready_chk_tries >= dom_ready_chk_max_tries) {
                dom_last_known_child_node = NULL;
                dom_is_ready = TRUE;
            }
            if (dom_is_ready === NULL) {
                try {
                    b = d && d.body;
                    kids = b && tags("*", b);
                    tag_cnt = kids && kids[LEN];
                    lst = b && b.lastChild;
                } catch (e) {
                    dom_last_known_tag_count = 0;
                    dom_last_known_child_node = NULL;
                }
                if (dom_last_known_tag_count && tag_cnt == dom_last_known_tag_count && lst == dom_last_known_child_node) {
                    dom_last_known_child_node = NULL;
                    dom_is_ready = TRUE;
                } else {
                    dom_last_known_tag_count = tag_cnt;
                    dom_last_known_child_node = lst;
                    dom_ready_chk_tries += 1;
                    dom_ready_chk_timer_id = setTimeout(_ready_state_check, dom_ready_chk_try_interval);
                }
            } else {
                dom_last_known_child_node = NULL;
            }
        }
        function _unbind_iframe_onload(el) {
            var id = attr(el, "id"), oldCB;
            oldCB = id && iframe_cbs_attached[id];
            if (oldCB) {
                detach(el, "load", oldCB);
                iframe_cbs_attached[id] = NULL;
                delete iframe_cbs_attached[id];
            }
        }
        function _bind_iframe_onload(el, cb) {
            var newCB, id;
            if (_callable(cb)) {
                newCB = function(evt) {
                    var tgt = evtTgt(evt), e;
                    _unbind_iframe_onload(tgt);
                    if (tgt && cb) {
                        try {
                            cb.call(tgt, evt);
                        } catch (e) {}
                    }
                    tgt = el = cb = newCB = id = NULL;
                };
                id = attr(el, "id");
                _unbind_iframe_onload(el);
                if (id) iframe_cbs_attached[id] = newCB;
                attach(el, "load", newCB);
            }
            newCB = NULL;
        }
        function _byID(el) {
            return el && typeof el == STR ? elt(el) || el : el;
        }
        function _call_xmsg_host(methName, arg1, arg2, arg3) {
            var e;
            try {
                if (!iframe_msg_host_lib) iframe_msg_host_lib = dom.msghost;
            } catch (e) {
                iframe_msg_host_lib = NULL;
            }
            if (win != top) return;
            return methName && iframe_msg_host_lib && iframe_msg_host_lib[methName] && iframe_msg_host_lib[methName](arg1, arg2, arg3);
        }
        function doc(el) {
            var d = NULL;
            try {
                if (el) {
                    if (el[NODE_TYPE] == 9) {
                        d = el;
                    } else {
                        d = el[DOC] || el.ownerDocument || NULL;
                    }
                }
            } catch (e) {
                d = NULL;
            }
            return d;
        }
        function view(el) {
            var w = NULL, d, prop1 = "parentWindow", prop2 = "defaultView";
            try {
                if (el) {
                    w = el[prop1] || el[prop2] || NULL;
                    if (!w) {
                        d = doc(el);
                        w = d && (d[prop1] || d[prop2]) || NULL;
                    }
                }
            } catch (e) {
                w = NULL;
            }
            return w;
        }
        function elt(id) {
            var args = arguments, len = args[LEN], dc;
            if (len > 1) {
                dc = doc(args[1]);
            } else {
                dc = d;
            }
            return dc && dc.getElementById(id) || NULL;
        }
        function tagName(el) {
            return el && el[NODE_TYPE] == 1 && el.tagName[TLC]() || "";
        }
        function tags(name, parNode) {
            var ret = [], e;
            try {
                if (parNode && parNode[GTE]) {
                    ret = parNode[GTE](name) || ret;
                } else {
                    ret = d[GTE](name) || ret;
                }
            } catch (e) {
                ret = [];
            }
            return ret;
        }
        function par(el) {
            return el && (el.parentNode || el.parentElement);
        }
        function attr(el, attrName, attrVal) {
            var e;
            try {
                if (arguments[LEN] > 2) {
                    if (attrVal === NULL) {
                        if (useOldStyleAttrMethods) {
                            el[RM](attrName, 0);
                        } else {
                            el[RM](attrName);
                        }
                    } else {
                        attrVal = _cstr(attrVal);
                        if (attrName[TLC]() == "class") {
                            el.className = attrVal;
                        } else {
                            if (useOldStyleAttrMethods) {
                                el[ST](attrName, attrVal, 0);
                            } else {
                                el[ST](attrName, attrVal);
                            }
                        }
                    }
                } else {
                    if (useOldStyleAttrMethods) {
                        attrVal = _cstr(el[GT](attrName, 0));
                    } else {
                        attrVal = _cstr(el[GT](attrName));
                    }
                }
            } catch (e) {
                attrVal = "";
            }
            return attrVal;
        }
        function css(el, val) {
            var st;
            try {
                st = el.style;
                if (arguments[LEN] > 1) {
                    st.cssText = _cstr(val);
                } else {
                    val = st.cssText;
                }
            } catch (e) {
                val = "";
            }
            return val;
        }
        function make_element(tagName, par) {
            return (arguments[LEN] > 1 && doc(par) || d).createElement(tagName);
        }
        function append(parNode, child) {
            var success = FALSE, e;
            try {
                if (parNode) success = parNode.appendChild(child);
            } catch (e) {
                success = FALSE;
            }
            return success;
        }
        function purge(node) {
            var success = FALSE, parNode, isIFrame = tagName(node) == IFRAME, e;
            if (isIFrame) {
                _call_xmsg_host("detach", node);
                _unbind_iframe_onload(node);
                if (!isIE) attr(node, "src", BLANK_URL);
            }
            try {
                parNode = par(node);
                if (parNode) {
                    parNode.removeChild(node);
                    success = TRUE;
                    if (isIE && isIFrame) gc();
                }
            } catch (e) {}
            node = parNode = NULL;
            return success;
        }
        function attach(obj, name, cb) {
            try {
                if (use_ie_old_attach) {
                    obj[use_attach]("on" + name, cb);
                } else {
                    obj[use_attach](name, cb, FALSE);
                }
            } catch (e) {}
            obj = cb = NULL;
        }
        function detach(obj, name, cb) {
            try {
                if (use_ie_old_attach) {
                    obj.detachEvent("on" + name, cb);
                } else {
                    obj.removeEventListener(name, cb, FALSE);
                }
            } catch (e) {}
            obj = cb = NULL;
        }
        function ready() {
            var rs;
            _clear_ready_timer_check();
            if (dom_is_ready) {
                dom_last_known_child_node = NULL;
                return TRUE;
            }
            rs = d.readyState;
            if (rs) {
                dom_last_known_child_node = NULL;
                if (rs == "loaded" || rs == "complete") {
                    dom_is_ready = TRUE;
                } else {
                    dom_is_ready = FALSE;
                }
            }
            dom_last_known_child_node = NULL;
            dom_ready_chk_tries = dom_last_known_tag_count = 0;
            _ready_state_check();
            return !!dom_is_ready;
        }
        function wait(cb) {
            var rdy = ready(), e;
            if (rdy) {
                try {
                    if (lang.callable(cb)) cb();
                } catch (e) {
                    e = NULL;
                }
                return;
            }
            setTimeout(function() {
                wait(cb);
                cb = NULL;
            }, dom_ready_chk_try_interval + 1);
        }
        function evtCncl(evt) {
            var prop = "", e;
            evt = evt || win.event;
            if (evt) {
                try {
                    evt.returnValue = FALSE;
                } catch (e) {}
                try {
                    evt.cancelBubble = TRUE;
                } catch (e) {}
                try {
                    evt.stopped = TRUE;
                } catch (e) {}
                for (prop in EVT_CNCL_METHODS) {
                    if (EVT_CNCL_METHODS[prop]) {
                        try {
                            evt[prop]();
                        } catch (e) {}
                    }
                }
            }
            return FALSE;
        }
        function evtTgt(evt) {
            var tgt = NULL;
            try {
                evt = evt || win.event;
                tgt = evt ? evt[evt_tgt_prop_a] || evt[evt_tgt_prop_b] : NULL;
            } catch (e) {
                tgt = NULL;
            }
            return tgt;
        }
        function clone_iframe(el, attrs, cssText, cb, xmsgCB) {
            return _clone_iframe(el, attrs, cssText, cb, xmsgCB);
        }
        function _clone_iframe(el, attrs, cssText, cb, xmsgCB, iframe_skip_clone) {
            var bufferHTML = [ "<", IFRAME, " " ], xmsgPipe = "", prop, temp, cl, newCl, html, attrStr;
            if (!iframe_skip_clone) {
                el = _byID(el);
                if (tagName(el) != IFRAME) return NULL;
                cl = el.cloneNode(FALSE);
            } else {
                cl = el;
            }
            attrs = attrs || {};
            if ("src" in attrs) {
                attr(cl, "src", NULL);
            } else {
                attrs.src = attr(el, "src") || BLANK_URL;
            }
            if ("name" in attrs) {
                attr(cl, "name", NULL);
            } else {
                attrs.name = attr(el, "name");
            }
            if (!attrs.src) attrs.src = BLANK_URL;
            xmsgPipe = xmsgCB && _call_xmsg_host("prep", attrs);
            if (!iframe_skip_clone) {
                attr(cl, "width", NULL);
                attr(cl, "height", NULL);
            }
            if (cssText) {
                temp = css(cl);
                if (temp && temp.charAt(temp[LEN] - 1) != ";") temp += ";";
                css(cl, [ temp, _cstr(cssText) ]);
            }
            temp = make_element("div");
            append(temp, cl);
            html = temp.innerHTML;
            attrStr = html.replace(/<iframe(.*?)>(.*?)<\/iframe>/gim, "$1");
            bufferHTML.push('name="', attrs.name, '" ', attrStr, "></", IFRAME, ">");
            delete attrs.name;
            temp.innerHTML = _cstr(bufferHTML);
            newCl = temp.firstChild;
            for (prop in attrs) {
                attr(newCl, prop, attrs[prop]);
            }
            if (!attr(newCl, "id")) {
                attr(newCl, "id", "sf_" + IFRAME + "_" + iframe_next_id);
                iframe_next_id++;
            }
            attr(newCl, "FRAMEBORDER", "no");
            attr(newCl, "SCROLLING", "no");
            attr(newCl, "ALLOWTRANSPARENCY", TRUE);
            attr(newCl, "HIDEFOCUS", TRUE);
            attr(newCl, "TABINDEX", -1);
            attr(newCl, "MARGINWIDTH", 0);
            attr(newCl, "MARGINHEIGHT", 0);
            _bind_iframe_onload(newCl, cb);
            if (xmsgPipe) _call_xmsg_host("attach", newCl, xmsgPipe, xmsgCB);
            xmsgPipe = xmsgCB = cl = cb = el = temp = null;
            return newCl;
        }
        function make_iframe(attrs, cssText, cb, xmsgCB) {
            return _clone_iframe(make_element(IFRAME), attrs, cssText, cb, xmsgCB, TRUE);
        }
        function replace_iframe(attrs, cssText, parRef, cb, xmsgCB) {
            var cl, el, frameEl, elID, tgn, parNode, e;
            attrs = attrs || {};
            elID = attrs.id;
            el = elID && _byID(elID);
            tgn = tagName(el);
            el = tgn ? el : NULL;
            frameEl = tgn == IFRAME ? el : NULL;
            if (frameEl) {
                _call_xmsg_host("detach", frameEl);
                _unbind_iframe_onload(frameEl);
                parNode = par(frameEl);
                cl = clone_iframe(frameEl, attrs, cssText, cb, xmsgCB);
                attr(cl, "onload", NULL);
                attr(cl, "onreadystatechange", NULL);
            } else {
                if (parRef) {
                    parRef = _byID(parRef);
                    if (tagName(parRef)) parNode = parRef;
                }
                if (!parNode && el) parNode = par(el);
                cssText = _cstr(cssText) || css(el) || "";
                cl = make_iframe(attrs, cssText, cb, xmsgCB);
            }
            try {
                if (!parNode) {
                    append(d.body, cl);
                } else {
                    if (frameEl) {
                        parNode.replaceChild(cl, frameEl);
                    } else {
                        if (el) {
                            parNode.replaceChild(cl, el);
                        } else {
                            append(parNode, cl);
                        }
                    }
                }
            } catch (e) {}
            cl = el = attrs = frameEl = parNode = cb = NULL;
            return elt(elID);
        }
        function iframe_view(el) {
            var win, elWin, elDoc, frame_list, frame, fe, idx = 0, e, err;
            try {
                win = el.contentWindow || NULL;
                if (!win) {
                    elDoc = doc(el);
                    elWin = elDoc && view(elDoc);
                    frame_list = elWin && elWin.frames || [];
                    while (frame = frame_list[idx++]) {
                        try {
                            fe = frame.frameElement;
                        } catch (err) {
                            fe = NULL;
                        }
                        if (fe && fe == el) {
                            win = frame;
                            break;
                        }
                    }
                }
            } catch (e) {
                win = NULL;
            }
            return win;
        }
        function logInfo(message) {
            if (win.console && console.log) {
                console.log(message);
            }
        }
        function logError(message) {
            if (win.console && console.error) {
                console.error(message);
            } else if (win.console && console.log) {
                console.log(message);
            }
        }
        (function() {
            var obj, ATTR_NAME = "SCROLLING", CREATE_EVENT = "createEvent", EVT_TYPE = "UIEvent", prop, err;
            if (isIE) {
                evt_tgt_prop_a = "srcElement";
                evt_tgt_prop_b = "target";
                obj = make_element(IFRAME);
                attr(obj, ATTR_NAME, "no");
                useOldStyleAttrMethods = attr(obj, ATTR_NAME) != "no";
                if (GC in win) {
                    gc = function() {
                        if (gc_timer_id) clearTimeout(gc_timer_id);
                        gc_timer_id = setTimeout(function() {
                            try {
                                win[GC]();
                            } catch (e) {}
                        }, IE_GC_INTERVAL);
                    };
                } else {
                    gc = _lang.noop;
                }
            } else {
                evt_tgt_prop_a = "target";
                evt_tgt_prop_b = "currentTarget";
            }
            if (win[w3c_attach] && !isIE) {
                use_attach = w3c_attach;
                use_detach = w3c_detach;
            } else if (isIE) {
                use_ie_old_attach = TRUE;
                use_attach = ie_attach;
                use_detach = ie_detach;
            }
            obj = NULL;
            try {
                obj = d[CREATE_EVENT](EVT_TYPE);
            } catch (err) {
                obj = NULL;
            }
            if (!obj) {
                try {
                    obj = d[CREATE_EVENT](EVT_TYPE + "s");
                } catch (err) {
                    obj = NULL;
                }
            }
            if (obj) {
                for (prop in EVT_CNCL_METHODS) {
                    if (obj[prop]) EVT_CNCL_METHODS[prop] = 1;
                }
            }
            obj = NULL;
            attach(win, "load", _handle_dom_load_evt);
            attach(win, DCLDED, _handle_dom_load_evt);
            dom = lang.def(IAB_LIB + ".dom", {
                doc: doc,
                view: view,
                elt: elt,
                tagName: tagName,
                tags: tags,
                par: par,
                make: make_element,
                css: css,
                attr: attr,
                gc: gc,
                append: append,
                purge: purge,
                attach: attach,
                detach: detach,
                ready: ready,
                wait: wait,
                evtCncl: evtCncl,
                evtTgt: evtTgt
            }, NULL, TRUE);
        })();
        iframes = lang.def(IAB_LIB + ".dom.iframes", {
            make: make_iframe,
            clone: clone_iframe,
            replace: replace_iframe,
            view: iframe_view
        }, NULL, TRUE);
        logger = lang.def(IAB_LIB + ".logger", {
            log: logInfo,
            error: logError
        }, NULL, TRUE);
        info = lang.def(IAB_INF, {
            errs: [],
            list: []
        }, NULL, TRUE);
        if (!S[PROTO].trim) S[PROTO].trim = lang.trim;
    })();
})(window);

(function(win) {
    var NULL = null, TRUE = true, FALSE = false, DEFAULT_RENDER_TIMEOUT = 6e4, POS_ID_AUTO_PREFIX = "sf_pos", POS_REL_BOX_ID_PREFIX = "sf_pos_rel_el", SF_DATATAG_CLASS = "sf_data", SF_POSELEM_WRAPPER_CLASS = "sf_position", AUTO_BOOT_MAX_RETRIES = 100, GEOM_UPDATE_INTRVAL = 750, XCOM_RESP_DELAY = 1, IE_BORDER_ADJ = 2, INTERSECT_FACTOR = 10, BF_POS_MSG = "onBeforePosMsg", POS_MSG = "onPosMsg", SUPPORTS_FEATURES = {
        "exp-ovr": 1,
        "exp-push": 0,
        bg: 0,
        pin: 0,
        "read-cookie": 0,
        "write-cookie": 0
    }, EXPAND_COMMAND = "exp-ovr", COLLAPSE_COMMAND = "collapse", ERROR_COMMAND = "error", NOTIFY_EXPAND = "expand", NOTIFY_GEOM_UPDATE = "geom-update", NOTIFY_COLLAPSE = COLLAPSE_COMMAND, NOTIFY_FOCUS_CHANGE = "focus-change", DEFAULT_ZINDEX = 3e3, OBJ = "object", FUNC = "function", STR = "string", ST = "style", PROTO = "prototype", LEN = "length", WIDTH = "width", HEIGHT = "height", PX = "PX", CLIP = "clip", SCROLL = "scroll", ONSCROLL = "onscroll", COMPAT_MODE = "compatMode", DOC_EL = "documentElement", DOC = "document", NODE_TYPE = "nodeType", CONTAINS = "contains", COMPARE_DOC_POS = "compareDocumentPosition", EL_FROM_PT = "elementFromPoint", AUTO = "auto", HIDDEN = "hidden", OVER = "overflow", TFXD = "toFixed", ATTACH = "attach", DETACH = "detach", MSG = "message", PMSG = "postMessage", GUID = "guid", FLASH_MIME = "application/x-shockwave-flash", sf = win && win.$sf, VERSION = sf && sf.ver, env = sf && sf.env, ua = env && env.ua, lib = sf && sf.lib, lang = lib && lib.lang, dom = lib && lib.dom, iframes = dom && dom.iframes, _cbool = lang && lang.cbool, _cnum = lang && lang.cnum, _cstr = lang && lang.cstr, _callable = lang && lang.callable, _noop = lang && lang.noop, _guid = lang && lang[GUID], _mix = lang && lang.mix, _elt = dom && dom.elt, _par = dom && dom.par, _tags = dom && dom.tags, _attr = dom && dom.attr, _doc = dom && dom.doc, _tagName = dom && dom.tagName, _view = dom && dom.view, _ifr_view = iframes && iframes.view, _purge = dom && dom.purge, _ready = dom && dom.ready, _es = win && win.escape, M = win && win.Math, _max = M && M.max, _min = M && M.min, _round = M && M.round, _rect = NULL, ParamHash = lang && lang.ParamHash, dc = win && win[DOC], isIE = env && env.isIE, ieVer = ua && ua.ie || 0, wbVer = ua && ua.webkit || 0, geckVer = ua && ua.gecko || 0, operaVer = ua && ua.opera || 0, loc = win && win.location, locHost = loc && (loc.protocol + "//" + (loc.host || loc.hostname) || ""), rendered_ifrs = {}, msg_pipes = {}, ifr_dest_id_map = {}, pending_ifrs = {}, complete_ifrs = {}, scroll_parents_attached = {}, mgr_bounds_details = FALSE, canUseHTML5 = FALSE, html5Bound = FALSE, win_events_attached = FALSE, geom_update_timer = 0, focus_update_timer = 0, current_status = NULL, msghostfb = NULL, flash_ver = NULL, config = NULL;
    var flashActiveXVersions = [ "ShockwaveFlash.ShockwaveFlash.11", "ShockwaveFlash.ShockwaveFlash.8", "ShockwaveFlash.ShockwaveFlash.7", "ShockwaveFlash.ShockwaveFlash.6", "ShockwaveFlash.ShockwaveFlash" ];
    function Config(conf) {
        var me = this, pos_map, conf_pos_map, posID, pos_conf, pos_id, boot_up;
        if (!arguments.length) return config ? _mix({}, config) : NULL;
        if (!(me instanceof Config)) return new Config(conf);
        if (!conf) {
            config = NULL;
            return NULL;
        }
        boot_up = !!config;
        me.auto = "auto" in conf ? _cbool(conf.auto) : TRUE;
        me.cdn = _cstr(conf.cdn);
        me.debug = _cbool(conf.debug);
        me.root = _cstr(conf.root);
        me.renderFile = _cstr(conf.renderFile);
        me.msgFile = _cstr(conf.msgFile);
        me.to = _cnum(conf.to, DEFAULT_RENDER_TIMEOUT);
        me.ver = _cstr(conf.ver) || VERSION;
        me.onBeforePosMsg = _callable(conf.onBeforePosMsg) ? conf.onBeforePosMsg : _noop;
        me.onPosMsg = _callable(conf.onPosMsg) ? conf.onPosMsg : _noop;
        me.onStartPosRender = _callable(conf.onStartPosRender) ? conf.onStartPosRender : _noop;
        me.onEndPosRender = _callable(conf.onEndPosRender) ? conf.onEndPosRender : _noop;
        me.onFailure = _callable(conf.onFailure) ? conf.onFailure3 : _noop;
        conf_pos_map = conf.positions;
        me.positions = pos_map = {};
        if (conf_pos_map) {
            for (posID in conf_pos_map) {
                pos_conf = conf_pos_map[posID];
                if (pos_conf && typeof pos_conf == OBJ) {
                    pos_id = posID || pos_conf.id || _guid(POS_ID_AUTO_PREFIX);
                    pos_map[pos_id] = new PosConfig(pos_conf);
                }
            }
        }
        config = me;
        boot_up = !!(boot_up && me.auto && lang && lang.ns("$sf.host.boot"));
        try {
            if (boot_up) sf.host.boot();
        } catch (e) {}
        return _mix({}, config);
    }
    function PosConfig(posIDorObj, destID, baseConf) {
        var me = this, typ = posIDorObj && typeof posIDorObj || "", sz, sz_split;
        if (!(me instanceof PosConfig)) return new PosConfig(posIDorObj, destID, baseConf);
        if (typ == OBJ) {
            me.id = _cstr(posIDorObj.id);
            me.dest = _cstr(posIDorObj.dest || destID);
            me.bg = _cstr(posIDorObj.bg) || "transparent";
            me.tgt = _cstr(posIDorObj.tgt) || "_top";
            me.css = _cstr(posIDorObj.css);
            me.w = _cnum(posIDorObj.w, 0);
            me.h = _cnum(posIDorObj.h, 0);
            me.z = _cnum(posIDorObj.z, 0);
            me.supports = _mix({}, posIDorObj.supports || SUPPORTS_FEATURES, TRUE, TRUE, TRUE);
            if (!me.w || !me.h) {
                sz = _cstr(posIDorObj.size);
                if (sz) {
                    sz_split = sz.split(/x/gi);
                    me.w = _cnum(sz_split[0], 0);
                    me.h = _cnum(sz_split[1], 0);
                    me.size = sz;
                } else {
                    me.size = "";
                }
            } else {
                me.size = me.w + "x" + me.h;
            }
        } else if (typ == "string") {
            me.id = _cstr(posIDorObj);
            me.dest = _cstr(posIDorObj.dest);
        } else {
            me.dest = "";
            me.bg = "transparent", me.tgt = "_top";
            me.css = "";
            me.w = 0;
            me.h = 0;
            me.size = "";
            me.z = 0;
            me.supports = {};
        }
        me.id = me.id || _guid(POS_ID_AUTO_PREFIX);
        if (!config && baseConf) Config(baseConf);
        if (config) config.positions[me.id] = me;
        return _mix({}, me);
    }
    function PosMeta(shared_obj, owner_key, owned_obj) {
        var me = this, shared, non_shared, old, posConf;
        if (!(me instanceof PosMeta)) return new PosMeta(key, owned_obj, pos, shared_obj);
        shared = {};
        non_shared = {};
        if (!owner_key || typeof owner_key != STR) return me;
        if (shared_obj && typeof shared_obj == OBJ) shared = _mix(shared, shared_obj);
        if (owned_obj && typeof owned_obj == OBJ) non_shared[owner_key] = owned_obj;
        function get_value(propKey, owner_key) {
            var ret = "";
            if (!propKey || typeof propKey != STR) return ret;
            if (!owner_key || typeof owner_key != STR) owner_key = "shared";
            if (owner_key == "shared") {
                ret = shared[propKey] || "";
            } else {
                ret = propKey in non_shared ? non_shared[prop_key] || "" : "";
            }
            return ret;
        }
        function serialize() {
            var obj = new ParamHash();
            obj.shared = shared;
            obj.non_shared = non_shared;
            return obj.toString();
        }
        me.toString = serialize;
        me.value = get_value;
    }
    function _create_pos_markup(src) {
        if (src) {
            if (src.indexOf("${sf_ver}") > -1) {
                src = src.replace(/\${sf_ver}/gi, $sf.ver);
            }
            if (src.indexOf("${ck_on}") > -1) {
                var ckVal = _cookies_enabled_test() ? "1" : "0";
                src = src.replace(/\${ck_on}/gi, ckVal);
            }
            if (src.indexOf("${flash_ver}") > -1) {
                var fVer = _get_flash_version();
                src = src.replace(/\${flash_ver}/gi, fVer);
            }
        }
        return _cstr([ "<scr", "ipt type='text/javascript', src='", src, "'></scr", "ipt>" ]);
    }
    function _get_flash_version() {
        if (flash_ver !== NULL) {
            return flash_ver;
        }
        if (navigator.plugins && navigator.plugins.length > 0) {
            var mimeTypes = navigator.mimeTypes;
            if (mimeTypes && mimeTypes[FLASH_MIME] && mimeTypes[FLASH_MIME].enabledPlugin && mimeTypes[FLASH_MIME].enabledPlugin.description) {
                flash_ver = mimeTypes[FLASH_MIME].enabledPlugin.version;
            }
        } else if (sf.env.isIE) {
            var i, obj, tmpVer, p;
            for (i = 0; i < flashActiveXVersions.length; i++) {
                try {
                    obj = new ActiveXObject(flashActiveXVersions[i]);
                    tmpVer = obj.GetVariable("$version");
                    p = tmpVer.indexOf(" ");
                    if (p > -1) {
                        flash_ver = tmpVer.substr(p + 1).replace(/,/gi, ".");
                    } else {
                        flash_ver = tmpVer.replace(/,/gi, ".");
                    }
                    break;
                } catch (err) {
                    obj = NULL;
                    flash_ver = 0;
                    continue;
                }
            }
        } else {
            flash_ver = 0;
        }
        return flash_ver;
        var getActiveXVersion = function(activeXObj) {
            var version = -1;
            try {
                version = activeXObj.GetVariable("$version");
            } catch (err) {}
            return version;
        };
    }
    function _cookies_enabled_test() {
        var cookieEnabled = navigator.cookieEnabled ? true : false;
        if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled) {
            document.cookie = "testcookie";
            cookieEnabled = document.cookie.indexOf("testcookie") != -1 ? true : false;
            if (navigator) {
                navigator.cookieEnabled = cookieEnabled;
            }
        }
        return cookieEnabled;
    }
    function Position(posIDorObj, html, meta, conf) {
        var me = this, typ = posIDorObj && typeof posIDorObj, origHtml = html, id;
        if (!(me instanceof Position)) return new Position(posIDorObj, html, meta, conf);
        if (config == null) {
            var msg = "Publisher Config not initialized - abort";
            logger.error(msg);
            info.errs.push(msg);
            return;
        }
        if (typ == OBJ) {
            _mix(me, posIDorObj);
        } else {
            id = me.id = _cstr(posIDorObj) || _guid(POS_ID_AUTO_PREFIX);
        }
        if (!html) {
            if (me.src) {
                me.html = _create_pos_markup(me.src);
            } else {
                me.html = me.html || "";
                me.src = "";
            }
        } else {
            me.html = html;
            me.src = "";
        }
        if (!me.html) me.html = "";
        me.meta = meta || me.meta || {};
        me.conf = conf || me.conf || {};
        if (id) {
            if (config && config.positions[id]) {
                me.conf = config.positions[id];
            } else {
                if (conf) {
                    conf.id = id;
                    me.conf = new PosConfig(conf);
                }
            }
        }
    }
    function _docNode(el) {
        var d = el && _doc(el) || dc, compatMode = d[COMPAT_MODE], root = d[DOC_EL];
        if (compatMode && !operaVer && compatMode != "CSS1Compat") root = d.body;
        return root;
    }
    function _isPX(val) {
        val = _cstr(val);
        if (val && val.search(/\D+/g) == -1) return TRUE;
        if (val && val.search(/px/gi) != -1) return TRUE;
    }
    function _getClip(curSt) {
        var ret = [ -1, -1, -1, -1 ], props = [ CLIP + "Top", CLIP + "Right", CLIP + "Bottom", CLIP + "Left" ], idx = 0, clipVal, prop, val, len;
        if (!curSt) return ret;
        if (ieVer) {
            while (prop = props[idx]) {
                clipVal = curSt[prop];
                if (_isPX(clipVal)) {
                    clipVal = _cnum(clipVal, -1);
                    if (clipVal >= 0) ret[idx] = clipVal;
                }
                idx++;
            }
        } else {
            clipVal = curSt[CLIP];
            if (clipVal && clipVal.search(/\d+/g) != -1) {
                clipVal = clipVal.replace(/\w+\(([^\)]*?)\)/g, "$1");
                ret = clipVal.split(" ");
                ret = ret[LEN] <= 1 ? ret.split(",") : ret;
                len = ret[LEN];
                idx = 0;
                while (len--) {
                    val = ret[idx];
                    if (!_isPX(val)) {
                        ret[idx] = -1;
                    } else {
                        ret[idx] = _cnum(val, -1);
                    }
                    idx++;
                }
            }
        }
        return ret;
    }
    function _calcBorders(el, rect) {
        var t = 0, l = 0, st, re = /^t(?:able|d|h|r|head|foot)$/i;
        st = currentStyle(el);
        if (st) {
            t = st["borderTopWidth"];
            l = st["borderLeftWidth"];
            t = _isPX(t) ? _cnum(t, 0) : 0;
            l = _isPX(l) ? _cnum(l, 0) : 0;
            if (geckVer && re.test(_tagName(el))) t = l = 0;
        }
        rect = rect || {
            t: 0,
            l: 0
        };
        rect.t += t;
        rect.l += l;
        return rect;
    }
    function _get_doc_scroll(el) {
        var pos = {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }, def = {
            scrollLeft: 0,
            scrollTop: 0,
            scrollWidth: 0,
            scrollHeight: 0
        }, d, de, dv, db, offsetX = 0, offsetY = 0;
        d = _doc(el) || dc;
        de = d[DOC_EL] || def;
        db = d.body || def;
        dv = d.defaultView;
        if (dv) {
            offsetX = _cnum(dv.pageXOffset, 0);
            offsetY = _cnum(dv.pageYOffset, 0);
        }
        pos.x = _max(de.scrollLeft, db.scrollLeft, offsetX);
        pos.y = _max(de.scrollTop, db.scrollTop, offsetY);
        pos.w = _max(de.scrollWidth, db.scrollWidth, 0);
        pos.h = _max(de.scrollHeight, db.scrollHeight, 0);
        return pos;
    }
    function _getRectIE(el) {
        var rect = {
            t: 0,
            l: 0,
            r: 0,
            b: 0,
            w: 0,
            h: 0,
            z: 0
        }, _back = "BackCompat", scroll, box, d, de, compatMode, st, adjustX, adjustY, bLeft, bTop;
        if (el && el[NODE_TYPE] == 1) {
            try {
                d = _doc(el) || dc;
                if (!dom.ready()) return _getRectNonIE(el);
                scroll = _get_doc_scroll(el);
                box = el.getBoundingClientRect();
                rect.t = box.top;
                rect.l = box.left;
                adjustX = adjustY = IE_BORDER_ADJ;
                compatMode = d[COMPAT_MODE];
                de = d[DOC_EL];
                st = currentStyle(de);
                bLeft = st["borderLeftWidth"];
                bTop = st["borderTopWidth"];
                if (ieVer === 6) {
                    if (compatMode != _back) {
                        adjustX = adjustY = 0;
                    }
                }
                if (compatMode == _back) {
                    bLeft = _isPX(bLeft) ? _cnum(bLeft, 0) : 0;
                    adjustX = bLeft;
                    bTop = _isPX(bTop) ? _cnum(bTop, 0) : 0;
                    adjustY = bTop;
                    rect.t -= adjustX;
                    rect.l -= adjustY;
                }
                rect.t += scroll.y;
                rect.l += scroll.x;
                rect.b = rect.t + el.offsetHeight;
                rect.r = rect.l + el.offsetWidth;
                rect.w = _max(rect.r - rect.l, 0);
                rect.h = _max(rect.b - rect.t, 0);
                rect.z = currentStyle(el, "zIndex");
            } catch (e) {
                rect = {
                    t: 0,
                    l: 0,
                    r: 0,
                    b: 0,
                    w: 0,
                    h: 0,
                    z: 0
                };
            }
        }
        return rect;
    }
    function _getRectNonIE(el) {
        var rect = {
            t: 0,
            l: 0,
            r: 0,
            b: 0,
            w: 0,
            h: 0,
            z: 0
        }, scrollTop = 0, scrollLeft = 0, bCheck = FALSE, root = _docNode(el), scroll = _get_doc_scroll(el), parentNode, w, h;
        if (el && el[NODE_TYPE] == 1) {
            try {
                rect.l = el.offsetLeft || 0;
                rect.t = el.offsetTop || 0;
                parentNode = el;
                bCheck = geckVer || wbVer > 519;
                while (parentNode = parentNode.offsetParent) {
                    rect.t += parentNode.offsetTop || 0;
                    rect.l += parentNode.offsetLeft || 0;
                    if (bCheck) _calcBorders(parentNode, rect);
                    if (parentNode == root) break;
                }
                parentNode = el;
                if (currentStyle(parentNode, "position") != "fixed") {
                    parentNode = el;
                    while (parentNode = _par(parentNode)) {
                        if (parentNode[NODE_TYPE] == 1) {
                            scrollTop = parentNode.scrollTop || 0;
                            scrollLeft = parentNode.scrollLeft || 0;
                            if (geckVer && currentStyle(parentNode, OVER) != "visible") _calcBorders(parentNode, rect);
                            rect.l -= scrollLeft;
                            rect.t -= scrollTop;
                        }
                        if (parentNode == root) break;
                    }
                    rect.t += scroll.y;
                    rect.l += scroll.x;
                } else {
                    rect.t += scroll.y;
                    rect.l += scroll.x;
                }
                if (!ieVer && el == _docNode(el)) {
                    h = el.clientHeight;
                    w = el.clientWidth;
                } else {
                    h = el.offsetHeight;
                    w = el.offsetWidth;
                }
                rect.b = rect.t + h;
                rect.r = rect.l + w;
                rect.w = _max(rect.r - rect.l, 0);
                rect.h = _max(rect.b - rect.t, 0);
                rect.z = currentStyle(el, "zIndex");
            } catch (e) {
                rect = {
                    t: 0,
                    l: 0,
                    r: 0,
                    b: 0,
                    w: 0,
                    h: 0,
                    z: 0
                };
            }
        }
        return rect;
    }
    function docRect(el) {
        var root = _docNode(el), w = 0, h = 0;
        if (root) {
            w = root.scrollWidth || 0;
            h = root.scrollHeight || 0;
        }
        return {
            t: 0,
            l: 0,
            b: h,
            r: w,
            w: w,
            h: h
        };
    }
    function winRect(el) {
        var wi = el && _view(el) || win, h = wi.innerHeight || 0, w = wi.innerWidth || 0, t = wi.screenY || wi.screenTop || 0, b = h + t, l = wi.screenX || wi.screenLeft || 0, r = w + l, root = _docNode(el);
        if (!h && !w && root) {
            h = root.clientHeight || 0;
            w = root.clientWidth || 0;
            r = l + w;
            b = t + h;
        }
        return {
            t: t,
            l: l,
            b: b,
            r: r,
            w: w,
            h: h
        };
    }
    function contains(element, needle) {
        var ret = FALSE, el_node_type = element && element[NODE_TYPE] || -1, needle_node_type = needle && needle[NODE_TYPE] || -1;
        if (el_node_type == 1 && needle_node_type != -1) {
            if (element[CONTAINS]) {
                if (operaVer || needle_node_type == 1) {
                    ret = element[CONTAINS](needle);
                } else {
                    while (needle) {
                        if (element === needle) {
                            ret = TRUE;
                            break;
                        }
                        needle = needle.parentNode;
                    }
                }
            } else if (element[COMPARE_DOC_POS]) {
                ret = element === needle || !!(element[COMPARE_DOC_POS](needle) & 16);
            }
        }
        return ret;
    }
    function currentStyle(el, attr) {
        var val = "", hasAttr = !!(arguments[LEN] && attr), comp = "getComputedStyle", e;
        if (hasAttr) {
            if (ieVer) {
                try {
                    val = el.currentStyle[attr];
                } catch (e) {
                    val = "";
                }
            } else {
                try {
                    val = _view(el)[comp](el, NULL)[attr];
                } catch (e) {
                    val = "";
                }
            }
        } else {
            if (ieVer) {
                try {
                    val = el.currentStyle;
                } catch (e) {
                    val = NULL;
                }
            } else {
                try {
                    val = _view(el)[comp](el, NULL);
                } catch (e) {
                    val = NULL;
                }
            }
        }
        return val;
    }
    function bounds(el, details, check_3D) {
        var par = el && _par(el), root = _docNode(el), el_rect = _rect(el), root_rect = _rect(root), root_scroll = _get_doc_scroll(root), doc_rect = docRect(el), clip_rect = {
            t: 0,
            l: 0,
            r: 0,
            b: 0,
            w: 0,
            h: 0
        }, exp_rect = {
            t: 0,
            l: 0,
            r: 0,
            b: 0,
            xs: 0,
            ys: 0,
            xiv: 0,
            yiv: 0,
            iv: 0,
            w: 0,
            h: 0
        }, xsb_h = 0, ysb_w = 0, is_scroll_node = FALSE, is_using_doc_root_r = FALSE, is_using_doc_root_b = FALSE, cur_st, w, h, t, l, r, b, scroll_width, offset_width, client_width, scroll_height, offset_height, client_height, over_x_val, scroll_left, scroll_top, over_y_val, clip, x_hidden, y_hidden, ref_node, temp_rect, is_scroll_node = FALSE;
        details = details && typeof details == OBJ ? details : {};
        if (par) {
            while (cur_st = currentStyle(par)) {
                if (cur_st["display"] == "block" || cur_st["position"] == "absolute" || cur_st["float"] != "none" || cur_st["clear"] != "none") {
                    over_x_val = cur_st[OVER + "X"];
                    over_y_val = cur_st[OVER + "Y"];
                    clip = _getClip(cur_st);
                    if (par == root) {
                        scroll_width = root_scroll.w;
                        scroll_height = root_scroll.h;
                    } else {
                        scroll_width = par.scrollWidth;
                        scroll_height = par.scrollHeight;
                    }
                    offset_width = par.offsetWidth;
                    offset_height = par.offsetHeight;
                    client_width = par.clientWidth;
                    client_height = par.clientHeight;
                    if (over_x_val == HIDDEN || clip[1] > 0 || clip[3] > 0) {
                        if (!ref_node) {
                            x_hidden = 1;
                            ref_node = par;
                        }
                    }
                    if (over_y_val == HIDDEN || clip[0] > 0 || clip[2] > 0) {
                        if (!ref_node) {
                            y_hidden = 1;
                            ref_node = par;
                        }
                    }
                    if (over_x_val == SCROLL) {
                        ref_node = par;
                        xsb_h = offset_height - client_height;
                        is_scroll_node = TRUE;
                    }
                    if (over_y_val == SCROLL) {
                        if (!ref_node) ref_node = par;
                        ysb_w = offset_width - client_width;
                        is_scroll_node = TRUE;
                    }
                    if (over_x_val == AUTO) {
                        if (!ref_node) ref_node = par;
                        if (scroll_width > client_width) {
                            xsb_h = offset_height - client_height;
                        }
                        is_scroll_node = TRUE;
                    }
                    if (over_y_val == AUTO) {
                        if (!ref_node) ref_node = par;
                        if (scroll_height > client_height) {
                            ysb_w = offset_width - client_width;
                        }
                        is_scroll_node = TRUE;
                    }
                    if (ref_node) break;
                }
                if (par == root) {
                    if (scroll_width > client_width) {
                        h = win.innerHeight || 0 || offset_height;
                        xsb_h = h - client_height;
                    }
                    if (scroll_height > client_height) {
                        w = win.innerWidth || 0 || offset_width;
                        ysb_w = w - client_width;
                    }
                    is_scroll_node = TRUE;
                }
                par = _par(par);
                if (!par || par[NODE_TYPE] != 1) break;
            }
        }
        if (el_rect.w && el_rect.h) {
            if (!ref_node || ref_node == root) {
                exp_rect.t = _max(el_rect.t, 0);
                exp_rect.l = _max(el_rect.l, 0);
                if (ieVer && dc[COMPAT_MODE] == "BackCompat" && _attr(root, SCROLL) == "no") {
                    y_hidden = x_hidden = 1;
                } else {
                    cur_st = currentStyle(root);
                    if (cur_st) {
                        x_hidden = cur_st[OVER + "X"] == HIDDEN;
                        y_hidden = cur_st[OVER + "Y"] == HIDDEN;
                    }
                }
                if (root_scroll.h > root.clientHeight) {
                    if (y_hidden) {
                        exp_rect.b = 0;
                    } else {
                        is_using_doc_root_b = TRUE;
                        exp_rect.b = _max(doc_rect.h - el_rect.h - xsb_h - el_rect.t, 0);
                    }
                } else {
                    exp_rect.b = _max(root_rect.h - el_rect.h - xsb_h - el_rect.t, 0);
                }
                if (root_scroll.w > root.clientWidth) {
                    if (x_hidden) {
                        exp_rect.r = 0;
                    } else {
                        is_using_doc_root_r = TRUE;
                        exp_rect.r = _max(doc_rect.w - el_rect.w - ysb_w - el_rect.l, 0);
                    }
                } else {
                    exp_rect.r = _max(root_rect.r - el_rect.w - ysb_w - el_rect.l, 0);
                }
            } else {
                cur_st = currentStyle(ref_node);
                if (_tagName(ref_node) == "body") {
                    ref_node = root;
                    t = el_rect.t;
                    l = el_rect.l;
                } else {
                    t = l = 0;
                }
                clip_rect = _rect(ref_node);
                if (clip[1] > 0) {
                    clip_rect.w = clip[1];
                    clip_rect.r = clip_rect.l + clip_rect.w;
                }
                if (clip[3] > 0) {
                    clip_rect.l = clip_rect.l + clip[3];
                    clip_rect.w = clip_rect.w - clip[3];
                }
                if (clip[2] > 0) {
                    clip_rect.h = clip[2];
                    clip_rect.b = clip_rect.t + clip_rect.h;
                }
                if (clip[0] > 0) {
                    clip_rect.t = clip_rect.t + clip[0];
                    clip_rect.h = clip_rect.h - clip[0];
                }
                if (el_rect.t > clip_rect.t && clip_rect.t > 0) t = el_rect.t - clip_rect.t;
                if (el_rect.l > clip_rect.l && clip_rect.l > 0) l = el_rect.l - clip_rect.l;
                scroll_top = ref_node.scrollTop;
                scroll_left = ref_node.scrollLeft;
                scroll_height = ref_node.scrollHeight;
                scroll_width = ref_node.scrollWidth;
                exp_rect.t = _max(t, 0);
                exp_rect.l = _max(l, 0);
                if (cur_st) {
                    x_hidden = cur_st[OVER + "X"] == HIDDEN || clip[1] > 0 || clip[3] > 0;
                    y_hidden = cur_st[OVER + "Y"] == HIDDEN || clip[0] > 0 || clip[2] > 0;
                }
                if (el_rect.t >= clip_rect.b) {
                    exp_rect.b = 0;
                } else {
                    if (!y_hidden && el_rect.t >= clip_rect.b) y_hidden = 1;
                    if (scroll_height > ref_node.clientHeight) {
                        if (y_hidden) {
                            exp_rect.b = 0;
                        } else {
                            exp_rect.b = _max(scroll_height - el_rect.h - xsb_h - t, 0);
                        }
                    } else {
                        exp_rect.b = _max(clip_rect.h - el_rect.h - xsb_h - t, 0);
                    }
                }
                if (el_rect.l >= clip_rect.r) {
                    exp_rect.r = 0;
                } else {
                    if (!x_hidden && el_rect.l >= clip_rect.r) x_hidden = 1;
                    if (scroll_width > ref_node.clientWidth) {
                        if (x_hidden) {
                            exp_rect.r = 0;
                        } else {
                            exp_rect.r = _max(scroll_width - el_rect.w - ysb_w - l, 0);
                        }
                    } else {
                        exp_rect.r = _max(clip_rect.w - el_rect.w - ysb_w - l, 0);
                    }
                }
            }
            exp_rect.xs = xsb_h ? 1 : 0;
            exp_rect.ys = ysb_w ? 1 : 0;
            exp_rect.w = exp_rect.r + exp_rect.l;
            exp_rect.h = exp_rect.t + exp_rect.b;
            if (!ref_node || ref_node == root) {
                temp_rect = root_rect;
                ref_node = root;
            } else {
                temp_rect = clip_rect;
            }
            l = _max(el_rect.l, temp_rect.l);
            r = _min(el_rect.r, is_using_doc_root_r ? _min(doc_rect.r, temp_rect.r) : temp_rect.r);
            w = _max(r - l, 0);
            t = _max(el_rect.t, temp_rect.t);
            b = _min(el_rect.b, is_using_doc_root_b ? _min(doc_rect.b, temp_rect.b) : temp_rect.b);
            h = _max(b - t, 0);
            exp_rect.xiv = _cnum((w / el_rect.w)[TFXD](2));
            exp_rect.yiv = _cnum((h / el_rect.h)[TFXD](2));
            exp_rect.iv = _cnum((w * h / (el_rect.w * el_rect.h))[TFXD](2));
        }
        details.refNode = ref_node || root;
        details.isRoot = ref_node == root;
        details.canScroll = is_scroll_node;
        details.refRect = !ref_node || ref_node == root ? root_rect : clip_rect;
        details.expRect = exp_rect;
        details.rect = el_rect;
        if (check_3D) {
            (function() {
                var idx = 0, len = 0, arOvrlaps, el_w, el_h, el_area, ovr_node, ovr_node_rect, t, b, l, r, h, w, ovr_area, new_iv, new_xiv, new_yiv;
                if (exp_rect.iv > .5) {
                    mgr_bounds_details = details;
                    arOvrlaps = overlaps(el, _cnum(check_3D, 1, 1));
                    mgr_bounds_details = NULL;
                    len = arOvrlaps[LEN];
                    el_w = el_rect.w;
                    el_h = el_rect.h, el_area = el_w * el_h;
                    if (len) {
                        while (ovr_node = arOvrlaps[idx++]) {
                            ovr_node_rect = _rect(ovr_node);
                            l = _max(el_rect.l, ovr_node_rect.l);
                            r = _min(el_rect.r, ovr_node_rect.r);
                            t = _max(el_rect.t, ovr_node_rect.t);
                            b = _min(el_rect.b, ovr_node_rect.b);
                            w = r - l;
                            h = b - t;
                            ovr_area = w * h;
                            new_xiv = (1 - w / el_w)[TFXD](2);
                            new_yiv = (1 - h / el_h)[TFXD](2);
                            new_iv = (1 - ovr_area / el_area)[TFXD](2);
                            if (new_xiv > 0 && new_xiv < exp_rect.xiv || new_yiv > 0 && new_yiv < exp_rect.yiv) {
                                exp_rect.xiv = new_xiv;
                                exp_rect.yiv = new_yiv;
                                exp_rect.iv = new_iv;
                            }
                        }
                    }
                }
            })();
        }
        return exp_rect;
    }
    function overlaps(el, limit) {
        var rect = _rect(el), doc = _doc(el), root = _docNode(doc), t = rect.t, l = rect.l, w = rect.r - rect.l, h = rect.b - rect.t, factor = INTERSECT_FACTOR, ret = [], baseW = _round(w / factor), baseH = _round(h / factor), curW = baseW, curH = baseH, seen = {}, par_details = {}, points = [], idx = 0, x, y, pt, id, checkEl, ref_par_node, ref_par_rect, maxX, maxY;
        if (mgr_bounds_details) {
            par_details = mgr_bounds_details;
        } else {
            bounds(el, par_details, TRUE);
        }
        ref_par_node = par_details.refNode;
        ref_par_rect = par_details.refRect;
        if (ref_par_rect && ref_par_node && ref_par_node != root) {
            maxX = ref_par_rect.r;
            maxY = ref_par_rect.b;
        } else {
            maxX = l + w;
            maxY = t + h;
        }
        if (doc && root && doc[EL_FROM_PT]) {
            while (curW < w) {
                curH = baseH;
                while (curH < h) {
                    x = l + curW;
                    y = t + curH;
                    if (x < maxX && y < maxY) points.push([ x, y ]);
                    curH += baseH;
                }
                curW += baseW;
            }
            limit = _cnum(limit, points[LEN]);
            while (pt = points[idx++]) {
                checkEl = doc[EL_FROM_PT](pt[0], pt[1]);
                try {
                    if (checkEl && checkEl.nodeType == 1 && checkEl !== root && checkEl !== el && !contains(el, checkEl)) {
                        id = _attr(checkEl, "id");
                        if (!id) {
                            id = lang.guid("geom_inter");
                            _attr(checkEl, "id", id);
                        }
                        if (!seen[id] && ret[LEN] < limit) {
                            seen[id] = 1;
                            ret.push(checkEl);
                        }
                    }
                } catch (e) {}
            }
        }
        id = "";
        for (id in seen) {
            if (id.indexOf("geom_inter") == 0) {
                checkEl = _elt(id);
                if (checkEl) _attr(checkEl, "id", NULL);
            }
        }
        return ret;
    }
    function _call_xmsg_host_fb(methName, arg1, arg2, arg3) {
        if (!msghostfb) msghostfb = dom.msghost_fb;
        return methName && msghostfb && msghostfb[methName] && msghostfb[methName](arg1, arg2, arg3);
    }
    function _check_html5_init(evt) {
        if (!canUseHTML5 && evt && evt.data == initID) {
            canUseHTML5 = TRUE;
            dom.evtCncl(evt);
            dom[DETACH](win, MSG, _check_html5_init);
        }
    }
    function _handle_msg_from_outside(evt) {
        var data = evt && evt.data, msg_win = evt && evt.source, params = data && (typeof data == "string" && data.indexOf(GUID) != -1) && ParamHash(data), tgtID = params && params.id, ifr = tgtID && _elt(tgtID), fr_win = ifr && _ifr_view(ifr), pipe = tgtID && msg_pipes[tgtID], dataGUID = params && params[GUID], pipeGUID = pipe && pipe[GUID], cb = pipe && pipe._xmsgcb, ret = FALSE;
        if (pipeGUID && dataGUID && dataGUID == pipeGUID && msg_win && fr_win && fr_win == msg_win) {
            try {
                ret = cb(params.msg);
            } catch (e) {
                ret = FALSE;
            }
        }
        if (ret) dom.evtCncl(evt);
        return ret;
    }
    function send_msg_to_child_iframe(tgtID, data) {
        var pipe = tgtID && msg_pipes[tgtID], success = FALSE, msgObj, w, el, e;
        if (!pipe) {
            success = _call_xmsg_host_fb("send", tgtID, data);
        } else {
            if (pipe) {
                msgObj = ParamHash();
                msgObj.msg = data;
                msgObj.guid = pipe.guid;
                if (usingHTML5()) {
                    el = _elt(tgtID);
                    w = _ifr_view(el);
                    try {
                        w[PMSG](_cstr(msgObj), pipe.srcHost || "*");
                        success = TRUE;
                    } catch (e) {
                        success = FALSE;
                    }
                } else {
                    success = _call_xmsg_host_fb("send", tgtID, data);
                }
            }
        }
        msgObj = w = el = NULL;
        return success;
    }
    function usingHTML5() {
        return canUseHTML5;
    }
    function _strippedEncodedLocation() {
        var cleaned, pos = loc.href.indexOf("#");
        if (pos > -1) {
            cleaned = loc.href.substr(0, pos);
        } else {
            cleaned = loc.href;
        }
        pos = cleaned.indexOf("?");
        if (pos > -1) {
            cleaned = cleaned.substr(0, pos);
        }
        return escape(cleaned);
    }
    function prep_iframe_msging(attrs) {
        var pipe = NULL, iframeName, nameParams, src, srcHost, newPipe, locStripped = _strippedEncodedLocation();
        if (attrs) {
            iframeName = attrs.name;
            nameParams = ParamHash(iframeName);
            src = _cstr(attrs.src);
            srcHost = src && src.substring(0, src.indexOf("/", 9));
            srcHost = srcHost.search(/http/gi) != 0 ? "" : srcHost;
            pipe = ParamHash(nameParams);
            pipe.id = attrs.id || "iframe_" + _guid();
            pipe.src = src;
            pipe.srcHost = srcHost;
            pipe[GUID] = pipe[GUID] || _guid();
            pipe.host = locHost;
            pipe.loc = locStripped;
            pipe.proxyID = "";
            if (usingHTML5()) {
                pipe.html5 = 1;
                pipe.proxyPath = "";
            } else {
                newPipe = _call_xmsg_host_fb("prep", pipe);
                if (newPipe) pipe = newPipe;
            }
            attrs.name = pipe;
        }
        return pipe;
    }
    function attach_iframe_msging(el, pipe, cb) {
        var tgtID;
        if (_tagName(el) == "iframe") {
            tgtID = _attr(el, "id");
            if (tgtID && pipe && pipe instanceof ParamHash && tgtID == pipe.id) {
                if (usingHTML5()) {
                    msg_pipes[tgtID] = pipe;
                    pipe._xmsgcb = cb;
                    if (!html5Bound) {
                        dom[ATTACH](win, MSG, _handle_msg_from_outside);
                        html5Bound = TRUE;
                    }
                } else {
                    _call_xmsg_host_fb(ATTACH, el, pipe, cb);
                }
            }
        }
    }
    function detach_iframe_msging(el) {
        var id = _attr(el, "id"), pipe = id && msg_pipes[id], w = NULL, empty = TRUE;
        if (!pipe) {
            _call_xmsg_host_fb(DETACH, el);
            return;
        }
        if (pipe) {
            pipe._xmsgcb = msg_pipes[id] = NULL;
            pipe = NULL;
            delete msg_pipes[id];
        }
        id = "";
        for (id in msg_pipes) {
            pipe = msg_pipes[id];
            if (pipe && pipe[GUID]) {
                empty = FALSE;
                break;
            }
        }
        if (empty && usingHTML5() && html5Bound) {
            html5Bound = FALSE;
            dom[DETACH](win, MSG, _handle_msg_from_outside);
        }
        el = w = pipe = NULL;
    }
    function _fire_pub_callback(cb_name) {
        var cb_args = [], args = arguments, len = args[LEN], idx = 0, f, ret = FALSE, e, a;
        if (config) {
            f = config[cb_name];
            if (f) {
                while (len--) {
                    a = args[idx++];
                    if (a != cb_name) {
                        cb_args.push(a);
                    }
                }
                try {
                    ret = f.apply(NULL, cb_args);
                } catch (e) {
                    ret = FALSE;
                }
            }
        }
        return ret;
    }
    function _handle_render_timeout(pos_id) {
        var pend = pos_id && pending_ifrs[pos_id];
        if (pend) {
            clearTimeout(pend);
            nuke(pos_id);
            _fire_pub_callback(POS_MSG, "render-timeout", pos_id);
        }
        if (!_has_pending_renders()) current_status = "";
    }
    function _clear_geom_update_timer() {
        if (geom_update_timer) {
            clearTimeout(geom_update_timer);
            geom_update_timer = 0;
        }
    }
    function _clear_focus_update_timer() {
        if (focus_update_timer) {
            clearTimeout(focus_update_timer);
            focus_update_timer = 0;
        }
    }
    function _set_focus_update_timer(in_focus) {
        _clear_focus_update_timer();
        focus_update_timer = setTimeout(function() {
            _update_focus(in_focus);
        }, 2);
    }
    function _set_geom_update_timer(is_win_scroll) {
        _clear_geom_update_timer();
        if (is_win_scroll) {
            geom_update_timer = setTimeout(_update_geom_win_scroll, GEOM_UPDATE_INTRVAL);
        } else {
            geom_update_timer = setTimeout(_update_geom_win_resize, GEOM_UPDATE_INTRVAL);
        }
    }
    function _update_geom(is_win_scroll) {
        var posID, params, msgObj, id, ifr, g;
        for (posID in rendered_ifrs) {
            if (is_win_scroll && posID in scroll_parents_attached) continue;
            params = rendered_ifrs[posID];
            id = params && params.dest;
            ifr = id && _elt(id);
            if (ifr && params) {
                g = _build_geom(posID, ifr, TRUE);
                msgObj = ParamHash();
                msgObj.pos = posID;
                msgObj.cmd = NOTIFY_GEOM_UPDATE;
                msgObj.geom = _es(g);
                _fire_pub_callback(POS_MSG, posID, NOTIFY_GEOM_UPDATE, g);
                _send_response(params, msgObj);
            }
        }
        _clear_geom_update_timer();
    }
    function _update_geom_win_resize() {
        _update_geom();
    }
    function _update_geom_win_scroll() {
        _update_geom(TRUE);
    }
    function _handle_node_scroll(evt, posID, node) {
        var scr_handle = scroll_parents_attached[posID], g;
        if (scr_handle) {
            if (scr_handle.tID) {
                clearTimeout(scr_handle.tID);
                delete scr_handle.tID;
            }
            scr_handle.tID = setTimeout(function() {
                var params = rendered_ifrs[posID], id = params && params.dest, ifr = id && _elt(id), g, msgObj;
                if (ifr && params) {
                    g = _build_geom(posID, ifr, TRUE);
                    msgObj = ParamHash();
                    msgObj.pos = posID;
                    msgObj.cmd = NOTIFY_GEOM_UPDATE;
                    msgObj.geom = _es(g);
                    _fire_pub_callback(POS_MSG, posID, NOTIFY_GEOM_UPDATE, g);
                    _send_response(params, msgObj);
                }
                delete scr_handle.tID;
            }, GEOM_UPDATE_INTRVAL);
        }
    }
    function _update_focus(in_focus) {
        var posID, params, msgObj, id, ifr;
        for (posID in rendered_ifrs) {
            params = rendered_ifrs[posID];
            id = params && params.dest;
            ifr = id && _elt(id);
            if (ifr && params) {
                msgObj = ParamHash();
                data = ParamHash();
                msgObj.pos = posID;
                msgObj.cmd = data.cmd = NOTIFY_FOCUS_CHANGE;
                msgObj.value = in_focus;
                _fire_pub_callback(POS_MSG, posID, NOTIFY_FOCUS_CHANGE, in_focus);
                _send_response(params, msgObj);
            }
        }
        _clear_focus_update_timer();
    }
    function _handle_win_focus(evt) {
        _set_focus_update_timer(TRUE);
    }
    function _handle_win_blur(evt) {
        var f = win[DOC].hasFocus();
        _set_focus_update_timer(f);
    }
    function _handle_win_geom_scroll(evt) {
        _set_geom_update_timer(1);
    }
    function _handle_win_geom_resize(evt) {
        _set_geom_update_timer();
    }
    function _handle_unload(evt) {
        var prop, scr_handle, e;
        _clear_geom_update_timer();
        try {
            dom.detach(win, SCROLL, _handle_win_geom_scroll);
            dom.detach(win, "resize", _handle_win_geom_resize);
            dom.detach(win, "unload", _handle_unload);
            dom.detach(win, "focus", _handle_win_focus);
            dom.detach(win, "blur", _handle_win_blur);
            for (prop in scroll_parents_attached) {
                scr_handle = scroll_parents_attached[prop];
                if (scr_handle) {
                    if (scr_handle.tID) clearTimeout(scr_handle.tID);
                    dom.detach(scroll_parents_attached[prop], SCROLL, scr_handle[ONSCROLL]);
                    scr_handle[ONSCROLL] = scr_handle.node = NULL;
                }
                scroll_parents_attached[prop] = NULL;
                delete scroll_parents_attached[prop];
            }
            win_events_attached = FALSE;
        } catch (e) {}
    }
    function _handle_msg_evt(data) {
        var msgObj, ret = FALSE, info;
        msgObj = ParamHash(data, NULL, NULL, TRUE, TRUE);
        if (msgObj && msgObj.pos) {
            info = rendered_ifrs[msgObj.pos];
            if (info) {
                switch (msgObj.cmd) {
                  case "exp-push":
                    _expand_safeframe(msgObj, TRUE);
                    ret = TRUE;
                    break;

                  case "exp-ovr":
                    _expand_safeframe(msgObj);
                    ret = TRUE;
                    break;

                  case "collapse":
                    _collapse_safeframe(msgObj);
                    ret = TRUE;
                    break;

                  case "msg":
                    _fire_pub_callback(POS_MSG, msgObj.pos, "msg", msgObj.msg);
                    ret = TRUE;
                    break;

                  case ERROR_COMMAND:
                    _record_error(msgObj);
                    ret = TRUE;
                    break;

                  case NOTIFY_GEOM_UPDATE:
                    sf.lib.logger.log("Geom update complete: " + msgObj.pos);
                    ret = TRUE;
                    break;

                  case "read-cookie":
                    var canRead = info.conf && info.conf.supports && info.conf.supports[msgObj.cmd] && info.conf.supports[msgObj.cmd] != "0";
                    if (canRead) {
                        _read_cookie(msgObj);
                        ret = TRUE;
                    } else {
                        ret = FALSE;
                    }
                    break;

                  case "write-cookie":
                    var canWrite = info.conf && info.conf.supports && info.conf.supports[msgObj.cmd] && info.conf.supports[msgObj.cmd] != "0";
                    if (canWrite) {
                        _write_cookie(msgObj);
                        ret = TRUE;
                    } else {
                        ret = FALSE;
                    }
                    break;
                }
            }
        }
        return ret;
    }
    function _has_pending_renders() {
        var all_renders_done = TRUE, pos_id;
        for (pos_id in pending_ifrs) {
            all_renders_done = FALSE;
            break;
        }
        return all_renders_done;
    }
    function _send_response(params, msgObj) {
        current_status = "sending-msg-down-" + msgObj.cmd;
        setTimeout(function() {
            var id = params && params.dest;
            if (id && msgObj) send_msg_to_child_iframe(id, msgObj.toString());
            current_status = "";
            msgObj = id = params = NULL;
        }, XCOM_RESP_DELAY);
    }
    function _handle_frame_load() {
        var el = this, pos_id = dom.attr(el, "_pos_id"), all_renders_done = TRUE;
        if (pending_ifrs[pos_id]) {
            clearTimeout(pending_ifrs[pos_id]);
            delete pending_ifrs[pos_id];
            complete_ifrs[pos_id] = pos_id;
            dom.attr(el, "_pos_id", NULL);
            dom.attr(el, "name", NULL);
            el[ST].visibility = "inherit";
            el[ST].display = "block";
            _fire_pub_callback("onEndPosRender", pos_id);
        }
        if (!_has_pending_renders()) current_status = "";
    }
    function _shim_frame(id, showIt, w, h, z) {
        if (!isIE) return;
        var ifr = _elt(id), shmID = "shm_" + id, shmFrm = _elt(shmID);
        if (showIt) {
            if (shmFrm) {
                shmFrm[ST].visibility = "visible";
                return;
            }
            shmFrm = iframes.clone(ifr, {
                id: shmID,
                src: "",
                name: shmID
            }, [ WIDTH, ":", w, PX, ";position:absolute;", HEIGHT, ":", h, PX, ";z-index:", z - 1, ";filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0)" ]);
            dom.append(_par(ifr), shmFrm);
        } else if (!showIt && shmFrm) {
            shmFrm[ST].visibility = "hidden";
        }
    }
    function _build_geom(posID, dest, dont_attach_scroll_evt) {
        var bounds, info = ParamHash(), details = {}, scr_handle, node, new_ref_node, ex, s, e;
        try {
            bounds = dom.bounds(dest, details, TRUE);
            if (!dont_attach_scroll_evt && !details.isRoot && details.canScroll) {
                ex = details.expRect;
                if (ex.xs || ex.ys) {
                    scr_handle = scroll_parents_attached[posID];
                    new_ref_node = details.refNode;
                    if (scr_handle && scr_handle.node != new_ref_node) {
                        if (scr_handle.tID) clearTimeout(scr_handle.tID);
                        dom.detach(node, SCROLL, scr_handle[ONSCROLL]);
                        scr_handle.node = scr_handle[ONSCROLL] = NULL;
                        scroll_parents_attached[posID] = NULL;
                        delete scroll_parents_attached[posID];
                    }
                    if (!scroll_parents_attached[posID]) {
                        scr_handle = {};
                        scr_handle.node = new_ref_node;
                        scr_handle[ONSCROLL] = function(evt) {
                            _handle_node_scroll(evt, posID);
                        };
                        scroll_parents_attached[posID] = scr_handle;
                        dom.attach(new_ref_node, SCROLL, scr_handle[ONSCROLL]);
                    }
                }
            }
        } catch (e) {
            info = NULL;
        }
        try {
            if (info) {
                info.win = ParamHash(dom.winRect());
                info.par = ParamHash(details.refRect);
                ex = ParamHash(details.expRect);
                s = ParamHash(details.rect);
                s.iv = ex.iv;
                s.xiv = ex.xiv;
                s.yiv = ex.yiv;
                delete ex.iv;
                delete ex.xiv;
                delete ex.yiv;
                info.exp = ex;
                info.self = s;
            }
        } catch (e) {
            info = NULL;
        }
        return info;
    }
    function _expand_safeframe(msgObj, push) {
        var xn = FALSE, yn = FALSE, posID = msgObj && msgObj.pos, params, params_conf, ifr, par, ifrSt, parSt, orWd, orHt, dx, dy, nWd, nHt, id, t, l, r, b, exp, z, delta, scr_handle;
        if (!posID) return;
        params = rendered_ifrs[posID];
        params_conf = params && params.conf;
        if (!params || !params_conf) return;
        id = params.dest;
        ifr = _elt(id);
        par = _elt(POS_REL_BOX_ID_PREFIX + "_" + posID);
        if (!ifr || !par) return;
        ifrSt = ifr[ST];
        parSt = par[ST];
        if (!ifrSt) return;
        scr_handle = scroll_parents_attached[posID];
        if (scr_handle && scr_handle.tID) clearTimeout(scr_handle.tID);
        _clear_geom_update_timer();
        exp = msgObj.exp_obj;
        orWd = params_conf.w;
        orHt = params_conf.h;
        if (!exp) {
            dx = params.dx = _cnum(msgObj.dx);
            dy = params.dy = _cnum(msgObj.dy);
            xn = dx < 0;
            yn = dy < 0;
            nWd = xn ? orWd + dx * -1 : orWd + dx;
            nHt = yn ? orHt + dy * -1 : orHt + dy;
        } else {
            t = _cnum(exp.t, 0, 0);
            l = _cnum(exp.l, 0, 0);
            r = _cnum(exp.r, 0, 0);
            b = _cnum(exp.b, 0, 0);
            nWd = _cnum(orWd + l + r, 0, 0);
            nHt = _cnum(orHt + t + b, 0, 0);
            if (t) {
                dy = t * -1;
                yn = TRUE;
            } else {
                dy = 0;
            }
            if (l) {
                dx = l * -1;
                xn = TRUE;
            } else {
                dx = 0;
            }
        }
        if (nWd <= orWd && nHt <= orHt) return;
        if (_fire_pub_callback(BF_POS_MSG, posID, EXPAND_COMMAND, dx, dy)) return;
        ifrSt[WIDTH] = nWd + PX;
        ifrSt[HEIGHT] = nHt + PX;
        if (xn) ifrSt.left = dx + PX;
        if (yn) ifrSt.top = dy + PX;
        z = _cnum(params.z, 0);
        if (!z) z = DEFAULT_ZINDEX;
        ifrSt.zIndex = z;
        _shim_frame(id, TRUE, nWd, nHt, z - 1);
        if (push) {
            parSt[WIDTH] = nWd + PX;
            parSt[HEIGHT] = nHt + PX;
        } else {
            parSt[WIDTH] = orWd + PX;
            parSt[HEIGHT] = orHt + PX;
        }
        params.expanded = TRUE;
        msgObj.dx = dx;
        msgObj.dy = dy;
        msgObj.w = nWd;
        msgObj.h = nHt;
        msgObj.cmd = "expand";
        msgObj.geom = _es(_build_geom(posID, ifr, TRUE));
        _fire_pub_callback(POS_MSG, posID, EXPAND_COMMAND, dx, dy);
        _send_response(params, msgObj);
        ifrSt = par = ifr = params = msgObj = NULL;
    }
    function _collapse_safeframe(msgObj, isOutside, noMsging) {
        var posID = msgObj && msgObj.pos, params = posID && rendered_ifrs[posID], params_conf = params && params.conf, id = params_conf && params_conf.dest, ifr = id && _elt(id), par = ifr && _elt(POS_REL_BOX_ID_PREFIX + "_" + posID), ifrSt = ifr && ifr[ST], parSt = par && par[ST], scr_handle;
        if (!posID || !params || !ifr || !par) return;
        if (!params.expanded) return;
        scr_handle = scroll_parents_attached[posID];
        if (scr_handle && scr_handle.tID) clearTimeout(scr_handle.tID);
        _clear_geom_update_timer();
        if (!noMsging) {
            if (_fire_pub_callback(BF_POS_MSG, posID, COLLAPSE_COMMAND, 0, 0)) return;
        }
        ifrSt.left = ifrSt.top = "0px";
        parSt[WIDTH] = ifrSt[WIDTH] = params_conf.w + PX;
        parSt[HEIGHT] = ifrSt[HEIGHT] = params_conf.h + PX;
        ifrSt.zIndex = params.dx = params.dy = 0;
        _shim_frame(id);
        if (!noMsging) {
            _fire_pub_callback(POS_MSG, posID, COLLAPSE_COMMAND, 0, 0);
            msgObj.cmd = isOutside ? "collapsed" : "collapse";
            msgObj.geom = _es(_build_geom(posID, ifr, TRUE));
            _send_response(params, msgObj);
        }
        ifr = ifrSt = par = parSt = params = msgObj = NULL;
    }
    function _record_error(msgObj) {
        var posID = msgObj && msgObj.pos, params = posID && rendered_ifrs[posID], params_conf = params && params.conf, id = params_conf && params_conf.dest, ifr = id && _elt(id), par = ifr && _elt(POS_REL_BOX_ID_PREFIX + "_" + posID), ifrSt = ifr && ifr[ST], parSt = par && par[ST], scr_handle;
        if (sf && sf.info && sf.info.errs) {
            sf.info.errs.push(msgObj);
        }
        _fire_pub_callback(POS_MSG, posID, ERROR_COMMAND, msgObj);
    }
    function _cookieHash() {
        var cooks, key, i, cookies = {}, c;
        cooks = document.cookie.split("; ");
        for (i = cooks.length - 1; i >= 0; i--) {
            c = cooks[i].split("=");
            cookies[c[0]] = c[1];
        }
        return cookies;
    }
    function _read_cookie(msgObj, isOutside) {
        var posID = msgObj && msgObj.pos, params = posID && rendered_ifrs[posID], params_conf = params && params.conf, id = params_conf && params_conf.dest, ifr = id && _elt(id), key, cookies;
        var command = "read-cookie";
        var canRead = params_conf.supports && params_conf.supports[command] && params_conf.supports[command] != "0";
        if (!canRead) {
            return;
        }
        if (!posID || !params || !ifr) return;
        key = msgObj.cookie;
        if (!key) return;
        cookies = _cookieHash();
        _fire_pub_callback(POS_MSG, command, posID, 0, 0);
        msgObj.cmd = command;
        msgObj.geom = _es(_build_geom(posID, ifr, TRUE));
        msgObj.value = cookies[key];
        _send_response(params, msgObj);
        ifr = params = msgObj = NULL;
    }
    function _write_cookie(msgObj, isOutside) {
        var posID = msgObj && msgObj.pos, params = posID && rendered_ifrs[posID], params_conf = params && params.conf, id = params_conf && params_conf.dest, ifr = id && _elt(id), key, newValue, cookies, newCookies;
        var command = "write-cookie";
        var canRead = params_conf.supports && params_conf.supports[command] && params_conf.supports[command] != "0";
        if (!canRead) {
            return;
        }
        if (!posID || !params || !ifr) return;
        key = msgObj.cookie;
        if (!key) return;
        newValue = escape(msgObj.value);
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 1);
        var c_value = newValue + "; expires=" + exdate.toUTCString();
        document.cookie = key + "=" + c_value;
        _fire_pub_callback(POS_MSG, command, posID, 0, 0);
        msgObj.cmd = command;
        msgObj.geom = _es(_build_geom(posID, ifr, TRUE));
        msgObj.info = newValue;
        msgObj.value = "";
        _send_response(params, msgObj);
        ifr = params = msgObj = NULL;
    }
    function nuke() {
        var idx = 0, empty = TRUE, args = arguments, pos_id, pos, el_id, el, sb_rel, par;
        if (!args[LEN] || args[idx] == "*") {
            args = [];
            for (pos_id in rendered_ifrs) {
                args.push(pos_id);
            }
        }
        while (pos_id = args[idx++]) {
            pos = rendered_ifrs[pos_id];
            if (pos) {
                if (pos_id in pending_ifrs) {
                    clearTimeout(pending_ifrs[pos_id]);
                    delete pending_ifrs[pos_id];
                }
                if (pos_id in complete_ifrs) delete complete_ifrs[pos_id];
                el_id = pos.dest;
                el = el_id && _elt(el_id);
                par = el && _par(el);
                if (dom.attr(par, "id").indexOf(POS_REL_BOX_ID_PREFIX) != -1) {
                    sb_rel = par;
                    par = _par(sb_rel);
                }
                dom.purge(el);
                if (sb_rel) dom.purge(sb_rel);
                rendered_ifrs[pos_id] = NULL;
                delete rendered_ifrs[pos_id];
                el = dom.make("div");
                dom.attr(el, "id", el_id);
                dom.append(par, el);
            }
        }
        pos_id = "";
        for (pos_id in rendered_ifrs) {
            empty = FALSE;
            break;
        }
        if (empty) {
            current_status = "";
            _handle_unload();
        }
    }
    function render() {
        var idx = 0, args = arguments, firstCSSPos = "relative", finalCSSPos = "absolute", finalCSSEnd = "top:0px;left:0px;visibility:hidden;display:none;", pos, pos_id, pos_conf, dest_el, new_dest_el, rel_el, par_el, name_params, dest_id, dest_rel_id, css_txt, w, h, st, e, pend;
        if (!config) return FALSE;
        if (!dom.ready()) {
            dom.wait(function() {
                render.apply(NULL, args);
                args = NULL;
            });
            return NULL;
        }
        if (args[0] instanceof Array && args[LEN] == 1) {
            args = args[0];
        }
        while (pos = args[idx++]) {
            pos_id = pos.id;
            pos_conf = pos_id ? config.positions[pos_id] : NULL;
            if (pos_conf) {
                dest_id = pos_conf.dest;
                dest_el = dest_id && _elt(dest_id);
                if (dest_el) {
                    w = pos_conf.w;
                    h = pos_conf.h;
                    if (!w) {
                        try {
                            w = dest_el.offsetWidth;
                        } catch (e) {
                            w = 0;
                        }
                        if (w) pos_conf.w = w;
                    }
                    if (!h) {
                        try {
                            h = dest_el.offsetHeight;
                        } catch (e) {
                            h = 0;
                        }
                        if (h) pos_conf.h = h;
                    }
                    if (w && h) {
                        name_params = new ParamHash();
                        dest_rel_id = POS_REL_BOX_ID_PREFIX + "_" + pos_id;
                        rel_el = _elt(dest_rel_id);
                        par_el = _par(dest_el);
                        if (rel_el && par_el == rel_el) par_el = _par(rel_el);
                        _shim_frame(dest_id);
                        pend = pending_ifrs[pos_id];
                        if (pend) clearTimeout(pend);
                        pend = complete_ifrs[pos_id];
                        if (pend) delete complete_ifrs[pos_id];
                        pending_ifrs[pos_id] = setTimeout(function() {
                            _handle_render_timeout(pos_id);
                        }, config.to);
                        current_status = "rendering";
                        _fire_pub_callback("onStartPosRender", pos_id, pos_conf, pos);
                        css_txt = [ "position:", "", ";z-index:0;", WIDTH, ":", w, PX, ";", HEIGHT, ":", h, PX, ";", "visibility:inherit;" ];
                        if (!rel_el) {
                            css_txt[1] = firstCSSPos;
                            rel_el = dom.make("div");
                            rel_el.id = dest_rel_id;
                            rel_el.className = "iab_sf";
                            new_dest_el = dest_el.cloneNode(FALSE);
                            dom.css(new_dest_el, css_txt);
                            rel_el.appendChild(new_dest_el);
                            dom.css(rel_el, css_txt);
                            par_el.replaceChild(rel_el, dest_el);
                            dest_el = _elt(dest_id);
                        } else {
                            st = rel_el[ST];
                            st.width = w + PX;
                            st.height = h + PX;
                            st = dest_el && dest_el[ST];
                            st.width = w + PX;
                            st.height = h + PX;
                        }
                        name_params.id = pos_id;
                        name_params.dest = dest_id;
                        name_params.conf = ParamHash(pos_conf);
                        name_params.meta = pos.meta.toString();
                        name_params.html = _es(pos.html);
                        name_params.geom = _es(_build_geom(pos_id, dest_el));
                        name_params.src = config.renderFile;
                        name_params.has_focus = lang.cstr(document.hasFocus());
                        css_txt[1] = finalCSSPos;
                        css_txt[13] = finalCSSEnd;
                        if (!win_events_attached) {
                            dom.attach(win, SCROLL, _handle_win_geom_scroll);
                            dom.attach(win, "resize", _handle_win_geom_resize);
                            dom.attach(win, "unload", _handle_unload);
                            dom.attach(win, "focus", _handle_win_focus);
                            dom.attach(win, "blur", _handle_win_blur);
                            win_events_attached = TRUE;
                        }
                        iframes.replace({
                            id: dest_id,
                            name: name_params,
                            src: config.renderFile,
                            _pos_id: pos_id
                        }, css_txt, rel_el, _handle_frame_load, _handle_msg_evt);
                        rendered_ifrs[pos_id] = name_params;
                    }
                }
            }
        }
    }
    function get(positionId) {
        var obj = rendered_ifrs[positionId];
        if (!obj) return null;
        return _mix({}, obj);
    }
    function status() {
        return current_status;
    }
    if (lang) {
        if (win == top) {
            _rect = ieVer ? _getRectIE : _getRectNonIE;
            lang.def("dom", {
                rect: _rect,
                currentStyle: currentStyle,
                contains: contains,
                docRect: docRect,
                winRect: winRect,
                bounds: bounds,
                overlaps: overlaps
            }, lib, TRUE);
            (function() {
                var e;
                if (lang) {
                    lang.def("msghost", {
                        prep: prep_iframe_msging,
                        attach: attach_iframe_msging,
                        detach: detach_iframe_msging,
                        usingHTML5: usingHTML5,
                        send: send_msg_to_child_iframe
                    }, dom, TRUE);
                    dom[ATTACH](win, MSG, _check_html5_init);
                    initID = "xdm-html5-init-" + _guid();
                    locHost = locHost.indexOf("file") == 0 ? locHost = "file" : locHost;
                    try {
                        win[PMSG](initID, locHost == "file" ? "*" : locHost);
                    } catch (e) {
                        dom[DETACH](win, MSG, _check_html5_init);
                    }
                }
            })();
            lang.def("$sf.host", {
                Config: Config,
                PosConfig: PosConfig,
                PosMeta: PosMeta,
                Position: Position,
                nuke: nuke,
                get: get,
                render: render,
                status: status
            }, NULL, TRUE);
        }
    }
})(window);

(function(win) {
    var FALSE = false, TRUE = true, NULL = null, SF_DATATAG_CLASS = "sf_data", SF_TAG_TYPE = "text/x-safeframe", AUTO_BOOT_MAX_RETRIES = 100, SF_POSELEM_WRAPPER_CLASS = "sf_position", d = win && win.document, sf = win && win.$sf, lib = sf && sf.lib, lang = lib && lib.lang, dom = lib && lib.dom, _cstr = lang && lang.cstr, _guid = lang && lang.guid, _elt = dom && dom.elt, _par = dom && dom.par, _tags = dom && dom.tags, _attr = dom && dom.attr, _purge = dom && dom.purge, _ready = dom && dom.ready, inline_tags_processed = {}, boot_retries = 0, has_booted = FALSE, doing_auto_boot = FALSE;
    function _log(msg, is_err) {
        var head_el, err_tag;
        try {
            if (!lib) lib = sf && sf.lib;
            if (lib && lib.logger && win == top) {
                if (is_err) {
                    lib.logger.error(msg);
                } else {
                    lib.logger.log(msg);
                }
            } else {
                head_el = d.getElementsByTagName("head")[0];
                err_tag = d.createElement("script");
                err_tag.type = "text/plain";
                err_tag.text = "\x3c!-- SafeFrame " + (is_err ? "error" : "log") + ": " + (msg || "unknown") + " --\x3e";
                head_el.appendChild(head_el, err_tag);
            }
        } catch (e) {}
    }
    function _create_pos_markup(src) {
        return _cstr([ "<scr", "ipt type='text/javascript', src='", src, "'></scr", "ipt>" ]);
    }
    function _auto_boot() {
        var do_auto = TRUE, config, sf_host, host_file, head, scr_tag;
        if (has_booted) return;
        sf_host = sf && sf.host;
        if (win == top) {
            if (sf_host && !sf_host.boot) {
                sf_host.boot = boot;
            }
            try {
                config = sf_host && sf_host.Config();
            } catch (e) {
                config = NULL;
            }
            if (!config) {
                try {
                    config = sf_host && sf_host.conf;
                } catch (e) {
                    config = NULL;
                }
            }
            if (config) {
                if ("auto" in config && config.auto === FALSE) do_auto = FALSE;
                if (!sf_host.render || !sf_host.Config) {
                    host_file = config.hostFile;
                    if (host_file) {
                        head = _tags("head")[0];
                        scr_tag = dom.make("script");
                        scr_tag.id = "sf_host_lib";
                        scr_tag.type = "text/javascript";
                        scr_tag.className = "sf_lib";
                        scr_tag.src = host_file;
                        if (win.ActiveXObject) {
                            scr_tag.onreadystatechange = function() {
                                var rs = scr_tag.readyState;
                                if (rs == "loaded" || rs == "complete") {
                                    doing_auto_boot = FALSE;
                                    if (do_auto) boot();
                                    scr_tag.onreadystatechange = NULL;
                                    scr_tag = head = sf_host = config = NULL;
                                }
                            };
                        } else {
                            scr_tag.onload = function() {
                                doing_auto_boot = FALSE;
                                if (do_auto) boot();
                                scr_tag.onload = NULL;
                                scr_tag = head = sf_host = config = NULL;
                            };
                        }
                        doing_auto_boot = TRUE;
                        head.appendChild(scr_tag);
                        return;
                    }
                }
            }
            if (do_auto) {
                if (config) {
                    doing_auto_boot = TRUE;
                    boot();
                    doing_auto_boot = FALSE;
                } else {
                    if (boot_retries++ <= AUTO_BOOT_MAX_RETRIES) setTimeout(_auto_boot, 50);
                }
            }
        } else {
            boot();
        }
    }
    function _clean_up_booted_tags() {
        var script_tag_id, script_tag;
        if (dom) {
            for (script_tag_id in inline_tags_processed) {
                script_tag = _elt(script_tag_id);
                if (script_tag) {
                    _purge(script_tag);
                    delete inline_tags_processed[script_tag_id];
                }
            }
        }
    }
    function boot() {
        var script_tags = _tags && _tags("script") || [], boot_positions = [], idx = 0, ret = FALSE, errMsg, sf_host = sf && sf.host, sf_inline_conf = sf_host && sf_host.conf, script_tag, script_tag_par, script_tag_id, data, html, pos_obj, pos_conf, pos_dest_el, pos_meta, pos_meta_item, typ, shared_meta, prv_meta, prv_meta_key, meta_key, sf_ocnf, err;
        if (!sf || !lang || !dom) {
            _log("SafeFrame base library not found", TRUE);
            return ret;
        }
        if (!lib) lib = sf && sf.lib;
        if (doing_auto_boot && has_booted) {
            _log("Automatic boot already invoked");
            return ret;
        }
        if (win == top) {
            try {
                sf_conf = sf_host.Config();
            } catch (err) {
                sf_conf = NULL;
            }
            if (sf_inline_conf && !sf_conf) {
                try {
                    sf_conf = sf_host.Config(sf_inline_conf);
                } catch (e) {
                    sf_conf = NULL;
                }
            }
            if (!sf_conf) {
                _log("No configuration found");
                return ret;
            }
        }
        while (script_tag = script_tags[idx++]) {
            if (script_tag.className == SF_DATATAG_CLASS || _attr(script_tag, "type") == SF_TAG_TYPE) {
                has_booted = TRUE;
                script_tag_id = _attr(script_tag, "id");
                if (!script_tag_id) {
                    script_tag_id = _guid("sf_data_element");
                    _attr(script_tag, "id", script_tag_id);
                }
                if (inline_tags_processed[script_tag_id]) continue;
                data = script_tag.text || script_tag.innerHTML || script_tag.innerText;
                try {
                    data = lang.trim(data);
                    data = new Function("return " + data);
                    data = data();
                } catch (err) {
                    data = NULL;
                    errMsg = "Error parsing tag configuration " + (err && err.message || "");
                    _log(errMsg, TRUE);
                    continue;
                }
                if (data && data.id && (data.html || data.src)) {
                    if (win != top) {
                        html = data.html || "";
                        html = html || _create_pos_markup(data.src);
                        if (!_ready()) {
                            d.write(html);
                        } else {
                            _log("cannot write html content into already loaded document");
                        }
                    } else {
                        script_tag_par = _par(script_tag);
                        if (!script_tag_par) {
                            _log("can't find parent element for script tag", TRUE);
                            continue;
                        }
                        pos_conf = sf_conf && sf_conf.positions[data.id];
                        if (!pos_conf) {
                            pos_conf = data.conf;
                            pos_conf.id = data.id;
                            if (pos_conf) pos_conf = new sf_host.PosConfig(pos_conf);
                        }
                        if (!pos_conf) {
                            _log("no position conf found pre-defined or inline for position " + data.id, TRUE);
                            continue;
                        }
                        if (!pos_conf.dest) {
                            pos_conf = new sf_host.PosConfig(pos_conf, _guid(SF_POSELEM_WRAPPER_CLASS));
                        }
                        if (data.meta) {
                            pos_meta = data.meta;
                            meta_key = "";
                            shared_meta = {};
                            for (meta_key in pos_meta) {
                                pos_meta_item = pos_meta[meta_key];
                                typ = typeof pos_meta_item;
                                if (!prv_meta && typ == "object" && pos_meta_item) {
                                    prv_meta = pos_meta_item;
                                    prv_meta_key = meta_key;
                                }
                                if (typ != "object" && typ != "function") {
                                    shared_meta[meta_key] = pos_meta_item;
                                }
                            }
                            pos_meta = new sf_host.PosMeta(shared_meta, prv_meta_key || "", prv_meta_key && prv_meta ? prv_meta : NULL);
                        }
                        pos_obj = new sf_host.Position(data, NULL, pos_meta, pos_conf);
                        inline_tags_processed[script_tag_id] = script_tag_id;
                        pos_dest_el = _elt(pos_conf.dest);
                        if (!pos_dest_el) {
                            if (_ready()) {
                                pos_dest_el = dom.make("div");
                                _attr(pos_dest_el, "id", pos_conf.dest);
                                try {
                                    script_tag_par.insertBefore(pos_dest_el);
                                } catch (err) {
                                    _log("failed auto-adding destination element " + err.message, TRUE);
                                    continue;
                                }
                            } else {
                                d.write("<div id='", pos_conf.dest, "'></div>");
                            }
                        }
                        boot_positions.push(pos_obj);
                    }
                } else {
                    _log("no content or id property found in the inline position object", TRUE);
                }
            }
        }
        if (boot_positions.length) {
            try {
                sf_host.render(boot_positions);
            } catch (e) {
                _log("failed during rendering " + e.message);
            }
        } else {
            _log("no positions to boot");
        }
        dom.wait(_clean_up_booted_tags);
    }
    setTimeout(_auto_boot, 50);
})(window);