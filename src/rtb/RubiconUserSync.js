/**
* Method to check and if needed sync the Adhese user with a known Rubicon user. If a match exists, the next request performed by this client will contain a rubicon_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: rp_account: the id for the implementing Rubicon account. This is the same id as passed by the 'rp_account' variable in the legacy Javascript implementation of Rubicon scripts.
* @return {void}
*/
Adhese.prototype.rubiconUserSync = function(option) {
	// if no account given, do nothing
	if (option && option.rp_account && option.rp_account!='') {
		// if no cookies has been set yet
		if(document.cookie.indexOf("rubicon_uid")==-1) {
			// do request to Rubicon, ignore response, next requests to .adhese.com will have rubicon_uid cookie
			new Image().src = "https://pixel-eu.rubiconproject.com/exchange/sync.php?p=" + option.rp_account;
		}
	}
};