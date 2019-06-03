Adhese.prototype.smartadserverUserSync = function() {
    this.genericUserSync({
        url: "https://ssbsync.smartadserver.com/api/sync?callerId=1",
        syncName: "smartadserver",
        iframe: true,
        onload: option.onload 
    });
};

