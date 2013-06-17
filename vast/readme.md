#Adhese Vast for Javascript/HTML5 - Readme



##Introduction

The Adhese Vast JS library is meant to ease the integration of VAST (2.0 & 3.0) ads in video players.
It contains cross-domain safe methods for requesting ads from your adhese account as well as convenience methods for playing and tracking the ads.
It is however not a player on its own and it does not insert anything in the DOM.



##Getting started


1.	Load the javascript file.

		<script type="text/javascript" src="adhese-vast.js"></script>


2.	Create an AdheseVastWrapper object.
	
		var wrapper = new AdheseVastWrapper();


3. 	Register a listener for the ADS_LOADED event fired by AdheseVastWrapper.
	The first parameter is the event name, the second is the name of your callback function.
	This function will be called when the wrapper is ready handling your ad request.

		wrapper.addEventListener("ADS_LOADED", yourCallBackFunction);


4. 	Initiate a request for ads passing the host of your adhese account and the slot path and target parameters you wish to request.

		wrapper.requestAds("http://ads.demo.adhese.com", "/sl_test_-preroll/");


5.	Once the request is finished, AdheseVastWrapper will fire the ADS_LOADED event and yourCallBackFunction will be called.
	From then on you can access several properties of the wrapper object to get info on the ads.



##API

**AdheseVastWrapper**  
The main object through which you will request ads and access the response.

**AdheseVastWrapper.init**()  
Needs to be called whenever you want to start all over again. Resets listeners, trackers and scheduled ads.

**AdheseVastWrapper.requestAds**(adhese_host, adhese_location, array_of_adhese_format_codes)  
Gets ads from Adhese account at given host for location and given array of formats. Fires ADS_LOADED when finished.

**AdheseVastWrapper.getSchedule**()  
Returns object containing the requested format codes as properties. 
If there is no ad available for a requested format, no property in the schedule object will exist for that format code.

**AdheseVastWrapper.hasAd**(adhese_format_code)  
Returns true if an ad was sheduled for the format code.

**AdheseVastWrapper.getMediaFile**(adhese_format_code, media_type)  
Returns the URI for the ad's media actual media file. 
The media type parameter contains the actual mime type of the needed media file (eg: video/mp4, video/ogg).

**AdheseVastWrapper.getDuration**(adhese_format_code)  
Returns a string of format hh:mm:ss containing the duration of the ad.

**AdheseVastWrapper.getDurationInSeconds**(adhese_format_code)  
Returns the duration of the ads in seconds.

**AdheseVastWrapper.timeupdate**(adhese_format_code, currentTime_media_property)  
Callback function for player media event "timeupdate". 
The second parameter should contain the "currentTime" property of the HTML5 video element playing the ad.
This function will handle all tracking of impressions, progress, ...

**AdheseVastWrapper.ended**(adhese_format_code, currentTime_media_property)  
Callback function for player media event "ended". 
The second parameter should contain the "currentTime" property of the HTML5 video element playing the ad.
This function will track completion of the ad.

**AdheseVastWrapper.clicked**(adhese_format_code, currentTime_media_property)  
Callback function for "click" on player (or any container defined as clickable by you). 
The second parameter should contain the "currentTime" property of the HTML5 video element playing the ad.
This function will track the click and open a new window containing the click-through url of the ad.




##References

###More on HTML5 Media Events

- API: http://www.w3.org/TR/html5/embedded-content-0.html#htmlmediaelement
- Full demo: http://www.w3.org/2010/05/video/mediaevents.html
- Summary on each event: http://www.htmlgoodies.com/html5/tutorials/HTML5-Development-Class-Media-Events-3883356.htm#fbid=jM9z0Uoluxk


