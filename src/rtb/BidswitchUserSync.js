Adhese.prototype.bidswitchUserSync = function(option) {
    if (option && option.bidswitch_account_name) {
        this.genericUserSync({
            url: "http://x.bidswitch.net/sync?ssp=" + option.bidswitch_account_name,
            syncName: "bidswitch",
            iframe: false
        });
    }
};

