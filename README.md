#Adhese SDK

This repository contains all code for implementing Adhese ad serving in web pages, applications, video/radio players, ...

###Introduction
The Adhese javascript SDK is a minified javascript library that can be included in a javascript enabled client.
It allows a uniform way to identify request parameters and include advertising from your Adhese account.

###Build from source
The Makefile uses UglifyJS2 to compress the javascript files. For more information: https://github.com/mishoo/UglifyJS2

Checkout this repository and type 'make' in the root of the SDK directory. 

To build the SDK without ajax support, use 'make noajax'. This results in a slightly smaller file (1.4k less).

###Use compressed distribution
Use the adhese.min.js directly in your web page. This distribution includes the ajax library.

###Getting started
1. Load the javascript in the HEAD of the page

		<script type="text/javascript" src="adhese.min.js"></script>

2. Provide a local function that returns the content identification
		
		<script type="text/javascript">
			function getLocation() {
				return "_demo_test_";
			}
		</script>

3. Initialize the adhese instance

		var adhese = new Adhese(); 
		adhese.init({debug:true, host:"http://ads.demo.adhese.com/", location: getLocation });


###Legacy requests (document.write)
The legacy requests are implemented as a script fragment inside the container where they will be visualized. The client will execute the request and insert the response in the container with a document.write statement. This type of implementation is not recommended if you want to take advantage of 'viewable tracking and forecasting'. It also has performance drawbacks, as the client's document build up will block while requesting and advertisement.

For each ad you want to include on a page, you should create a DIV with a unique id that is the same as the requested format. Then make a call to a the adhese.tag function

		<div id="leaderboard">
		<script type="text/javascript" charset="utf-8">
			var ad = adhese.tag("leaderboard", {write:true});
		</script>
		</div>	

###Asynchronous requests

Asynchronous requests allow you to perform a request first and visualize the response later. The implementing client is responsible for correct ad reports. A tracker uri that is passed in the response should be requested when visualizing the ad.
The SDK can be built with an extra Ajax request handler. If you plan to implement in a client that is already capable of performing async requests, you can omit this part of the SDK from the dist file by running 'make noajax'.

####Request and track

1. Create the ad

		var ad = adhese.tag("leaderboard");

2. Retrieve the ad uri to perform the asynch request
		
		var adUri = adhese.getRequest(ad, {type:'json'});
		var response = AdheseAjax.request({
    		url: adUri,
    		method: 'get',
    		json: true
		})
		.done(function(result) {
    		if (response.ext == 'js') {
				myElement.innerHTML = response.body; // for 3rd party creatives, these often contain document.write instructions, so they should be passed through a library like postscribe [https://github.com/krux/postscribe]
			} else {
				myElement.innerHTML = response.tag; // for hosted creatives
			}
		});

3. Use the body or tag property of the response and append it to a container of your choice

		if (response.ext == 'js') {
			myElement.innerHTML = response.body; // for 3rd party creatives, these often contain document.write instructions, so they should be passed through a library like postscribe [https://github.com/krux/postscribe]
		} else {
			myElement.innerHTML = response.tag; // for hosted creatives
		}
		
		
4. Perform a request to the response.tracker uri. Make sure it is not cached. The response of this tracker uri can be ignored.

		AdheseAjax.request.({
    		url: response.tracker + '?t=' + new Date().getTime(),
    		method: 'get'
		});

####Response object structure

	The request returns a JSON object with the fields described below. If no ad should be shown, an empty JSON object is returned (just two curly braces).

		{
		    "tag": "<object id='-1756524077' classid='clsid:D27CDB6E-AE6D-11cf-96B8-444553540000' codebase='http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0' WIDTH=160 HEIGHT=600><param NAME=movie VALUE='http://1.adhesecdn.be/pool/lib/96393.swf?clickTAG=http://host4.adhese.be/295057/http%3A%2F%2Ftrack.adform.net%2FC%2F%3Fbn%3D3515419'/><!--[if !IE]>--><object type='application/x-shockwave-flash' data='http://1.adhesecdn.be/pool/lib/96393.swf?clickTAG=http://host4.adhese.be/295057/http%3A%2F%2Ftrack.adform.net%2FC%2F%3Fbn%3D3515419' width='160' height='600'><!--<![endif]--><param NAME='quality' VALUE='high'/><param NAME='allowScriptAccess' VALUE='always'/><param NAME='wmode' VALUE='transparent'/><a target='_blank' href='http://host4.adhese.be/295057/http://track.adform.net/C/?bn=3515419'><img src='http://1.adhesecdn.be/pool/lib/96394.jpg'></a><!--[if !IE]>--></object><!--<![endif]--></object>", // the full html code for inserting in the container
		    
		    "body": "<ADHESE_BODY>", // the third party code to be inserted in a container (if applicable)
		    		    
		    "ext": "swf", // the file type extension
		    "adFormat": "wideskyscraper", // the assigned format name (determined by your Adhese account)
		    "adType": "SKY", // format name as requested (determined by your Adhese account)
		    
		    "extraField1": "", // optional field used by the uploader
		    "extraField2": "", // second optional field used by uploader
		    
		    "url": "http://host4.adhese.be/295057/http://track.adform.net/C/?bn=3515419", // click-through URI
		    "tracker": "http://ads.adhese.be/track/295057//sl242///////inadttr12842;adttrbiz;adttrfood;adttrhealth;adttrimmo;adttrlifestyle;adttrmultimedia;adttrsport;adttrtrav;adttrvoetbal;adttrwielrennen/brTelenet N.V./coBE/rgBE11///isTelenet N.V.//////////A2141.135.96.213.1395820307192918/O_/A_/C_", // tracker URI to be requested for counting an impression
		    "trackingUrl": "http://track.adform.net/adfserve/?bn=3515419;1x1inv=1;srctype=3;ord=", // 3rd party tracking URI to be requested when visualising

		    "swfSrc": "http://1.adhesecdn.be/pool/lib/96393.swf", // the URI of the primary file for this creative
		    "swfSrc2nd": "", // URI of 2nd file
		    "swfSrc3rd": "", // URI of 3rd file
		    "swfSrc4th": "", // URI of 4th file

		    "width": "160", // width in pixels of the primary file
		    "height": "600", // height in pixels of primary creative
		    "widthLarge": "0", // width in pixels of secondary file
		    "heightLarge": "0", // height in pixels of 2nd file

		    "adDuration": "0", // duration in seconds of primary creative (if applicable)
		    "adDuration3rd": "0", // duration in seconds of 3rd file
		    "adDuration2nd": "0", // duration in second of 2nd file
		    "adDuration4th": "0", // the optional duration of the 4th file
		    
		    "orderId": "16643", // the Adhese campaign ID
		    "adspaceId": "61721", // the Adhese booking ID
		    "adspaceKey": "0", // an optional creative Foreign Key 
		    "advertiserId": "2326" // Adhese ID of the advertiser
		    "priority": "1", // priority of this campaign
		    "id": "295057", // the Adhese ID determining the link between an uploaded creative and a booking
		    "libId": "96393", // Adhese ID of the uploaded creative
		    "share": "0", // an optional number indicating the weight for this creative
		    "orderProperty": "eadc185cbe8bcd05a5deaf7b99064d56-5d032fa3e52a1abe1392a6b4adbdd519", // optional comma seperated list of properties containing codes defined by your Adhese account
			"timeStamp": "1396357433000", // the timestamp of the latest change to this creative (can be used for caching)
		    
		    "comment": "", // optional free text comment
		    "altText": "", // optional text to be shown as ALT attribute of the container
		    
		    "poolPath": "<ADHESE_POOL_PATH>", // an optional path to a CDN where files for this creative can be retreived
		    "tagUrl": "<ADHESE_TAG_URL>", // optional URI of the tag content
  		}

###Registering target parameters
Through the adhese.registerRequestParameter(key, value) you can add one or more target parameters to the requests.
Simply register each value once, and all consequent getRequest function calls will include the parameters.

The available target parameters and their prefixes are determined by your Adhese account configuration.
		
		// will add a target with prefix 'ag' and value '40' to each request
		adhese.registerRequestParameter('ag', 40); 

#Adhese VAST SDK
In the vast directory you can find the sdk for implementing VAST based ads in HTML/JavaScript players.


