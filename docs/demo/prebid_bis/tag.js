if (typeof ord == "undefined") {
    var ord = Math.random() * 1e16;
}

var ekl, mts, xas, hky, categoryName, category, subcategory, adhoccategory, subcat, category, brandid, price;

function Adhese() {
    this.detection = new this.Detection();
}

Adhese.prototype.registerDM = function(val) {
    if (!this.profile.dm) {
        this.profile.dm = ";";
    }
    if (!~this.profile.dm.indexOf(";" + val)) {
        this.profile.dm += ";" + val;
    }
};

Adhese.prototype.init = function() {
    this.config = new Object();
    this.config.host = "https://ads-pebblemedia.adhese.com/";
    this.host = "https://ads-pebblemedia.adhese.com/adj";
    this.previewHost = "https://pebblemedia.adhese.org/creatives/preview/tag.do?";
    this.template = "none";
    this.ads = [];
    this.flash.check();
    this.browser.detect();
    this.preview.check(this);
    this.hkey = "unknown";
    this.rand = Math.round(Math.random() * 1e4);
    this.numberOfAdsInStack = 3;
    this.product = this.getLocation();
    this.publication = "";
    this.profile = {};
    this.xuArray = [];
    this.sgArray = [];
    this.profile["in"] = "allowfloat";
    if (typeof ps_display_params != "undefined" && typeof bw_ps_adspot_id != "undefined" && ps_display_params != "") {
        this.profile["in"] += ";prx";
    }
    this.profile.rn = Math.round(Math.random() * 1e4);
    this.profile.dt = this.detection.device();
    this.profile.br = [ this.browser.name, this.browser.name + this.browser.version, this.browser.os, this.profile.dt ].join(";");
    this.profile.HR = this.base64.encode(window.location.href);
    this.profile.RF = this.base64.encode(document.referrer.substr(0, 200));
    if (typeof mediasynced_target != "undefined" && mediasynced_target != "") {
        this.profile.ct = mediasynced_target;
    } else {
        this.profile.ct = "";
    }
    if (this.profile.br.indexOf("Explorer7") != -1 || document.documentMode && document.documentMode < 8) {
        this.adformDisplayed = true;
    } else {
        this.adformDisplayed = false;
    }
    if (typeof hky != "undefined") this.hkey = hky;
    if (this.readCookie("advertPPAccepted") == "true") {} else {
        this.nocookiesforme = 1;
    }
};

Adhese.prototype.tag = function(options) {
    if (this.eatsCookie()) {
        this.syncUser("rubicon", {
            rp_account: "adhese"
        });
    }
    if ((options.format == "Splash" || options.format == "MSP" || options.format == "TSP") && this.cookie.read(options.publication + "Splash") && !this.preview.active) {
        options = null;
    }
    if (options && options.format && options.location) {
        var adOptions = {};
        if (typeof options != "undefined") {
            adOptions.product = "_";
            if (options.publication) {
                this.publication = options.publication;
                adOptions.product += options.publication + "_";
            }
            if (options.location) {
                if (options.publication && options.publication != "undefined" && options.format == "textlink") {
                    this.product = options.publication + "-" + options.location;
                } else {
                    this.product = options.location;
                }
                adOptions.product += options.location + "_";
            }
            if (options.position) {
                options.placement = options.position;
            }
            if (options.placement) {
                adOptions.product += options.placement + "_";
                this.product = options.location;
            }
            if (options.categories) {
                categoryName = options.categories[0];
                var ct = options.categories.join(";");
                ct = ct.toLowerCase();
                ct = ct.replace(new RegExp("[-_. ']", "g"), "");
                if (this.profile.ct == "") {
                    this.profile.ct = ct;
                } else {
                    this.profile.ct += ";" + ct;
                }
                var categories = ct.split(";");
                for (var i = 0; i < categories.length; i++) {
                    var c = categories[i];
                    if (c && c != "" && c != "undefined") {
                        this.xuArray.push("category;" + c);
                    }
                }
                this.profile.se = ct;
            }
            if (options.async) {
                adOptions.async = true;
            }
            if (options.prebid) {
                adOptions.prebid = true;
            }
        }
        var thisAd = new this.Ad(options.format, adOptions, this);
        this.ads.push(thisAd);
        return thisAd;
    }
};

Adhese.prototype.taghc = function(loc, template) {
    this.tag({
        format: template,
        location: loc
    });
};

Adhese.prototype.taghcs = function(loc, template, num) {
    this.numberOfAdsInStack = num;
    this.tag({
        format: template,
        location: loc
    });
};

Adhese.prototype.write = function(sl) {
    var req = "";
    req += "/sl" + sl;
    req += "/br" + this.browser.name + ";" + this.browser.name + this.browser.version + ";" + this.browser.os;
    req += "/rn" + this.rand;
    req += "/hk" + this.hkey;
    req += "/?t=" + new Date().getTime();
    document.write("<scr" + "ipt type='text/javascript' src=" + this.host + req + "></scri" + "pt>");
};

Adhese.prototype.createCookie = function(name, value, days) {
    var expires = "";
    if (days && days > 0) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3 - date.getTimezoneOffset() * 60 * 1e3);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

Adhese.prototype.readCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

Adhese.prototype.cookie = {};

Adhese.prototype.cookie.create = function(name, value, days) {
    var expires = "";
    if (days && days > 0) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3 - date.getTimezoneOffset() * 60 * 1e3);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

Adhese.prototype.cookie.read = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

Adhese.prototype.cookie.erase = function(name) {
    this.create(name, "", -1);
};

Adhese.prototype.visible = {};

Adhese.prototype.visible.check = function(id, pc) {
    var pc = pc ? pc : .5;
    if (document.getElementById(id)) {
        return this.offset(id).top - (this.viewHeight() + this.scrollTop()) <= this.elementHeight(id) * pc * -1;
    } else {
        return null;
    }
};

Adhese.prototype.visible.viewHeight = function() {
    if (typeof window.innerWidth != "undefined") {
        return window.innerHeight;
    } else if (typeof document.documentElement != "undefined" && typeof document.documentElement.clientWidth != "undefined" && document.documentElement.clientWidth != 0) {
        return document.documentElement.clientHeight;
    } else {
        return document.getElementsByTagName("body")[0].clientHeight;
    }
};

Adhese.prototype.visible.offset = function(id) {
    var oElement = document.getElementById(id);
    var pX = 0;
    var pY = 0;
    if (typeof oElement != "undefined") {
        for (pX = 0, pY = 0; oElement; oElement = oElement.offsetParent) {
            pX += oElement.offsetLeft;
            pY += oElement.offsetTop;
        }
    } else {
        pX += oElement.x;
        pY += oElement.y;
    }
    return {
        top: pY,
        left: pX
    };
};

Adhese.prototype.visible.scrollTop = function() {
    if (document.documentElement && document.documentElement.scrollTop) {
        return document.documentElement.scrollTop;
    } else if (document.body && document.body.scrollTop) {
        return document.body.scrollTop;
    } else if (window.pageYOffset) {
        return window.pageYOffset;
    } else if (window.scrollY) {
        return window.scrollY;
    }
    return 0;
};

Adhese.prototype.visible.elementHeight = function(id) {
    return document.getElementById(id) ? document.getElementById(id).offsetHeight : null;
};

Adhese.prototype.getLocation = function() {
    var lang = "";
    var l = window.location.href != "about:blank" ? window.location : parent.window.location;
    var p = l.hostname.replace(new RegExp("www."), "") || "unknown";
    var s = l.pathname.replace(/^\/([^\/]*).*$/, "$1");
    if (l.hostname.indexOf("pebblemedia.be") != -1) {
        s = "";
        p = "sporza_socio_home";
    } else if (l.hostname == "") {
        s = "";
        p = "flair-nl_others";
    }
    p += s != "" ? "_" + s : "";
    var loc = "_" + lang + p + "_";
    return loc.toLowerCase();
};

Adhese.prototype.addLoadEvent = function(func) {
    var ol = window.onload;
    if (typeof window.onload != "function") {
        window.onload = func;
    } else {
        window.onload = function() {
            ol();
            func();
        };
    }
};

Adhese.prototype.shuffleArray = function(a) {
    var ci = a.length;
    var v;
    var ri;
    while (0 !== ci) {
        ri = Math.floor(Math.random() * ci);
        ci -= 1;
        v = a[ci];
        a[ci] = a[ri];
        a[ri] = v;
    }
    return a;
};

Adhese.prototype.addEvent = function(t, f) {
    if (window.addEventListener) {
        window.addEventListener(t, f, false);
    } else if (window.attachEvent) {
        window.attachEvent("on" + t, f);
    }
};

Adhese.prototype.removeEvent = function(t, f) {
    if (window.removeEventListener) {
        window.removeEventListener(t, f, false);
    } else if (window.detachEvent) {
        window.detachEvent("on" + t, f);
    }
};

Adhese.prototype.checkParam = function(t, s) {
    return t.indexOf(s) == -1 && t != "" ? true : false;
};

Adhese.prototype.getOffset = function(id) {
    var el = document.getElementById(id);
    var o = {
        top: 0,
        left: 0
    };
    if (typeof el != "undefined") {
        for (o.left = 0, o.top = 0; el; el = el.offsetParent) {
            o.left += el.offsetLeft;
            o.top += el.offsetTop;
        }
    } else {
        o.left += oElement.x;
        o.top += oElement.y;
    }
    return o;
};

Adhese.prototype.merge = function(a, b) {
    var c = {};
    for (var k in a) {
        c[k] = a[k];
    }
    for (var k in b) {
        c[k] = b[k];
    }
    return c;
};

Adhese.prototype.refresh = function() {
    var rel = dhese.ads;
    this.photocounter++;
    if (arguments.length > 0) {
        rel = [];
        var x = 0;
        while (arguments.length > x) {
            var y = 0;
            while (this.ads.length > y) {
                if (this.ads[y].options.uid == arguments[x]) {
                    rel.push(this.ads[y]);
                    break;
                }
                y++;
            }
            x++;
        }
    }
    var i = 0;
    while (rel.length > i) {
        rel[i].reload();
        i++;
    }
};

Adhese.prototype.getBodyDimensions = function() {
    var myWidth = 0, myHeight = 0;
    if (typeof window.innerWidth == "number") {
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {
        width: myWidth,
        height: myHeight
    };
};

Adhese.prototype.removeFloatTarget = function() {
    this.profile["in"] = this.profile["in"].replace("allowfloat", "");
};

Adhese.prototype.base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(input) {
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
                enc2 = (chr1 & 3) << 4 | chr2 >> 4;
                enc3 = (chr2 & 15) << 2 | chr3 >> 6;
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
            }
            return output;
        }
    },
    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode(c >> 6 | 192);
                utftext += String.fromCharCode(c & 63 | 128);
            } else {
                utftext += String.fromCharCode(c >> 12 | 224);
                utftext += String.fromCharCode(c >> 6 & 63 | 128);
                utftext += String.fromCharCode(c & 63 | 128);
            }
        }
        return utftext;
    }
};

Adhese.prototype.Detection = function() {
    this.deviceType = {};
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

Adhese.prototype.preview = {};

Adhese.prototype.preview.check = function(p) {
    this.active = false;
    this.parent = p;
    this.formats = {};
    if (window.location.search.indexOf("adhesePreview") != -1) {
        var b = window.location.search.substring(1);
        var countCreatives = b.match(/adhesePreviewCreativeId/g).length;
        var p = b.split("&");
        var c = "";
        var s = "";
        var t = "";
        var templateCodes = new Array();
        for (var x = 0; x < p.length; x++) {
            if (p[x].split("=")[0] == "adhesePreviewCreativeId") {
                c = unescape(p[x].split("=")[1]);
            }
            if (p[x].split("=")[0] == "adhesePreviewSlotId") {
                s = p[x].split("=")[1];
            }
            if (p[x].split("=")[0] == "adhesePreviewCreativeTemplate") {
                t = p[x].split("=")[1];
                if (countCreatives > 1) {
                    this.formats[t] = {
                        slot: s,
                        creative: c
                    };
                } else {
                    templateCodes.push(t);
                }
            }
        }
        if (countCreatives == 1) {
            for (var y = 0; y < templateCodes.length; y++) {
                this.formats[templateCodes[y]] = {
                    slot: s,
                    creative: c
                };
            }
        }
        var c = [];
        for (k in this.formats) {
            c.push(k + "," + this.formats[k].creative + "," + this.formats[k].slot);
        }
        this.parent.cookie.create("adhese_preview", c.join("|"), 0);
        this.active = true;
        this.parent.addEvent("load", this.showSign);
    } else if (this.parent.cookie.read("adhese_preview")) {
        var v = this.parent.cookie.read("adhese_preview").split("|");
        for (var x = 0; x < v.length; x++) {
            var c = v[x].split(",");
            this.formats[c[0]] = {
                creative: c[1],
                slot: c[2]
            };
        }
        this.active = true;
        this.parent.addEvent("load", this.showSign);
    }
};

Adhese.prototype.preview.close = function() {
    this.parent.cookie.erase("adhese_preview");
    this.active = false;
    if (location.search.indexOf("adhesePreviewCreativeId") != -1) {
        window.location.search = window.location.search.split("?")[0];
    } else {
        window.location.reload();
    }
};

Adhese.prototype.preview.showSign = function() {
    var p = document.createElement("DIV");
    var msg = "<div onclick='adhese.preview.close(); return false;' style='font-family:Helvetica,Verdana; font-size:12px; text-align:center; background-color:#000000; color: #ffffff; position:fixed; top:0px; left:6px; padding:4px; border-style:dashed; border:2px; border-color:#000000;z-index:9999;cursor:pointer;'>";
    msg += "<p><b>Disable<br>Adhese<br>preview</b></p></div>";
    p.innerHTML = msg;
    document.body.appendChild(p);
};

Adhese.prototype.Ad = function Ad(t, o, p) {
    this.parent = p;
    this.defaults = {
        async: false,
        product: this.product,
        slot: ""
    };
    this.options = this.parent.merge(this.defaults, o);
    delete this.defaults;
    this.template = t;
    this.uid = t;
    if (this.options.uid) {} else {
        this.options.uid = t + this.parent.rand;
    }
    this.get();
};

Adhese.prototype.Ad.prototype.write = function() {
    var adurl = this.getAdRequest();
    document.write("<scr" + "ipt type='text/javascript' src=" + adurl + "></scri" + "pt>");
};

Adhese.prototype.Ad.prototype.get = function() {
    var that = this;
    that.isLoaded = false;
    if (!this.options.lazy && !this.options.async && !this.options.prebid) {
        this.write();
    } else if (this.options.lazy) {
        if (!document.getElementById(this.options.uid)) {
            document.write("<div id='" + this.options.uid + "' style='padding:-1px;margin:-1px;height:2px;'></div>");
        }
        that.LIVfn = function() {
            that.loadIfVisible();
        };
        that.removeScrollEvent(that.LIVfn);
        that.addScrollEvent(that.LIVfn);
    } else if (this.options.async) {
        that.load();
    }
};

Adhese.prototype.Ad.prototype.loaded = function(data) {
    var that = this;
    if (data != "") {
        var str_html = "<script>" + data + "</script>";
        document.getElementById(that.options.uid).style.height = null;
        $("#" + that.options.uid).html(writeCapture.sanitize(str_html));
    }
};

Adhese.prototype.Ad.prototype.load = function() {
    var that = this;
    var adurl = this.getAdRequest();
    if ($.browser.msie && window.XDomainRequest) {
        var xdr = new XDomainRequest();
        xdr.open("get", adurl);
        xdr.onload = function() {
            var data = xdr.responseText;
            that.loaded(data);
        };
        xdr.send();
    } else {
        $.ajax({
            dataType: "text",
            beforeSend: function(xhr) {
                xhr.withCredentials = true;
            },
            url: adurl,
            success: function(data, s, j) {
                that.loaded(data);
            }
        });
    }
};

Adhese.prototype.Ad.prototype.getAdRequest = function() {
    var req = [];
    if (this.parent.preview.active && this.parent.preview.formats[this.template]) {
        req = this.parent.previewHost + "id=" + this.parent.preview.formats[this.template].creative + "&slotId=" + this.parent.preview.formats[this.template].slot;
    } else {
        this.parent.profile.sl = this.options.product + this.options.slot + "-" + this.template;
        this.parent.profile.xu = this.parent.xuArray.join(";");
        this.parent.profile.sg = this.parent.sgArray.join(";");
        for (k in this.parent.profile) {
            req.push(k + this.parent.profile[k]);
        }
        req.push("hk" + this.parent.hkey);
        req.push("?t=" + Math.random() * 1e4);
        req = this.parent.host + "/" + req.join("/");
    }
    return req;
};

Adhese.prototype.Ad.prototype.addScrollEvent = function(func) {
    this.parent.addEvent("scroll", func);
};

Adhese.prototype.Ad.prototype.removeScrollEvent = function(func) {
    this.parent.removeEvent("scroll", func);
};

Adhese.prototype.Ad.prototype.addOnBlurEvent = function(func) {
    this.parent.addEvent("blur", func);
};

Adhese.prototype.Ad.prototype.addOnFocusEvent = function(func) {
    this.parent.removeEvent("blur", func);
};

Adhese.prototype.Ad.prototype.loadIfVisible = function() {
    var that = this;
    if (!that.isLoaded) {
        if (this.parent.visible.check(that.options.uid)) {
            that.removeScrollEvent(that.LIVfn);
            that.isLoaded = true;
            that.load();
        }
    }
};

Adhese.prototype.Ad.prototype.reload = function() {
    this.options.product = this.parent.getLocation();
    this.options.async = true;
    this.get();
};

Adhese.prototype.flash = {};

Adhese.prototype.flash.check = function() {
    this.active = false;
    if (navigator.mimeTypes && navigator.mimeTypes["application/x-shockwave-flash"]) {
        this.active = navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin;
    } else if (document.all && navigator.appVersion.indexOf("Mac") == -1) {
        eval('try {var xObj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");if (xObj) this.active = true; xObj = null; } catch (e) {}');
    }
    var plugin = navigator.mimeTypes && navigator.mimeTypes["application/x-shockwave-flash"] ? navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin : 0;
    if (plugin) {
        var dcfl = plugin.description.split(" ");
        var dcct;
        for (dcct = 0; dcct < dcfl.length; dcct++) {
            if (!isNaN(dcfl[dcct])) {
                if (parseInt(dcfl[dcct]) >= 8) this.active = true;
                break;
            }
        }
    } else if (navigator.userAgent && navigator.userAgent.indexOf("MSIE") >= 0 && (navigator.userAgent.indexOf("Windows 95") >= 0 || navigator.userAgent.indexOf("Windows 98") >= 0 || navigator.userAgent.indexOf("Windows NT") >= 0)) {
        document.write("<scr" + 'ipt language="VBScript"> \n');
        document.write("on error resume next \n");
        document.write('adhese.flash.active = (Isobject(Createobject("ShockwaveFlash.ShockwaveFlash.8")))\n');
        document.write("</scr" + "ipt>\n");
    }
    return this.active ? this.active = true : this.active = false;
};

Adhese.prototype.browser = {};

Adhese.prototype.browser.detect = function() {
    this.name = this.searchString(this.dataBrowser) || "unknownBrowser";
    this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "unknownVersion";
    this.os = this.searchString(this.dataOS) || "unknownOS";
};

Adhese.prototype.browser.searchString = function(data) {
    for (var i = 0; i < data.length; i++) {
        var dataString = data[i].string;
        var dataProp = data[i].prop;
        this.versionSearchString = data[i].versionSearch || data[i].identity;
        if (dataString) {
            if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
        } else if (dataProp) return data[i].identity;
    }
};

Adhese.prototype.browser.searchVersion = function(dataString) {
    var index = dataString.indexOf(this.versionSearchString);
    if (index == -1) return;
    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
};

Adhese.prototype.browser.dataBrowser = [ {
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

Adhese.prototype.browser.dataOS = [ {
    string: navigator.userAgent,
    subString: "Android",
    identity: "Android"
}, {
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
    subString: "Windows 95",
    identity: "Windows95"
}, {
    string: navigator.platform,
    subString: "Linux",
    identity: "Linux"
}, {
    string: navigator.userAgent,
    subString: "iPad",
    identity: "iPad"
}, {
    string: navigator.userAgent,
    subString: "iPhone",
    identity: "iPhone"
}, {
    string: navigator.userAgent,
    subString: "iPod",
    identity: "iPod"
}, {
    string: navigator.platform,
    subString: "Mac",
    identity: "Mac"
}, {
    string: navigator.userAgent,
    subString: "PlayStation Portable",
    identity: "PlayStationPortable"
}, {
    string: navigator.userAgent,
    subString: "BlackBerry",
    identity: "BlackBerry"
}, {
    string: navigator.userAgent,
    subString: "Symbian",
    identity: "Symbian"
} ];

Adhese.prototype.syncUser = function(network, identification) {
    if (network == "rubicon") {
        this.rubiconUserSync(identification);
    }
};

Adhese.prototype.rubiconUserSync = function(option) {
    if (option && option.rp_account && option.rp_account != "") {
        if (document.cookie.indexOf("rubicon_uid_last_sync") == -1) {
            this.addEvent("load", this.rubiconMultiSync);
            var date = new Date();
            date.setDate(date.getDate() + 1);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            var diff = date.getTime() - new Date().getTime();
            this.cookie.create("rubicon_uid_last_sync", diff, diff / 24 / 60 / 60 / 1e3);
        }
    }
};

Adhese.prototype.rubiconMultiSync = function() {
    var script = document.createElement("SCRIPT");
    script.type = "text/javascript";
    script.setAttribute("id", "multisync");
    script.setAttribute("data-partner", "adhese");
    script.setAttribute("data-region", "eu");
    script.setAttribute("data-country", "be");
    script.setAttribute("data-endpoint", "eu");
    script.src = "https://secure-assets.rubiconproject.com/utils/xapi/multi-sync.js";
    document.body.appendChild(script);
};

Adhese.prototype.eatsCookie = function() {
    this.cookie.create("adheseTestCookie", "", 1);
    if (this.cookie.read("adheseTestCookie") != null) {
        this.cookie.erase("adheseTestCookie");
        return true;
    } else {
        return false;
    }
};

Adhese.prototype.addTrackingPixel = function(uri) {
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
    if (this.requestExtra) {
        for (var i = 0, a = this.requestExtra; i < a.length; i++) {
            if (a[i]) {
                uri += a[i] + "/";
            }
        }
        uri += "?t=" + new Date().getTime();
    }
    return uri;
};

Adhese.prototype.getSlotName = function(ad) {
    return this.getLocation() + "-" + ad.template;
};

window.debug = function() {
    var i = this, b = Array.prototype.slice, d = i.console, h = {}, f, g, m = 9, c = [ "error", "warn", "info", "debug", "log" ], l = "assert clear count dir dirxml exception group groupCollapsed groupEnd profile profileEnd table time timeEnd trace".split(" "), j = l.length, a = [];
    while (--j >= 0) {
        (function(n) {
            h[n] = function() {
                m !== 0 && d && d[n] && d[n].apply(d, arguments);
            };
        })(l[j]);
    }
    j = c.length;
    while (--j >= 0) {
        (function(n, o) {
            h[o] = function() {
                var q = b.call(arguments), p = [ o ].concat(q);
                a.push(p);
                e(p);
                if (!d || !k(n)) {
                    return;
                }
                d.firebug ? d[o].apply(i, q) : d[o] ? d[o](q) : d.log(q);
            };
        })(j, c[j]);
    }
    function e(n) {
        if (f && (g || !d || !d.log)) {
            f.apply(i, n);
        }
    }
    h.setLevel = function(n) {
        m = typeof n === "number" ? n : 9;
    };
    function k(n) {
        return m > 0 ? m > n : c.length + m <= n;
    }
    h.setCallback = function() {
        var o = b.call(arguments), n = a.length, p = n;
        f = o.shift() || null;
        g = typeof o[0] === "boolean" ? o.shift() : false;
        p -= typeof o[0] === "number" ? o.shift() : n;
        while (p < n) {
            e(a[p++]);
        }
    };
    return h;
}();

if (typeof jQuery != "undefined") {
    (function(H, a) {
        var j = a.document;
        function C(Q) {
            var ac = j.createElement("div");
            j.body.insertBefore(ac, null);
            H.replaceWith(ac, '<script type="text/javascript">' + Q + "</script>");
        }
        H = H || function(Q) {
            return {
                ajax: Q.ajax,
                $: function(ac) {
                    return Q(ac)[0];
                },
                replaceWith: function(ac, ag) {
                    var af = Q(ac)[0];
                    if (af) {
                        var ae = af.nextSibling, ad = af.parentNode;
                    }
                    Q(af).remove();
                    if (ae) {
                        Q(ae).before(ag);
                    } else {
                        Q(ad).append(ag);
                    }
                },
                onLoad: function(ac) {
                    Q(ac);
                },
                copyAttrs: function(ai, ae) {
                    var ag = Q(ae), ad = ai.attributes;
                    for (var af = 0, ac = ad.length; af < ac; af++) {
                        if (ad[af] && ad[af].value) {
                            try {
                                ag.attr(ad[af].name, ad[af].value);
                            } catch (ah) {}
                        }
                    }
                }
            };
        }(a.jQuery);
        H.copyAttrs = H.copyAttrs || function() {};
        H.onLoad = H.onLoad || function() {
            throw "error: autoAsync cannot be used without jQuery or defining writeCaptureSupport.onLoad";
        };
        function T(ae, ad) {
            for (var ac = 0, Q = ae.length; ac < Q; ac++) {
                if (ad(ae[ac]) === false) {
                    return;
                }
            }
        }
        function w(Q) {
            return Object.prototype.toString.call(Q) === "[object Function]";
        }
        function q(Q) {
            return Object.prototype.toString.call(Q) === "[object String]";
        }
        function v(ad, ac, Q) {
            return Array.prototype.slice.call(ad, ac || 0, Q || ad && ad.length);
        }
        function G(ae, ad) {
            var Q = false;
            T(ae, ac);
            function ac(af) {
                return !(Q = ad(af));
            }
            return Q;
        }
        function O(Q) {
            this._queue = [];
            this._children = [];
            this._parent = Q;
            if (Q) {
                Q._addChild(this);
            }
        }
        O.prototype = {
            _addChild: function(Q) {
                this._children.push(Q);
            },
            push: function(Q) {
                this._queue.push(Q);
                this._bubble("_doRun");
            },
            pause: function() {
                this._bubble("_doPause");
            },
            resume: function() {
                this._bubble("_doResume");
            },
            _bubble: function(ac) {
                var Q = this;
                while (!Q[ac]) {
                    Q = Q._parent;
                }
                return Q[ac]();
            },
            _next: function() {
                if (G(this._children, Q)) {
                    return true;
                }
                function Q(ad) {
                    return ad._next();
                }
                var ac = this._queue.shift();
                if (ac) {
                    ac();
                }
                return !!ac;
            }
        };
        function i(Q) {
            if (Q) {
                return new O(Q);
            }
            O.call(this);
            this.paused = 0;
        }
        i.prototype = function() {
            function Q() {}
            Q.prototype = O.prototype;
            return new Q();
        }();
        i.prototype._doRun = function() {
            if (!this.running) {
                this.running = true;
                try {
                    while (this.paused < 1 && this._next()) {}
                } finally {
                    this.running = false;
                }
            }
        };
        i.prototype._doPause = function() {
            this.paused++;
        };
        i.prototype._doResume = function() {
            this.paused--;
            this._doRun();
        };
        function P() {}
        P.prototype = {
            _html: "",
            open: function() {
                this._opened = true;
                if (this._delegate) {
                    this._delegate.open();
                }
            },
            write: function(Q) {
                if (this._closed) {
                    return;
                }
                this._written = true;
                if (this._delegate) {
                    this._delegate.write(Q);
                } else {
                    this._html += Q;
                }
            },
            writeln: function(Q) {
                this.write(Q + "\n");
            },
            close: function() {
                this._closed = true;
                if (this._delegate) {
                    this._delegate.close();
                }
            },
            copyTo: function(Q) {
                this._delegate = Q;
                Q.foobar = true;
                if (this._opened) {
                    Q.open();
                }
                if (this._written) {
                    Q.write(this._html);
                }
                if (this._closed) {
                    Q.close();
                }
            }
        };
        var e = function() {
            var Q = {
                f: j.getElementById
            };
            try {
                Q.f.call(j, "abc");
                return true;
            } catch (ac) {
                return false;
            }
        }();
        function L(Q) {
            T(Q, function(ac) {
                var ad = j.getElementById(ac.id);
                if (!ad) {
                    l("<proxyGetElementById - finish>", "no element in writen markup with id " + ac.id);
                    return;
                }
                T(ac.el.childNodes, function(ae) {
                    ad.appendChild(ae);
                });
                if (ad.contentWindow) {
                    a.setTimeout(function() {
                        ac.el.contentWindow.document.copyTo(ad.contentWindow.document);
                    }, 1);
                }
                H.copyAttrs(ac.el, ad);
            });
        }
        function t(ac, Q) {
            if (Q && Q[ac] === false) {
                return false;
            }
            return Q && Q[ac] || o[ac];
        }
        function z(ad, aq) {
            var ak = [], ai = t("proxyGetElementById", aq), al = t("forceLastScriptTag", aq), ap = t("writeOnGetElementById", aq), af = t("immediateWrites", aq), Q = {
                write: j.write,
                writeln: j.writeln,
                finish: function() {},
                out: ""
            };
            ad.state = Q;
            j.write = af ? aj : ao;
            j.writeln = af ? am : ac;
            if (ai || ap) {
                Q.getEl = j.getElementById;
                j.getElementById = ae;
                if (ap) {
                    findEl = an;
                } else {
                    findEl = ag;
                    Q.finish = function() {
                        L(ak);
                    };
                }
            }
            if (al) {
                Q.getByTag = j.getElementsByTagName;
                j.getElementsByTagName = function(at) {
                    var ar = v(e ? Q.getByTag.call(j, at) : Q.getByTag(at));
                    if (at === "script") {
                        ar.push(H.$(ad.target));
                    }
                    return ar;
                };
                var ah = Q.finish;
                Q.finish = function() {
                    ah();
                    j.getElementsByTagName = Q.getByTag;
                };
            }
            function ao(ar) {
                Q.out += ar;
            }
            function ac(ar) {
                Q.out += ar + "\n";
            }
            function aj(ar) {
                var at = H.$(ad.target);
                var au = j.createElement("div");
                at.parentNode.insertBefore(au, at);
                H.replaceWith(au, U(ar));
            }
            function am(ar) {
                var at = H.$(ad.target);
                var au = j.createElement("div");
                at.parentNode.insertBefore(au, at);
                H.replaceWith(au, U(ar) + "\n");
            }
            function ag(at) {
                var ar = j.createElement("div");
                ak.push({
                    id: at,
                    el: ar
                });
                ar.contentWindow = {
                    document: new P()
                };
                return ar;
            }
            function an(au) {
                var ar = H.$(ad.target);
                var at = j.createElement("div");
                ar.parentNode.insertBefore(at, ar);
                H.replaceWith(at, Q.out);
                Q.out = "";
                return e ? Q.getEl.call(j, au) : Q.getEl(au);
            }
            function ae(at) {
                var ar = e ? Q.getEl.call(j, at) : Q.getEl(at);
                return ar || findEl(at);
            }
            return Q;
        }
        function Y(Q) {
            j.write = Q.write;
            j.writeln = Q.writeln;
            if (Q.getEl) {
                j.getElementById = Q.getEl;
            }
            return Q.out;
        }
        function R(Q) {
            return Q && Q.replace(/^\s*<!(\[CDATA\[|--)/, "").replace(/(\]\]|--)>\s*$/, "");
        }
        function b() {}
        function d(ac, Q) {
            console.error("Error", Q, "executing code:", ac);
        }
        var l = w(a.console && console.error) ? d : b;
        function V(ad, ac, Q) {
            var ae = z(ac, Q);
            try {
                C(R(ad));
            } catch (af) {
                l(ad, af);
            } finally {
                Y(ae);
            }
            return ae;
        }
        function S(ac) {
            var Q = /^(\w+:)?\/\/([^\/?#]+)/.exec(ac);
            return Q && (Q[1] && Q[1] != location.protocol || Q[2] != location.host);
        }
        function W(Q) {
            return new RegExp("\\b" + Q + "[\\s\\r\\n]*=[\\s\\r\\n]*(?:([\"'])([\\s\\S]*?)\\1|([^\\s>]+))", "i");
        }
        function k(Q) {
            var ac = W(Q);
            return function(ad) {
                var ae = ac.exec(ad) || [];
                return ae[2] || ae[3];
            };
        }
        var s = /(<script[^>]*>)([\s\S]*?)<\/script>/gi, E = /<script[^>]*\/>/gi, n = W("src"), aa = k("src"), r = k("type"), ab = k("language"), F = "__document_write_ajax_callbacks__", D = "__document_write_ajax_div-", g = "window['" + F + "']['%d']();", m = a[F] = {}, y = '<script type="text/javascript">' + g + "</script>", K = 0;
        function c() {
            return (++K).toString();
        }
        function J(ac, ad) {
            var Q;
            if (w(ac)) {
                Q = ac;
                ac = null;
            }
            ac = ac || {};
            Q = Q || ac && ac.done;
            ac.done = ad ? function() {
                ad(Q);
            } : Q;
            return ac;
        }
        var B = new i();
        var A = [];
        var f = window._debugWriteCapture ? function() {} : function(Q, ad, ac) {
            A.push({
                type: Q,
                src: ad,
                data: ac
            });
        };
        var N = window._debugWriteCapture ? function() {} : function() {
            A.push(arguments);
        };
        function Z(Q) {
            var ac = c();
            m[ac] = function() {
                Q();
                delete m[ac];
            };
            return ac;
        }
        function M(Q) {
            return y.replace(/%d/, Z(Q));
        }
        function U(ag, ak, ad, ai) {
            var ah = ad && new i(ad) || B;
            ak = J(ak);
            var af = t("done", ak);
            var Q = "";
            var ac = t("fixUrls", ak);
            if (!w(ac)) {
                ac = function(al) {
                    return al;
                };
            }
            if (w(af)) {
                Q = M(function() {
                    ah.push(af);
                });
            }
            return ag.replace(s, aj).replace(E, ae) + Q;
            function ae(al) {
                return aj(al, al.substring(0, al.length - 2) + ">", "");
            }
            function aj(an, az, am) {
                var ar = aa(az), aq = r(az) || "", aG = ab(az) || "", aF = !aq && !aG || aq.toLowerCase().indexOf("javascript") !== -1 || aG.toLowerCase().indexOf("javascript") !== -1;
                f("replace", ar, an);
                if (!aF) {
                    return an;
                }
                var aA = Z(au), at = D + aA, ay, ap = {
                    target: "#" + at,
                    parent: ai
                };
                function au() {
                    ah.push(ay);
                }
                if (ar) {
                    ar = ac(ar);
                    az = az.replace(n, "");
                    if (S(ar)) {
                        ay = aE;
                    } else {
                        if (t("asyncAll", ak)) {
                            ay = aD();
                        } else {
                            ay = ax;
                        }
                    }
                } else {
                    ay = aC;
                }
                function aC() {
                    al(am);
                }
                function ax() {
                    H.ajax({
                        url: ar,
                        type: "GET",
                        dataType: "text",
                        async: false,
                        success: function(aH) {
                            al(aH);
                        }
                    });
                }
                function ao(aJ, aH, aI) {
                    l("<XHR for " + ar + ">", aI);
                    ah.resume();
                }
                function av() {
                    return M(function() {
                        ah.resume();
                    });
                }
                function aD() {
                    var aJ, aI;
                    function aH(aL, aK) {
                        if (!aJ) {
                            aI = aL;
                            return;
                        }
                        try {
                            al(aL, av());
                        } catch (aM) {
                            l(aL, aM);
                        }
                    }
                    H.ajax({
                        url: ar,
                        type: "GET",
                        dataType: "text",
                        async: true,
                        success: aH,
                        error: ao
                    });
                    return function() {
                        aJ = true;
                        if (aI) {
                            al(aI);
                        } else {
                            ah.pause();
                        }
                    };
                }
                function aE(aH) {
                    var aJ = z(ap, ak);
                    ah.pause();
                    f("pause", ar);
                    p(ap.target, ar, aI);
                    function aI(aM, aL, aK) {
                        f("out", ar, aJ.out);
                        aw(Y(aJ), M(aJ.finish) + av());
                        f("resume", ar);
                    }
                }
                function al(aI, aH) {
                    var aJ = V(aI, ap, ak);
                    aH = M(aJ.finish) + (aH || "");
                    aw(aJ.out, aH);
                }
                function aB(aH) {
                    var aJ = {};
                    for (var aI in aH) {
                        if (aH.hasOwnProperty(aI)) {
                            aJ[aI] = aH[aI];
                        }
                    }
                    delete aJ.done;
                    return aJ;
                }
                function aw(aI, aH) {
                    H.replaceWith(ap.target, U(aI, aB(ak), ah, ap) + (aH || ""));
                }
                return '<div style="display: none" id="' + at + '"></div>' + az + g.replace(/%d/, aA) + "</script>";
            }
        }
        function p(af, ad, ag) {
            var ac = document.createElement("script");
            ac.src = ad;
            af = H.$(af);
            var Q = false, ae = af.parentNode;
            ac.onload = ac.onreadystatechange = function() {
                if (!Q && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
                    Q = true;
                    ag();
                    ac.onload = ac.onreadystatechange = null;
                    ae.removeChild(ac);
                }
            };
            ae.insertBefore(ac, af);
        }
        function I(ac, ad) {
            var Q = B;
            T(ac, function(ae) {
                Q.push(af);
                function af() {
                    ae.action(U(ae.html, ae.options, Q), ae);
                }
            });
            if (ad) {
                Q.push(ad);
            }
        }
        function X(Q) {
            var ac = Q;
            while (ac && ac.nodeType === 1) {
                Q = ac;
                ac = ac.lastChild;
                while (ac && ac.nodeType !== 1) {
                    ac = ac.previousSibling;
                }
            }
            return Q;
        }
        function h(Q) {
            var ad = j.write, ag = j.writeln, ac, ae = [];
            j.writeln = function(ah) {
                j.write(ah + "\n");
            };
            var af;
            j.write = function(ai) {
                var ah = X(j.body);
                if (ah !== ac) {
                    ac = ah;
                    ae.push(af = {
                        el: ah,
                        out: []
                    });
                }
                af.out.push(ai);
            };
            H.onLoad(function() {
                var ak, an, ai, am, al;
                Q = J(Q);
                al = Q.done;
                Q.done = function() {
                    j.write = ad;
                    j.writeln = ag;
                    if (al) {
                        al();
                    }
                };
                for (var aj = 0, ah = ae.length; aj < ah; aj++) {
                    ak = ae[aj].el;
                    an = j.createElement("div");
                    ak.parentNode.insertBefore(an, ak.nextSibling);
                    ai = ae[aj].out.join("");
                    am = ah - aj === 1 ? U(ai, Q) : U(ai);
                    H.replaceWith(an, am);
                }
            });
        }
        function x(ag) {
            var ah = document.getElementsByTagName("script"), an, ac, al, Q, ad, af, ae = 0, aj = ag ? M(function() {
                if (++ae >= ai.length) {
                    ag();
                }
            }) : "", ai = [];
            for (var ak = 0, am = ah.length; ak < am; ak++) {
                an = ah[ak];
                ad = an.getAttribute("extsrc");
                af = an.getAttribute("asyncsrc");
                if (ad || af) {
                    ai.push({
                        ext: ad,
                        async: af,
                        s: an
                    });
                }
            }
            for (ak = 0, am = ai.length; ak < am; ak++) {
                ac = ai[ak];
                if (ac.ext) {
                    al = '<script type="text/javascript" src="' + ac.ext + '"> </script>';
                    H.replaceWith(ac.s, U(al) + aj);
                } else {
                    if (ac.async) {
                        al = '<script type="text/javascript" src="' + ac.async + '"> </script>';
                        H.replaceWith(ac.s, U(al, {
                            asyncAll: true
                        }, new i()) + aj);
                    }
                }
            }
        }
        var u = "writeCapture";
        var o = a[u] = {
            _original: a[u],
            support: H,
            fixUrls: function(Q) {
                return Q.replace(/&amp;/g, "&");
            },
            noConflict: function() {
                a[u] = this._original;
                return this;
            },
            debug: A,
            proxyGetElementById: false,
            _forTest: {
                Q: i,
                GLOBAL_Q: B,
                $: H,
                matchAttr: k,
                slice: v,
                capture: z,
                uncapture: Y,
                captureWrite: V
            },
            replaceWith: function(Q, ad, ac) {
                H.replaceWith(Q, U(ad, ac));
            },
            html: function(Q, ae, ac) {
                var ad = H.$(Q);
                ad.innerHTML = "<span/>";
                H.replaceWith(ad.firstChild, U(ae, ac));
            },
            load: function(Q, ad, ac) {
                H.ajax({
                    url: ad,
                    dataType: "text",
                    type: "GET",
                    success: function(ae) {
                        o.html(Q, ae, ac);
                    }
                });
            },
            extsrc: x,
            autoAsync: h,
            sanitize: U,
            sanitizeSerial: I
        };
    })(this.writeCaptureSupport, this);
}

if (typeof jQuery != "undefined") {
    (function($) {
        "use strict";
        var managed = {}, cache = {};
        $.manageAjax = function() {
            function create(name, opts) {
                managed[name] = new $.manageAjax._manager(name, opts);
                return managed[name];
            }
            function destroy(name) {
                if (managed[name]) {
                    managed[name].clear(true);
                    delete managed[name];
                }
            }
            var publicFns = {
                create: create,
                destroy: destroy
            };
            return publicFns;
        }();
        $.manageAjax._manager = function(name, opts) {
            this.requests = {};
            this.inProgress = 0;
            this.name = name;
            this.qName = name;
            this.opts = $.extend({}, $.manageAjax.defaults, opts);
            if (opts && opts.queue && opts.queue !== true && typeof opts.queue === "string" && opts.queue !== "clear") {
                this.qName = opts.queue;
            }
        };
        $.manageAjax._manager.prototype = {
            add: function(url, o) {
                if (typeof url == "object") {
                    o = url;
                } else if (typeof url == "string") {
                    o = $.extend(o || {}, {
                        url: url
                    });
                }
                o = $.extend({}, this.opts, o);
                var origCom = o.complete || $.noop, origSuc = o.success || $.noop, beforeSend = o.beforeSend || $.noop, origError = o.error || $.noop, strData = typeof o.data == "string" ? o.data : $.param(o.data || {}), xhrID = o.type + o.url + strData, that = this, ajaxFn = this._createAjax(xhrID, o, origSuc, origCom);
                if (o.preventDoubleRequests && o.queueDuplicateRequests) {
                    if (o.preventDoubleRequests) {
                        o.queueDuplicateRequests = false;
                    }
                    setTimeout(function() {
                        throw "preventDoubleRequests and queueDuplicateRequests can't be both true";
                    }, 0);
                }
                if (this.requests[xhrID] && o.preventDoubleRequests) {
                    return;
                }
                ajaxFn.xhrID = xhrID;
                o.xhrID = xhrID;
                o.beforeSend = function(xhr, opts) {
                    var ret = beforeSend.call(this, xhr, opts);
                    if (ret === false) {
                        that._removeXHR(xhrID);
                    }
                    xhr = null;
                    return ret;
                };
                o.complete = function(xhr, status) {
                    that._complete.call(that, this, origCom, xhr, status, xhrID, o);
                    xhr = null;
                };
                o.success = function(data, status, xhr) {
                    that._success.call(that, this, origSuc, data, status, xhr, o);
                    xhr = null;
                };
                o.error = function(ahr, status, errorStr) {
                    var httpStatus = "", content = "";
                    if (status !== "timeout" && ahr) {
                        httpStatus = ahr.status;
                        content = ahr.responseXML || ahr.responseText;
                    }
                    if (origError) {
                        origError.call(this, ahr, status, errorStr, o);
                    } else {
                        setTimeout(function() {
                            throw status + "| status: " + httpStatus + " | URL: " + o.url + " | data: " + strData + " | thrown: " + errorStr + " | response: " + content;
                        }, 0);
                    }
                    ahr = null;
                };
                if (o.queue === "clear") {
                    $(document).clearQueue(this.qName);
                }
                if (o.queue || o.queueDuplicateRequests && this.requests[xhrID]) {
                    $.queue(document, this.qName, ajaxFn);
                    if (this.inProgress < o.maxRequests && (!this.requests[xhrID] || !o.queueDuplicateRequests)) {
                        $.dequeue(document, this.qName);
                    }
                    return xhrID;
                }
                return ajaxFn();
            },
            _createAjax: function(id, o, origSuc, origCom) {
                var that = this;
                return function() {
                    if (o.beforeCreate.call(o.context || that, id, o) === false) {
                        return;
                    }
                    that.inProgress++;
                    if (that.inProgress === 1) {
                        $.event.trigger(that.name + "AjaxStart");
                    }
                    if (o.cacheResponse && cache[id]) {
                        if (!cache[id].cacheTTL || cache[id].cacheTTL < 0 || new Date().getTime() - cache[id].timestamp < cache[id].cacheTTL) {
                            that.requests[id] = {};
                            setTimeout(function() {
                                that._success.call(that, o.context || o, origSuc, cache[id]._successData, "success", cache[id], o);
                                that._complete.call(that, o.context || o, origCom, cache[id], "success", id, o);
                            }, 0);
                        } else {
                            delete cache[id];
                        }
                    }
                    if (!o.cacheResponse || !cache[id]) {
                        if (o.async) {
                            that.requests[id] = $.ajax(o);
                        } else {
                            $.ajax(o);
                        }
                    }
                    return id;
                };
            },
            _removeXHR: function(xhrID) {
                if (this.opts.queue || this.opts.queueDuplicateRequests) {
                    $.dequeue(document, this.qName);
                }
                this.inProgress--;
                this.requests[xhrID] = null;
                delete this.requests[xhrID];
            },
            clearCache: function() {
                cache = {};
            },
            _isAbort: function(xhr, status, o) {
                if (!o.abortIsNoSuccess || !xhr && !status) {
                    return false;
                }
                var ret = !!(!xhr || xhr.readyState === 0 || this.lastAbort === o.xhrID);
                xhr = null;
                return ret;
            },
            _complete: function(context, origFn, xhr, status, xhrID, o) {
                if (this._isAbort(xhr, status, o)) {
                    status = "abort";
                    o.abort.call(context, xhr, status, o);
                }
                origFn.call(context, xhr, status, o);
                $.event.trigger(this.name + "AjaxComplete", [ xhr, status, o ]);
                if (o.domCompleteTrigger) {
                    $(o.domCompleteTrigger).trigger(this.name + "DOMComplete", [ xhr, status, o ]).trigger("DOMComplete", [ xhr, status, o ]);
                }
                this._removeXHR(xhrID);
                if (!this.inProgress) {
                    $.event.trigger(this.name + "AjaxStop");
                }
                xhr = null;
            },
            _success: function(context, origFn, data, status, xhr, o) {
                var that = this;
                if (this._isAbort(xhr, status, o)) {
                    xhr = null;
                    return;
                }
                if (o.abortOld) {
                    $.each(this.requests, function(name) {
                        if (name === o.xhrID) {
                            return false;
                        }
                        that.abort(name);
                    });
                }
                if (o.cacheResponse && !cache[o.xhrID]) {
                    if (!xhr) {
                        xhr = {};
                    }
                    cache[o.xhrID] = {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        responseXML: xhr.responseXML,
                        _successData: data,
                        cacheTTL: o.cacheTTL,
                        timestamp: new Date().getTime()
                    };
                    if ("getAllResponseHeaders" in xhr) {
                        var responseHeaders = xhr.getAllResponseHeaders();
                        var parsedHeaders;
                        var parseHeaders = function() {
                            if (parsedHeaders) {
                                return;
                            }
                            parsedHeaders = {};
                            $.each(responseHeaders.split("\n"), function(i, headerLine) {
                                var delimiter = headerLine.indexOf(":");
                                parsedHeaders[headerLine.substr(0, delimiter)] = headerLine.substr(delimiter + 2);
                            });
                        };
                        $.extend(cache[o.xhrID], {
                            getAllResponseHeaders: function() {
                                return responseHeaders;
                            },
                            getResponseHeader: function(name) {
                                parseHeaders();
                                return name in parsedHeaders ? parsedHeaders[name] : null;
                            }
                        });
                    }
                }
                origFn.call(context, data, status, xhr, o);
                $.event.trigger(this.name + "AjaxSuccess", [ xhr, o, data ]);
                if (o.domSuccessTrigger) {
                    $(o.domSuccessTrigger).trigger(this.name + "DOMSuccess", [ data, o ]).trigger("DOMSuccess", [ data, o ]);
                }
                xhr = null;
            },
            getData: function(id) {
                if (id) {
                    var ret = this.requests[id];
                    if (!ret && this.opts.queue) {
                        ret = $.grep($(document).queue(this.qName), function(fn, i) {
                            return fn.xhrID === id;
                        })[0];
                    }
                    return ret;
                }
                return {
                    requests: this.requests,
                    queue: this.opts.queue ? $(document).queue(this.qName) : [],
                    inProgress: this.inProgress
                };
            },
            abort: function(id) {
                var xhr;
                if (id) {
                    xhr = this.getData(id);
                    if (xhr && xhr.abort) {
                        this.lastAbort = id;
                        xhr.abort();
                        this.lastAbort = false;
                    } else {
                        $(document).queue(this.qName, $.grep($(document).queue(this.qName), function(fn, i) {
                            return fn !== xhr;
                        }));
                    }
                    xhr = null;
                    return;
                }
                var that = this, ids = [];
                $.each(this.requests, function(id) {
                    ids.push(id);
                });
                $.each(ids, function(i, id) {
                    that.abort(id);
                });
            },
            clear: function(shouldAbort) {
                $(document).clearQueue(this.qName);
                if (shouldAbort) {
                    this.abort();
                }
            }
        };
        $.manageAjax._manager.prototype.getXHR = $.manageAjax._manager.prototype.getData;
        $.manageAjax.defaults = {
            beforeCreate: $.noop,
            abort: $.noop,
            abortIsNoSuccess: true,
            maxRequests: 1,
            cacheResponse: false,
            async: true,
            domCompleteTrigger: false,
            domSuccessTrigger: false,
            preventDoubleRequests: true,
            queueDuplicateRequests: false,
            cacheTTL: -1,
            queue: false
        };
        $.each($.manageAjax._manager.prototype, function(n, fn) {
            if (n.indexOf("_") === 0 || !$.isFunction(fn)) {
                return;
            }
            $.manageAjax[n] = function(name, o) {
                if (!managed[name]) {
                    if (n === "add") {
                        $.manageAjax.create(name, o);
                    } else {
                        return;
                    }
                }
                var args = Array.prototype.slice.call(arguments, 1);
                managed[name][n].apply(managed[name], args);
            };
        });
    })(jQuery);
}

if (typeof jQuery != "undefined" && typeof $ != "undefined") {
    $.manageAjax.create("adhQueue", {
        queue: "clear",
        maxRequests: 2
    });
}

function getAdheseAdLoc() {
    var adheseLocation = "";
    if (adheseLocation == "" || adheseLocation == "unknown") {
        if (typeof section == "undefined") {
            section = "unknown";
        }
        adheseLocation = "_" + adheseSite + "_" + section.toLowerCase() + "_";
        if (typeof siteType != "undefined" && (siteType == "msite" || siteType == "nemo")) {
            adheseLocation = "_" + adheseSite + "_mobile_" + section.toLowerCase() + "_";
        }
        if (window.location.host.indexOf("testm.") != -1 || window.location.host.indexOf("previewm.") != -1) {
            adheseLocation = "_" + adheseSite + "_mobile_preview_";
        }
        if (~window.location.pathname.indexOf("/r/")) adheseLocation = "_" + adheseSite + "_mobile_regio_";
        if (~window.location.host.indexOf("meteo1")) adheseLocation = "_" + adheseSite + "_meteo_";
    }
    return adheseLocation;
}

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

Adhese.prototype.track = function(uri) {
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

var adhese = new Adhese();

adhese.init();

adhese.helper = {};

adhese.helper.log = function() {};

adhese.addEvent("load", adhese.checkVisible.bind(adhese));

adhese.addEvent("scroll", adhese.checkVisible.bind(adhese));

if (window.location.hostname == "" || window.location.hostname == "adhese.github.io") {
    var prebidScript = document.createElement("script");
    prebidScript.src = "prebid.js";
    prebidScript.onload = function() {};
    document.head.appendChild(prebidScript);
}

var adh_interests = adhese.profile["in"].split(";");

var adh_interests_list = [ {
    label: "autobuyers",
    value: "658"
}, {
    label: "business",
    value: "245"
}, {
    label: "cook",
    value: "128"
}, {
    label: "culture",
    value: "985"
}, {
    label: "fashionistas",
    value: "741"
}, {
    label: "football",
    value: "874"
}, {
    label: "gaming",
    value: "254"
}, {
    label: "glamour",
    value: "148"
}, {
    label: "immo",
    value: "284"
}, {
    label: "kids",
    value: "487"
}, {
    label: "music",
    value: "632"
}, {
    label: "news",
    value: "951"
}, {
    label: "sport",
    value: "125"
}, {
    label: "travel",
    value: "268"
}, {
    label: "tvlovers",
    value: "387"
}, {
    label: "movie",
    value: "154"
}, {
    label: "visitor",
    value: "visitor"
}, {
    label: "end",
    value: "end"
}, {
    label: "Q1R1",
    value: "q1r1"
}, {
    label: "Q12AR1",
    value: "q12ar1"
}, {
    label: "Q12BR1",
    value: "q12br1"
}, {
    label: "Q12BR2",
    value: "q12br2"
}, {
    label: "Q12BR3",
    value: "q12br3"
}, {
    label: "Q9BR2",
    value: "q9br2"
}, {
    label: "Q9CR2",
    value: "q9cr2"
}, {
    label: "premiumgaming",
    value: "231"
}, {
    label: "technology",
    value: "629"
}, {
    label: "male",
    value: "mmm"
}, {
    label: "likewoman",
    value: "fff"
}, {
    label: "luxewomen",
    value: "999"
}, {
    label: "health",
    value: "733"
} ];

for (var i = 0; i < adh_interests_list.length; i++) {
    if (adh_interests.indexOf(adh_interests_list[i].label) != -1) {
        adhese.xuArray.push("interests;" + adh_interests_list[i].value);
    }
}

var adh_brands = adhese.profile.br.split(";");

var adh_rp_brands_arr = [];

var adh_brands_list = [ {
    label: "predicube_touring_target_Q12BR1_BR2",
    value: "predicube_touring_target_Q12BR1_BR2"
}, {
    label: "predicube_touring_retarget_Q12BR1_BR2",
    value: "predicube_touring_retarget_Q12BR1_BR2"
}, {
    label: "predicube_touring_target_conversies",
    value: "predicube_touring_target_conversies"
}, {
    label: "iPad",
    value: "iPad"
}, {
    label: "Linux",
    value: "Linux"
}, {
    label: "Mac",
    value: "Mac"
}, {
    label: "unknownOS",
    value: "unknownOS"
}, {
    label: "Windows7",
    value: "Windows7"
}, {
    label: "Windows8",
    value: "Windows8"
}, {
    label: "Windows8.1",
    value: "Windows8.1"
}, {
    label: "WindowsVista",
    value: "WindowsVista"
}, {
    label: "WindowsXP",
    value: "WindowsXP"
}, {
    label: "Android",
    value: "Android"
}, {
    label: "iPhone",
    value: "iPhone"
}, {
    label: "unknown",
    value: "unknown"
}, {
    label: "predicube_pebble_gendermale",
    value: "pred-m"
}, {
    label: "predicube_pebble_gendermfemale",
    value: "pred-f"
} ];

for (var i = 0; i < adh_brands_list.length; i++) {
    if (adh_brands.indexOf(adh_brands_list[i].label) != -1) {
        adhese.xuArray.push("brands;" + adh_brands_list[i].value);
    }
}

adhese.xuArray.push("device;" + adhese.profile.dt);

if (typeof adh_language != "undefined") {
    adhese.xuArray.push("language;" + adh_language);
}

if (typeof adh_channel != "undefined") {
    adhese.xuArray.push("channel;" + adh_channel);
}

var pbmDmpCookie = adhese.readCookie("pbmDmp");

var pbmCxPqSegments = "";

if (pbmDmpCookie == null) {
    var cX = cX || {};
    cX.callQueue = cX.callQueue || [];
    cX.callQueue.push([ "setSiteId", "1128285567065903944" ]);
    cX.callQueue.push([ "sendPageViewEvent" ]);
    cX.callQueue.push([ "invoke", function() {
        pbmCxPqSegments = cX.getUserSegmentIds({
            persistedQueryId: "70377ec8f16097328ba267ce603e6549aa5a9985"
        });
    } ]);
    (function(d, s, e, t) {
        e = d.createElement(s);
        e.type = "text/java" + s;
        e.async = "async";
        e.src = "http" + ("https:" === location.protocol ? "s://s" : "://") + "cdn.cxense.com/cx.js";
        t = d.getElementsByTagName(s)[0];
        t.parentNode.insertBefore(e, t);
    })(document, "script");
}

var pbmCxCookie = adhese.readCookie("_cX_segmentInfo");

var pbmCxCkSegments = "";

if (pbmCxCookie != null) {
    pbmCxCkSegments = pbmCxCookie.split("_")[2];
}

if (pbmCxCkSegments != "") {
    var pbmCxCkSegmentsArray = pbmCxCkSegments.split(".");
    for (var i = 0; i < pbmCxCkSegmentsArray.length; i++) {
        adhese.sgArray.push(pbmCxCkSegmentsArray[i]);
        adhese.xuArray.push("CxSegments;" + pbmCxCkSegmentsArray[i]);
    }
} else {
    adhese.sgArray.push("nocX");
}