Adhese.prototype.multiUserSync = function(option) {
    if (option && option.account) {
        this.genericUserSync({
            url: "https://user-sync.adhese.com/iframe/user_sync.html?account=" + option.account + "&tl=" + this.getBooleanConsent(),
            syncName: "multi",
            iframe: true,
            onload: option.onload 
        });
    }
};

