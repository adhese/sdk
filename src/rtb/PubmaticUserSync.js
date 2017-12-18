/**
* Method to check and if needed sync the Adhese user with a known Pubmatic user. If a match exists, the next request performed by this client will contain a pubmatic_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: pubmatic_publisher_id: the id for the implementing Pubmatic publisher. 
* @return {void}
*/
Adhese.prototype.pubmaticUserSync = function(option) {
        if (option && option.pubmatic_publisher_id) {
                this.genericUserSync({
                        url: "http://ads.pubmatic.com/AdServer/js/user_sync.html?p=" + option.pubmatic_publisher_id + "&predirect=http%3a%2f%2fuser-sync.adhese.com%2fhandlers%2fpubmatic%2fuser_sync%3fu%3d",
                        syncName: "pubmatic",
                        iframe: false
                });
        }
};

