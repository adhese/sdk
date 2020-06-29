/**
* Method to check and if needed sync the Adhese user with a known Spotx user. If a match exists, the next request performed by this client will contain a pubmatic_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: spotx_advertiser_id: the id for the implementing Spotx publisher. 
* @return {void}
*/
Adhese.prototype.spotxUserSync = function(option) {
        var domain = "user-sync.adhese.com";
        if (option && option.domain && option.domain!='') {
                domain = option.domain;
        }
        if (option && option.spotx_advertiser_id) {
                this.genericUserSync({
                        url: "https://sync.search.spotxchange.com/partner?adv_id=" + option.spotx_advertiser_id + "&redir=https%3A%2F%2F" + domain + "%2Fhandlers%2Fspotx%2Fuser_sync%3Ftl%3D" + this.getBooleanConsent() + "%26u%3D%24SPOTX_USER_ID",
                        syncName: "spotx",
                        iframe: true,
                        onload: option.onload 
                });
        }
};

