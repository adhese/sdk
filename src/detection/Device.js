Adhese.prototype.Detection = function(){
	return this;
}
/**
* Detects the type of device the user is using based on the user agent.
* @param  {string} optionally, the user agent can be passed as argument
* @return {string}	Returns the device type detecte: desktop, tablet or phone
*/
Adhese.prototype.Detection.prototype.device = function(ua) {
	ua = ua ? ua : window.navigator.userAgent;
  if (ua.match(/webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile Safari|SymbianOS/i) && !ua.match(/Android/i)){
      this.deviceType = "phone";
	}else if(ua.match(/Mobile/i) && ua.match(/Android/i)) {
		this.deviceType = "phone";
	}else if(ua.match(/iPad|Android|Tablet|Silk/i)){
			this.deviceType = "tablet";
	}else{
		this.deviceType = "desktop";
	}
	return this.deviceType;
};
