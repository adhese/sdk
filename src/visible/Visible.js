window.AdheseVisibleData = [];

Adhese.prototype.checkVisible = function() {
    var that = this;
    for (var i = 0; i < window.AdheseVisibleData.length; i++) {
        var ad = window.AdheseVisibleData[i];
        var el = document.getElementById(ad.uid);
        if (el) {
            var rect = el.getBoundingClientRect();
            ad.visible = rect.height > 0 && rect.width > 0 && rect.top >= 0 && rect.left >= 0 && rect.bottom - rect.height * .5 <= (window.innerHeight || document.documentElement.clientHeight) && rect.right - rect.width * .5 <= (window.innerWidth || document.documentElement.clientWidth);
            if (ad.visible && !ad.active && !ad.tracked) {
                that.track(ad.inviewTracker);
                ad.active = true;
                // start timer
                ad.out = setTimeout(function() {
                    that.track(ad.visibleTracker);
                    ad.tracked = true;
                    // remove from array, because it's tracked
                    window.AdheseVisibleData.splice(window.AdheseVisibleData.indexOf(ad), 1);
                }, 1000);
            } else if (!ad.visible && ad.active) {
                clearTimeout(ad.out);
                ad.active = false;
            }
        }else{
            this.helper.log("Can't find <div> width id: " + ad.uid);
            // because we do not want to see this error more than once
            ad.tracked = true;
        }
    }
};
