/**
* Method to check and if needed sync the Adhese user with a known Rubicon user. If a match exists, the next request performed by this client will contain a rubicon_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: rp_account: the id for the implementing Rubicon account. This is the same id as passed by the 'rp_account' variable in the legacy Javascript implementation of Rubicon scripts.
* @return {void}
*/
Adhese.prototype.rubiconUserSync = function(option) {
	// if no account given, do nothing
	if (option && option.rp_account && option.rp_account!='') {
		// if no cookies has been set yet
		if(document.cookie.indexOf("rubicon_uid_last_sync")==-1) {
			// do request to Rubicon, ignore response, next requests to .adhese.com will have rubicon_uid cookie
			new Image().src = "https://pixel-eu.rubiconproject.com/exchange/sync.php?p=" + option.rp_account;
			var date = new Date();
			date.setDate(date.getDate()+1);
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			var diff = date.getTime() - new Date().getTime();
			this.helper.createCookie("rubicon_uid_last_sync", diff, (diff/24/60/60/1000));
		}
	}
};