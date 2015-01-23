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

		wrapper.requestAds("http://ads.demo.adhese.com", "_test_", ["preroll","postroll"]);


5.	Once the request is finished, AdheseVastWrapper will fire the ADS_LOADED event and yourCallBackFunction will be called.
	From then on you can access several properties of the wrapper object to get info on the ads.


For a full example, check the example.html page.

##API Documentation

Please find the API docs in the docs/ directory of each module of the sdk.


##References

###More on HTML5 Media Events

- API: http://www.w3.org/TR/html5/embedded-content-0.html#htmlmediaelement
- Full demo: http://www.w3.org/2010/05/video/mediaevents.html
- Summary on each event: http://www.htmlgoodies.com/html5/tutorials/HTML5-Development-Class-Media-Events-3883356.htm#fbid=jM9z0Uoluxk


