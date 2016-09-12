/**
sync users with Criteo
After calling adhese.criteoUserSync with the correct id, the crtg_content can be empty or can contain values like "criteo300=1" or "“criteo300=1;criteo728=1;criteo160=1;"
based on these values a target can be set by using adhese.registerRequestParameter("xx", value);
*/

Adhese.prototype.criteoUserSync = function(options){
    if(options && options.nid){
        var crtg_nid=options.nid;
        var crtg_cookiename="cto_rtt";
        function crtg_getCookie(c_name){
            var i,x,y,ARRcookies=document.cookie.split(";");
            for(i=0;i<ARRcookies.length;i++){
                x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
                y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
                x=x.replace(/^\s+|\s+$/g,"");
                if(x==c_name){
                    return unescape(y);
                }
            }
            return'';
        }
        crtg_content=crtg_getCookie(crtg_cookiename);
        var crtg_rnd=Math.floor(Math.random()*99999999999);
        var crtg_url='http://rtax.criteo.com/delivery/rta/rta.js?netId='+escape(crtg_nid);
        crtg_url+='&cookieName='+escape(crtg_cookiename);
        crtg_url+='&rnd='+crtg_rnd;crtg_url+='&varName=crtg_content';
        var crtg_script=document.createElement('script');
        crtg_script.type='text/javascript';
        crtg_script.src=crtg_url;
        crtg_script.async=true;
        if(document.getElementsByTagName("head").length>0){
            document.getElementsByTagName("head")[0].appendChild(crtg_script);
        }else if(document.getElementsByTagName("body").length>0){
            document.getElementsByTagName("body")[0].appendChild(crtg_script);
        }
        return crtg_content;
    }
}
