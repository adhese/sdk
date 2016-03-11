if(!window.AdheseVisibleData){
    window.AdheseVisibleData = [];
}

Adhese.prototype.checkVisible = function() {
    var that = this;
    var ads = new Array();
    var visibleIndex = 0;
    for (var i = 0; i < window.AdheseVisibleData.length; i++) {
        visibleIndex = i;
        ads[i] = window.AdheseVisibleData[i];
        var el = document.getElementById(ads[i].uid);
        if (el) {
            var rect = el.getBoundingClientRect();
            ads[i].visible = rect.height > 0 && rect.width > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom - rect.height * .5 <= (window.innerHeight || document.documentElement.clientHeight) && rect.right - rect.width * .5 <= (window.innerWidth || document.documentElement.clientWidth);
            if (ads[i].visible && !ads[i].active && !ads[i].tracked) {
                if(that.track(ads[i].inviewTracker){ // check if there is an inviewTracker
                    that.track(ads[i].inviewTracker);
                }
                ads[i].active = true;
                ads[i].out = setTimeout(function(activeAd) {
                        that.track(activeAd.visibleTracker);
                        activeAd.tracked = true;
                        window.AdheseVisibleData.splice(window.AdheseVisibleData.indexOf(activeAd), 1);
                    },
                    1000, // 1 second
                    ads[i] //activeAd param
                );
            } else if (!ads[i].visible && ads[i].active) {
                clearTimeout(ads[i].out);
                ads[i].active = false;
            }
        } else {
            this.helper.log("Can't find <div> width id: " + ads[i].uid);
            ads[i].tracked = true;
        }
    }
};
