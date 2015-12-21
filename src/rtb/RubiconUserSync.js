/**
* Method to check and if needed sync the Adhese user with a known Rubicon user. If a match exists, the next request performed by this client will contain a rubicon_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: rp_account: the id for the implementing Rubicon account. This is the same id as passed by the 'rp_account' variable in the legacy Javascript implementation of Rubicon scripts.
* @return {void}
*/
Adhese.prototype.rubiconUserSync = function(option) {
	// if no account given, do nothing
	if (option && option.rp_account && option.rp_account!='') {
		if(document.cookie.indexOf("rubicon_uid_last_sync")==-1) {
			this.helper.addEvent("load", this.rubiconMultiSync, option.rp_account);
			var date = new Date();
			date.setDate(date.getDate()+1);
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			var diff = date.getTime() - new Date().getTime();
			this.helper.createCookie("rubicon_uid_last_sync", diff, (diff/24/60/60/1000));
			// also create domain cookie, so do a request to an .adhese.com endpoint with the current domain as qs param
			// this endpoint wil create a cookie on .adhese.com containing the domain as passed
		}
	}
};

/**
 * Multi Sync implementation of Rubicon User Sync
 * 
 * We request a pixel on .adhese.com that sets a cookie containing the domain that is being used.
 * We send a user sync request to Rubicon that eventually is redirected to our .adhese.com user sync.
 * That checks if there is a domain cookie, if so, redirect to the user sync on that domain, with rubicon_uid and domain as query string parameters
 * This final endpoint will set the rubicon_uid as a cookie on the passed domain
 * 
 * @param  {string} rp_account identifier of the partner as set up by Rubicon
 * @return {void}            
 */
Adhese.prototype.rubiconMultiSync = function(rp_account) {
	var script = document.createElement("SCRIPT");
	script.type = "text\/javascript";
	script.setAttribute("data-partner",rp_account);
	script.setAttribute("data-region","eu");
	script.setAttribute("data-country","be");
	script.setAttribute("data-endpoint","eu");
	script.src = "http://assets.rubiconproject.com/utils/xapi/multi-sync.js";	
	document.body.appendChild(script);
}


