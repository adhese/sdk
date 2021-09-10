# Adhese SDK
This repository contains all code for implementing Adhese ad serving in web pages, applications, video/radio players, ...

### Introduction
The Adhese JavaScript SDK is a minified JavaScript library that can be included in a JavaScript enabled client.
It allows a uniform way to identify request parameters and include advertising from your Adhese account.

### Build from source
The Makefile uses UglifyJS2 to compress the JavaScript files. For more information: https://github.com/mishoo/UglifyJS2

Check out this repository and type 'make' or 'make debug' in the root of the SDK directory.

The default make target will include all files. The 'novast' make target includes all but VAST support, as video advertising is not always needed in a display advertising context.

To build the SDK without Ajax and VAST support, use 'make novastnoajax'. This results in a slightly smaller file (1.4k less). 
To build without VAST support, just use 'make novast'. A version that only contains VAST support can be built by using 'make vastonly'.

### Use compressed distribution
Use adhese.min.js directly in your web page. This distribution includes the Ajax library.

### Getting started
1. Load the JavaScript in the HEAD of the page

		<script type="text/javascript" src="adhese.min.js"></script>

2. Provide a local function that returns the content identification

		<script type="text/javascript">
			function getLocation() {
				return "_demo_test_";
			}
		</script>

3. Initialize the adhese instance

		var adhese = new Adhese();
		adhese.init({debug:true, account:"demo", location: getLocation });
		// value of the account attribute can be found in your Adhese subscription information or through our support portal.

### IAB SafeFrame
Adhese recommends the use of IAB SafeFrame's standard where possible. The SDK has built-in SafeFrame support, turned on by default.
To turn off SafeFrame support, initialise your Adhese instance with option "safeframe" set to false.

		var adhese = new Adhese();
		adhese.init({debug:true, account:"demo", location: getLocation, safeframe: false });

More about SafeFrame at http://www.iab.net/safeframe.

### Legacy requests (document.write)
The legacy requests are implemented as a script fragment inside the container where they will be visualized. The client will execute the request and insert the response in the container with a document.write statement. This type of implementation is not recommended if you want to take advantage of 'viewable tracking and forecasting'. It also has performance drawbacks, as the client's document build up will block while requesting and advertisement.

For each ad you want to include on a page, you should create a DIV with a unique id that is the same as the requested format. Then make a call to a the adhese.tag function

		<div id="leaderboard">
		<script type="text/javascript" charset="utf-8">
			var ad = adhese.tag("leaderboard", {write:true});
		</script>
		</div>

### Asynchronous requests
Asynchronous requests allow you to perform a request first and visualize the response later. The implementing client is responsible for correct ad reports. A tracker uri that is passed in the response should be requested when visualizing the ad.
The SDK can be built with an extra Ajax request handler. If you plan to implement in a client that is already capable of performing asynchronous requests, you can omit this part of the SDK from the dist file by running 'make noajax'.

#### Request and track

1. Create the ad

		var ad = adhese.tag("leaderboard");

2. Retrieve the ad URI to perform the asynchronous request

		var adUri = adhese.getRequestUri(ad, {type:'json'});
		var response = AdheseAjax.request({
    		url: adUri,
    		method: 'get',
    		json: true
		})
		.done(function(result) {
    		adhese.safeframe.addPositions(result);
			for (var i = result.length - 1; i >= 0; i--) {
				adhese.safeframe.render(result[i].adType);
    		};
		});

3. Use the body or tag property of the response and append it to a container of your choice

		adhese.safeframe.addPositions(result);
		for (var i = result.length - 1; i >= 0; i--) {
			adhese.safeframe.render(result[i].adType);
    	};

4. Perform a request to the response.tracker URI. Make sure it is not cached. The response of this tracker URI can be ignored.

		AdheseAjax.request({
    		url: result[0].tracker + '?t=' + new Date().getTime(),
    		method: 'get'
		});

#### POST Request

Below follow an example of a POST request. You are free to use any POST mechanism you like, as long as the host and payload are valid.

1. Create the ad

		var ad = adhese.tag("leaderboard", {"parameters":{"position":"top"}});

2. Retrieve the ad URI to perform the asynchronous request

		const options = {
            method: "POST",
            credentials: "same-origin",
            headers: new Headers({'content-type': 'application/json'}),
            body: JSON.stringify( adhese.getRequestPayload(slots) )  
        };
        fetch( adhese.config.host + "json", options )
            .then( response => response.json() )
            .then( response => {
                // render the ads in response
				// execute a tracker for counting an impression
        });

3. Use the body or tag property of the response in the renderAd function and append it to a container of your choice

		adhese.safeframe.addPositions(result);
		for (var i = result.length - 1; i >= 0; i--) {
			adhese.safeframe.render(result[i].adType);
    	};

4. Perform a request to the response.tracker URI. Make sure it is not cached. The response of this tracker URI can be ignored.

		AdheseAjax.request({
    		url: result[0].tracker + '?t=' + new Date().getTime(),
    		method: 'get'
		});

#### Response object structure
The request returns a JSON object with the fields described below. If no ad should be shown, an empty JSON object is returned (just two curly braces).

		{
			"adDuration": "0", // duration in seconds of primary creative (if applicable)
			"adDuration2nd": "0", // duration in second of 2nd file
			"adDuration3rd": "0", // duration in seconds of 3rd file
			"adDuration4th": "0", // the optional duration of the 4th file
			"adDuration5th": "0", // the optional duration of the 5th file
		    "adDuration6th": "0", // the optional duration of the 6th file
		    "adFormat": "wideskyscraper", // the assigned format name (determined by your Adhese account)
			"adspaceId": "61721", // the Adhese booking ID
			"adspaceKey": "0", // an optional creative Foreign Key
			"adspaceEnd": "1483225199000", // the end date of this booking as UNIX timestamp
		    "adspaceStart": "1433714400000", // the start date of this booking as UNIX timestamp
		    "adType": "SKY", // format name as requested (determined by your Adhese account)
			"advertiserId": "2326" // Adhese ID of the advertiser
			"altText": "", // optional text to be shown as ALT attribute of the container
			"body": "<ADHESE_BODY>", // the third party code to be inserted in a container (if applicable)
			"clickTag": "http://clicks-ipm.adhese.com/raylene//sl1644/brChrome/brChrome43/brOSX/dtdesktop/coBE/rgBE11/tm7/tn6/wecalm/isTelenet_N.V./A2195.144.73.34.1428505186583038/O_/A_/C_/ad42159/UR", // the click tag url used for counting clicks, which should be followed by the actual target URL
			"comment": "", // optional free text comment
			"creativeName": "Example Billboard News", // name of this particular creative as filled out in Adhese UI/API
		    "deliveryGroupId": "o560c0", // id of booking/creative group for all-together or one-at-a-time bookings
		    "deliveryMultiples": "free", // type of delivery
		    "dm": "dmDMGo560c0;ADV98", // delivery limitation id
		    "ext": "swf", // the file type extension
			"extraField1": "", // optional field used by the uploader
			"extraField2": "", // second optional field used by uploader
			"height": "600", // height in pixels of primary creative
			"heightLarge": "0", // height in pixels of 2nd file
			"height3rd": "0", // height in pixels of the 3rd file
		    "height4th": "0", // height in pixels of the 4th file
		    "height5th": "0", // height in pixels of the 5th file
		    "height6th": "0", // height in pixels of the 6th file
		    "id": "295057", // the Adhese ID determining the link between an uploaded creative and a booking
			"libId": "96393", // Adhese ID of the uploaded creative
			"orderId": "16643", // the Adhese campaign ID
			"orderName": "Example - BillBoard Campaign", // name of the Adhese campaign
		    "orderProperty": "eadc185cbe8bcd05a5deaf7b99064d56-5d032fa3e52a1abe1392a6b4adbdd519", // optional comma seperated list of properties containing codes defined by your Adhese account
			"poolPath": "<ADHESE_POOL_PATH>", // an optional path to a CDN where files for this creative can be retreived
			"priority": "1", // priority of this campaign
			"share": "0", // an optional number indicating the weight for this creative
			"slotName": "_test-site_homepage_-SKY, // the value of the prefix sl as requested
			"swfSrc": "http://1.adhesecdn.be/pool/lib/96393.swf", // the URI of the primary file for this creative
			"swfSrc2nd": "", // URI of 2nd file
			"swfSrc3rd": "", // URI of 3rd file
			"swfSrc4th": "", // URI of 4th file
			"swfSrc5th": "", // URI of 5th file
		    "swfSrc6th": "", // URI of 6th file
		    "tag": "<object id='-1756524077' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0' WIDTH=160 HEIGHT=600><param NAME=movie VALUE='http://1.adhesecdn.be/pool/lib/96393.swf?clickTAG=http://host4.adhese.be/295057/http%3A%2F%2Ftrack.adform.net%2FC%2F%3Fbn%3D3515419'/><!--[if !IE]>--><object type='application/x-shockwave-flash' data='http://1.adhesecdn.be/pool/lib/96393.swf?clickTAG=http://host4.adhese.be/295057/http%3A%2F%2Ftrack.adform.net%2FC%2F%3Fbn%3D3515419' width='160' height='600'><!--<![endif]--><param NAME='quality' VALUE='high'/><param NAME='allowScriptAccess' VALUE='always'/><param NAME='wmode' VALUE='transparent'/><a target='_blank' href='http://host4.adhese.be/295057/http://track.adform.net/C/?bn=3515419'><img src='http://1.adhesecdn.be/pool/lib/96394.jpg'></a><!--[if !IE]>--></object><!--<![endif]--></object>", // the full html code for inserting in the container
			"tagUrl": "<ADHESE_TAG_URL>", // optional URI of the tag content
			"timeStamp": "1396357433000", // the timestamp of the latest change to this creative (can be used for caching)
			"tracker": "http://ads.adhese.be/track/295057//sl242///////inadttr12842;adttrbiz;adttrfood;adttrhealth;adttrimmo;adttrlifestyle;adttrmultimedia;adttrsport;adttrtrav;adttrvoetbal;adttrwielrennen/brTelenet N.V./coBE/rgBE11///isTelenet N.V.//////////A2141.135.96.213.1395820307192918/O_/A_/C_", // tracker URI to be requested for counting an impression
			"trackingUrl": "http://track.adform.net/adfserve/?bn=3515419;1x1inv=1;srctype=3;ord=", // 3rd party tracking URI to be requested when visualising
			"url": "http://host4.adhese.be/295057/http://track.adform.net/C/?bn=3515419", // click-through URI
			"width": "160", // width in pixels of the 1st file
			"widthLarge": "0", // width in pixels of 2nd file
			"width3rd": "0", // width in pixels of 3rd file
		    "width4th": "0", // width in pixels of 4th file
		    "width5th": "0", // width in pixels of 5th file
		    "width6th": "0"  // width in pixels of 6th file,
		    "additionalCreatives": [
		    	{
		    		"adType": "SKY",
        			"adFormat": "wideskyscraper",
        			"width": "160",
        			"height": "600",
        			...
           		},
           		{
		    		"adType": "SKY",
        			"adFormat": "phone_skyscraper",
        			"width": "60",
        			"height": "200",
        			...
           		}
		    ]
		}

### Registering target parameters
Through the adhese.registerRequestParameter(key, value) you can add one or more target parameters to the requests.
Simply register each value once, and all consequent getRequest function calls will include the parameters.

The available target parameters and their prefixes are determined by your Adhese account configuration. 
Please contact our support departement for more details.

		// will add an age target with prefix 'ag' and value '40' to each request
		adhese.registerRequestParameter('ag', 40);

### Registering slot target parameters
When creating a new Ad through the adhese.tag() function, yuo can pass a "parameters" object in the options.
These parameters are bound to the ad placement you created and will not be considered for other ads on the same page.
Each attribute key of the object should be a valid prefix, the values are always an array of strings or numbers (int)

This feature is only available in POST requests.

The available target parameters and their prefixes are determined by your Adhese account configuration. 
Please contact our support departement for more details.

		adhese.tag('leaderboard', {'parameters':{'ps':['top']}});

### Reserved targeting parameters for mobile apps
Three specific prefixes have been reserved for passing mobile device and location info.

	xb - bundle id - for Apple IOS devices pass iTunes ID. For Android devices pass package name (e.g. /xbcom.foo.mygame/).
	xc - coordinates - latitude;longitude - two floats separated by semicolon [-90..90];[-180..180] (e.g. /xc90;90/) 
	xs - SHA1-encoded device id /xs24135b7dd7ff54aeb62d3c98e1878a2342b0c09b/

### Reserved targeting parameters for RTB
Using the Adhese Gateway, publishers can send in information on the context and user to be shared with your RTB partner. Two special prefixes have been reserved to pass this data. They behave different than the other parameters as they contain key/value pairs to be passed to the RTB platform. The key/value pairs are separated by semicolons.(eg. /xi{key};{value} ).

	xu - contains user related parameters, expects pairs of keys and values to be passed (eg. .../xuage;35;gender;female/...)
	xi - contains onventory (context) related parameters (eg. .../xitopic;politics;language;en/...)


### Synching user id with RTB networks
Through a generic synching method, Adhese allows cookie synching with an external network. The current implementation supports the User Sync services of the following platforms: Rubicon Project, PubMatic, Improve Digital, SpotX and Criteo. Please contact our support departement for more details.

### Using the additional creatives array
One of the attributes of an ad response is an array of Ad objects called "additionalCreatives". These additional creatives can be uploaded through the Adhese UI, and contain the same adType value, as they are a response to the same ad request. But each of them has a different adFormat value. The string contained in adFormat is configured in your Adhese account.
The main creative is also repeated in the additionalCreatives array, to allow a simple loop of the array, even if only one creative is present.
Using the additional creatives you can easily support optimised creatives for responsive websites and apps. The number of additional creatives can be different, depending on the uploaded variations for each campaign, but through the use of the adFormat values, an app can guarantee the best visual for each platform.

# Adhese VAST SDK
In the vast directory you can find the sdk for implementing VAST based ads in HTML/JavaScript players.
