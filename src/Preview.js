/**
 * Function to check for preview parameters in the query string of the page location.
 * If present, the parameters are used to generate a live preview for the ad and are saved in a cookie named adhese_preview.
 * If no parameters are present but an adhese_preview cookie exists, the cookies value will be used to generate a live preview.
 * The parameters we are looking for are adhesePreviewCreativeId, adhesePreviewSlotId, adhesePreviewCreativeTemplate, adhesePreviewCreativeWidth, adhesePreviewCreativeHeight.
 */

Adhese.prototype.checkPreview = function () {
	this.previewFormats = {};
	if(!this.config.previewHost){
		return false;
	}
	if (window.location.search.indexOf("adhesePreview")!=-1) {
		this.helper.log("checking for preview");
        var b = window.location.search.substring(1);
        var countAd = (b.match(/adhesePreviewCreativeId/g)).length;
		var p = b.split("&");
		var c = '';
		var s = '';
		var t = '';
		var tf = '';
		var w = 0;
		var h = 0;
		var tc = [];
        if (b.indexOf("adhesePreviewExclusive=true") != -1) {
            this.config.previewExclusive = true;
        }
        if (b.indexOf("adhesePreviewExclusive=false") != -1) {
            this.config.previewExclusive = false;
        }
		for (var x=0; x<p.length; x++) {
			if (p[x].split("=")[0]=="adhesePreviewCreativeId") {
				c = unescape(p[x].split("=")[1]);
		    }
			if (p[x].split("=")[0]=="adhesePreviewSlotId") {
				s = p[x].split("=")[1];
		    }
			if (p[x].split("=")[0]=="adhesePreviewCreativeTemplate") {
				t = p[x].split("=")[1];
				tc.push(t);
			}
			if (p[x].split("=")[0]=="adhesePreviewTemplateFile") {
				tf = p[x].split("=")[1];
			}
			if (p[x].split("=")[0]=="adhesePreviewWidth") {
				w = p[x].split("=")[1];
			}
			if (p[x].split("=")[0]=="adhesePreviewHeight") {
				h = p[x].split("=")[1];
			}
			if (p[x].split("=")[0] == "adhesePreviewCreativeKey") {
				if(countAd > 1){
					if (s != "" && tc[0] != "") {
						for(i in tc){
							var t = tc[i];
							this.previewFormats[t]={slot:s,creative:c,templateFile:tf,width:w,height:h};
						}
					}
					tc=[];
				}
			}
		}
 		if(countAd == 1){
			for(var y = 0; y<tc.length; y++){
 				this.previewFormats[tc[y]] = {slot:s,creative:c, templateFile:tf,width:w,height:h};
 			}
 		}
		var c=[];
		for(k in this.previewFormats){
			c.push(k + "," + this.previewFormats[k].creative + "," + this.previewFormats[k].slot + "," + this.previewFormats[k].template + "," + this.previewFormats[k].width + "," + this.previewFormats[k].height);
		}
		this.helper.createCookie("adhese_preview",c.join('|'),0);
		this.previewActive = true;
	} else if (this.helper.readCookie("adhese_preview")) {
		var v = this.helper.readCookie("adhese_preview").split("|");
		for (var x=0; x<v.length; x++) {
			var c = v[x].split(",");
			this.previewFormats[c[0]] = {creative: c[1], slot: c[2], template: c[3], width: c[4], height: c[5]};
		}
		this.previewActive = true;
	}
};

/**
 * The showPreviewSign function displays a message to inform the user that the live preview is active.
 */
Adhese.prototype.showPreviewSign = function () {
	var that = this;
	var p = document.createElement('DIV');
	var msg = '<div id="adhPreviewMessage" style="cursor:pointer;font-family:Helvetica,Verdana; font-size:12px; text-align:center; background-color: #000000; color: #FFFFFF; position:fixed; top:10px;left:10px;padding:10px;z-index:9999;width: 100px;"><b>Adhese preview active.</br> Click to disable</div>';
	p.innerHTML = msg;
	// once and afterload
	document.body.appendChild(p);
	that.helper.addEvent("click", that.closePreviewSign.bind(that), p, p);
};

/**
 * The closePreviewSign function exits the live preview mode and reloads the page.
 */
Adhese.prototype.closePreviewSign = function () {
	this.helper.eraseCookie("adhese_preview");
	if(location.search.indexOf("adhesePreviewCreativeId") != -1){
		location.href = location.href.split("?")[0];
	}else{
		location.reload();
	}
};

/**
 * Function to check for the 'adheseInfo' parameter in the query string of the page location.
 * If present, we show a box with request information once the page is loaded.
 */
Adhese.prototype.checkAdheseInfo = function() {
	var that = this;
	if (window.location.search.indexOf("adheseInfo=true") == -1) {
		return false;
	} else {
		addEventListener("load", that.showInfoSign.bind(that));
	}
};

/**
 * The showInfoSign function displays a message which contains information about the request such as location, requested formats and targeting info.
 */
Adhese.prototype.showInfoSign = function() {
	var that = this;
	var p = document.createElement("DIV");
	var msg = '<div id="adhInfoMessage" style="cursor:pointer;font-family:Helvetica,Verdana; font-size:12px; text-align:center; background-color: lightgrey; color: black; position:fixed; top:10px;right:10px;padding:10px;z-index:9999;width:auto; max-width:300px; opacity:0.9; border:2px #9e9e9e solid">';
    msg += '<b>Adhese Request Info</b></br>- Click to disable -</br>';
    msg += '</br><b>Location code:</b></br>';
    msg += adhese.config.location + '</br>';
    msg += '</br><b>Format code(s):</b></br>';
    for(x in adhese.ads){
        msg +=adhese.ads[x][0]+'</br>';
    }
    msg += '</br><b>Targeting:</b></br>';
    for(x in adhese.request){
        if(x != 'ur' && x != 'rn' && x!= 're' && x!= 'pr' && x!='fp')msg += '<b>'+x+': </b>' + adhese.request[x] + '</br>';
    }
    msg += '</div>';
	p.innerHTML = msg;
	document.body.appendChild(p);
	that.helper.addEvent("click", that.closeInfoSign.bind(that), p, p);
};

/**
 * The closeInfoSign function hides the info box for the user.
 */
Adhese.prototype.closeInfoSign = function() {
	var infoMsg = document.getElementById('adhInfoMessage');
	infoMsg.style.display = 'none';

};

