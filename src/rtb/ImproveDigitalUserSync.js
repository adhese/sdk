/**
* Method to check and if needed sync the Adhese user with a known Improve Digital user. If a match exists, the next request performed by this client will contain a improvedigital_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: publisher_dsp_id: the id for the implementing Improve Digital account.
* @return {void}
*/
Adhese.prototype.improvedigitalUserSync = function(option) {
       var partner_id = 1;
       var domain = "user-sync.adhese.com";
       if (option && option.partner_id && option.partner_id!='') {
               partner_id = option.partner_id;
       }
       if (option && option.domain && option.domain!='') {
                domain = option.domain;
       }
       this.genericUserSync({
               url: "https://ad.360yield.com/server_match?partner_id=" + partner_id + "&r=https%3A%2F%2F" + domain + "%2Fhandlers%2Fimprovedigital%2Fuser_sync%3Fu%3D%7BPUB_USER_ID%7D",
               syncName: "improvedigital",
               iframe: true,
               onload: option.onload
       });
};

