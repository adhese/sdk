(function(){
    
    var AdheseAjax = {
        request: function(ops) {
            if(typeof ops == 'string') ops = { url: ops };
            ops.url = ops.url || '';
            ops.method = ops.method || 'get'
            ops.data = ops.data || {};
            if(typeof ops.encodeData == "undefined"){
                ops.encodeData = true;
            }
            var getParams = function(data, url) {
                var arr = [], str;
                for(var name in data) {
                    arr.push(name + '=' + encodeURIComponent(data[name]));
                }
                str = arr.join('&');
                if(str != '') {
                    return url ? (url.indexOf('?') < 0 ? '?' + str : '&' + str) : str;
                }
                return '';
            }
            var api = {
                host: {},
                process: function(ops) {
                    var self = this;
                    this.xhr = null;

                    if (document.all && !window.atob) { // IE9 and older
                        try {
                            this.xhr = new ActiveXObject("Msxml2.XMLHTTP");
                        }
                        catch(e) {
                            try {
                                this.xhr = new ActiveXObject("Microsoft.XMLHTTP");
                            }
                            catch (e) {this.xhr = false; }
                        }
                    } else {
                        try {
                            this.xhr = new XMLHttpRequest();
                        }
                        catch (e) {
                            this.xhr = false;
                        }
                    }

                    if(this.xhr) {
                        if ("withCredentials" in this.xhr) {
                            this.xhr.withCredentials = true;
                        }
                        this.xhr.onreadystatechange = function() {
                            if(self.xhr.readyState == 4 && self.xhr.status == 200) {
                                var result = self.xhr.responseText;
                                if(ops.json === true && typeof JSON != 'undefined') {
                                    if (result){
                                        try{
                                            result = JSON.parse(result);
                                            self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
                                        }catch(e){
                                            console.error('Ad response parsing error: \n', e);
                                            self.errorCallback && self.errorCallback.apply(self.host, ["Adhese Ajax: " + e]);
                                        }
                                    }else {
                                        self.errorCallback && self.errorCallback.apply(self.host, ["Adhese Ajax: Response is empty string"]);
                                    }
                                }
                            } else if(self.xhr.readyState == 4) {
                                self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
                            }
                            self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
                        }
                    }
                    if(ops.method == 'get') {
                        this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
                    } else {
                        this.xhr.open(ops.method, ops.url, true);
                        this.setHeaders({
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-type': 'application/x-www-form-urlencoded'
                        });
                    }
                    if(ops.headers && typeof ops.headers == 'object') {
                        this.setHeaders(ops.headers);
                    }
                    setTimeout(function() {
                        if(ops.method == 'get'){
                            self.xhr.send()
                        }else{
                            var data;
                            if (ops.encodeData) {
                            data = getParams(ops.data);
                        }else {
                            data = ops.data;
                        }
                        self.xhr.send(data);
                    }
                    }, 20);
                    return this;
                },
                done: function(callback) {
                    this.doneCallback = callback;
                    return this;
                },
                fail: function(callback) {
                    this.failCallback = callback;
                    return this;
                },
                always: function(callback) {
                    this.alwaysCallback = callback;
                    return this;
                },
                error: function(callback) {
                    this.errorCallback = callback;
                    return this;
                },
                setHeaders: function(headers) {
                    for(var name in headers) {
                        this.xhr && this.xhr.setRequestHeader(name, headers[name]);
                    }
                }
            }
            return api.process(ops);
        }
    }

    var adheseDiv = document.currentScript.parentNode;
    var clickTag = adheseDiv.getAttribute("data-adhese-click");
    if (clickTag==null) clickTag = "";
    var adUri = "https://ads-" + adheseDiv.getAttribute("data-adhese-account") + ".adhese.com/json/" + adheseDiv.getAttribute("data-adhese-slot") + "/?t=" + new Date().getTime();
    var response = AdheseAjax.request({
        url: adUri,
        method: 'get',
        json: true
    })
    .done(function(result) {
        for (var i = result.length - 1; i >= 0; i--) {
            if (result[i].ext == 'zip') {
                var el = document.createElement('div');
                el.innerHTML = result[i].tag;
                var iframe = el.getElementsByTagName('iframe')[0];
                var src = iframe.getAttribute('src');
                src += "&click=" + clickTag;
                iframe.setAttribute('src',src);
                adheseDiv.appendChild(iframe);
            } else if (result[i].ext == 'gif' || result[i].ext == 'jpg' || result[i].ext == 'png'){
                var el = document.createElement('div');
                el.innerHTML = result[i].tag;
                var anchor = el.getElementsByTagName('a')[0];
                var href = anchor.getAttribute('href');
                href = decodeURIComponent(clickTag) + href;
                anchor.setAttribute('href',href);
                adheseDiv.appendChild(anchor);                
            } else if (result[i].ext == 'js') {
                var iframe = document.createElement('iframe');
                iframe.width = result[i].width;
                iframe.height = result[i].height;
                iframe.scrolling="no";
                iframe.frameBorder = 0;
                iframe.frameSpacing = 0;
                iframe.style = "border: none;outline: none;overflow: hidden;top:0px; left:0px; margin: 0; padding: 0;";
                adheseDiv.appendChild(iframe);
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(result[i].body);
                iframe.contentWindow.document.close();                
            }
        };
    });

}).call(this);
