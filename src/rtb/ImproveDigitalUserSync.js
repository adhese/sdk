/**
* Method to check and if needed sync the Adhese user with a known Improve Digital user. If a match exists, the next request performed by this client will contain a improvedigital_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: publisher_dsp_id: the id for the implementing Improve Digital account.
* @return {void}
*/
Adhese.prototype.improvedigitalUserSync = function(option) {
	console.log("improvedigitalUserSync: " + option);
	// if no account given, do nothing
	if (option && option.publisher_dsp_id && option.publisher_dsp_id!='') {
		if(document.cookie.indexOf("improvedigital_uid_last_sync")==-1 || !option.syncRefreshPeriod) {
			this.helper.addEvent("load", this.improvedigitalMultiSync, option.publisher_dsp_id);
			if(option.syncRefreshPeriod) {
				var date = new Date();
				date.setDate(date.getDate()+1);
				date.setHours(0);
				date.setMinutes(0);
				date.setSeconds(0);
				var diff = date.getTime() - new Date().getTime();
				this.helper.createCookie("improvedigital_uid_last_sync", diff, (diff/option.syncRefreshPeriod));
				// also create domain cookie, so do a request to an .adhese.com endpoint with the current domain as qs param
			}
			if (this.config && this.config.hostname) new Image().src = "https://user-sync.adhese.com/handlers/improvedigital/user_sync_discovery?domain=" + this.config.hostname;
			// this endpoint wil create a cookie on .adhese.com containing the domain as passed
		}
	}
};

/**
 * Multi Sync implementation of Improve Digital User Sync
 * 
 * We request a pixel on .adhese.com that sets a cookie containing the domain that is being used.
 * We send a user sync request to Improve Digital that eventually is redirected to our .adhese.com user sync.
 * That checks if there is a domain cookie, if so, redirect to the user sync on that domain, with improvedigital_uid and domain as query string parameters
 * This final endpoint will set the improvedigital_uid as a cookie on the passed domain
 * 
 * @param  {string} account identifier of the partner as set up by Improve Digital
 * @return {void}            
 */
Adhese.prototype.improvedigitalMultiSync = function(account) {
	var iframe = document.createElement("IFRAME");
	iframe.setAttribute("id", "multisync");
	iframe.setAttribute("height", "0");
	iframe.setAttribute("width", "0");
	iframe.setAttribute("marginwidth", "0");
	iframe.setAttribute("marginheight", "0");
	iframe.setAttribute("frameborder", "0");
	iframe.setAttribute("scrolling", "no");
	iframe.setAttribute("style", "border: 0px; display: none;");
	iframe.setAttribute("src", "https://ad.360yield.com/match?publisher_dsp_id=" + account + "&external_user_id=0&r=https%3A%2F%2Fuser-sync.adhese.com%2Fhandlers%2Fimprovedigital%2Fuser_sync%3Fu%3D%7BPUB_USER_ID%7D");	
	document.body.appendChild(iframe);
};


