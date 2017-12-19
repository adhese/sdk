/**
* Method to check and if needed sync the Adhese user with a known Improve Digital user. If a match exists, the next request performed by this client will contain a improvedigital_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: publisher_dsp_id: the id for the implementing Improve Digital account.
* @return {void}
*/
Adhese.prototype.improvedigitalUserSync = function(option) {
       if (option && option.publisher_dsp_id && option.publisher_dsp_id!='') {
                this.genericUserSync({
                        url: "https://ad.360yield.com/match?publisher_dsp_id=" + option.publisher_dsp_id + "&external_user_id=0&r=https%3A%2F%2Fuser-sync.adhese.com%2Fhandlers%2Fimprovedigital%2Fuser_sync%3Fu%3D%7BPUB_USER_ID%7D",
                        syncName: "improvedigital",
                        iframe: true
                });
        }
};

