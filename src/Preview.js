/**
 * The checkPreview function checks if preview parameters are present in the url.
 * If present, the parameters are used to generate a live preview for the ad.
 * if an adhese_preview cookie exists the saved ids will be used to generate a live preview.
 * This lets a user surf the site in 'preview mode'. The ad being previewed will show up on every page where there is a corresponding format tag present
 */

Adhese.prototype.checkPreview = function () {
	this.previewFormats = {};
	if(!this.config.previewHost){
		return false;
	}
	if (window.location.search.indexOf("adhesePreview")!=-1) {
		this.helper.log("checking for preview");
	var p = window.location.search.substring(1).split("&");
		var c = '';
		var s = '';
		var t = '';
		for (var x=0; x<p.length; x++) {
			if (p[x].split("=")[0]=="adhesePreviewCreativeId") {
				c = unescape(p[x].split("=")[1]);
		    }
			if (p[x].split("=")[0]=="adhesePreviewSlotId") {
				s = p[x].split("=")[1];
		    }
			if (p[x].split("=")[0]=="adhesePreviewCreativeTemplate") {
				t = p[x].split("=")[1];
				this.previewFormats[t] = {slot:s,creative:c}; // this will not work with two times the same format
			}
		}
		var c=[];
		for(k in this.previewFormats){c.push(k + "," + this.previewFormats[k].creative+ "," + this.previewFormats[k].slot);}
		this.helper.createCookie("adhese_preview",c.join('|'),0);
		this.previewActive = true;
	} else if (this.helper.readCookie("adhese_preview")) {
		var v = this.helper.readCookie("adhese_preview").split("|");
		for (var x=0; x<v.length; x++) {
			var c = v[x].split(",");
			this.previewFormats[c[0]] = {creative: c[1], slot: c[2]};
		}
		this.previewActive = true;
	}
};

/**
 * The showPreviewSign function displays a message to inform the user that the live preview is active.
 */
Adhese.prototype.showPreviewSign = function () {
	var that = this;
	console.log("showing preview sign");
	console.log(this.helper);
	var p = document.createElement('DIV');
	var msg = '<div id="adhPreviewMessage" style="cursor:pointer;font-family:Helvetica,Verdana; font-size:18px; text-align:center; background-color: #C8EDCE; color: #9E9E9E; position:fixed; top:0px; /* left: auto; */ padding:4px; border-style:dashed; border:2px; border-color:#000000;z-index:9999;width: 80%;margin-left: 10%;height: 23px;top: 2px;"><b>Adhese preview active. Click to disable</div>';
	p.innerHTML = msg;
	// once and afterload
	document.body.appendChild(p);
	that.helper.addEventListener("click", that.closePreviewSign.bind(that), p);
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
