/**
* Method to check and if needed sync the Adhese user with a known Appnexus user. If a match exists, the next request performed by this client will contain an appnexus_uid cookie that will be used for Bid Requests.
* @param  {number} option Object containing one attribute: rp_account: the id for the implementing Rubicon account. This is the same id as passed by the 'rp_account' variable in the legacy Javascript implementation of Rubicon scripts.
* @return {void}
*/
Adhese.prototype.appnexusUserSync = function() {
    this.genericUserSync({
        url: "https://ib.adnxs.com/getuid?https%3A%2F%2Fuser-sync.adhese.com%2Fhandlers%2Fappnexus%2Fuser_sync%3Fu%3D%24UID",
        syncName: "appnexus",
        iframe: true
    });
};

