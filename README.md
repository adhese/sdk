#Adhese SDK

This repository contains all code for implementing Adhese adserving in webpages, applications, video/radio players, ...

###Introduction
The Adhese javascript SDK is a minified javascript library that can be included in a javascript enabled client.
It allows a uniform way to identify request parameters and include advertising from your Adhese account.

###Build from source
Checkout this repository and type make

###Use compressed distribution
Use the adhese.min.js directly in your webpage.

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

4. For each ad you want to include on a page, you should create a DIV with a unique id and make a call to a the adhese.tag function

		<div id="leaderboard">
		<script type="text/javascript" charset="utf-8">
			var ad = adhese.tag("leaderboard", {write:true});
			document.write("Request URI of new ad with format " + ad.format + "<br/>" + adhese.getRequestUri(ad, {'type':'json'}));
		</script>
		</div>	

#Adhese VAST SDK
In the vast directory you can find the sdk for implementing VAST based ads in HTML/JavaScript players.
