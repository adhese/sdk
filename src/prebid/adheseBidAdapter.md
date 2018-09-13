# Overview

Module Name: Adhese Bidder Adapter
Module Type: Bidder Adapter
Maintainer: support@adhese.com

# Description

Module that connects to an Adhese account to receive bids.
Currently banners are supported.

# Test Parameters
```
    var adUnits = [
           {
               code: "leaderboard", 
                mediaTypes: {
                    banner: { sizes: [[728, 90]] }
                },
                bids: [
                   {
                       bidder: "adhese",
                       params: {
                           account: 'demo', //the code of your adhese account, if unknown, please contact your sales rep
                           location: "_adhese_prebid_demo_", // the location you want to refer to for a specific section or page, as defined in your Adhese inventory
                           formats: [ "leaderboard" ], // the format(s) you accept for this unit, as defined in your Adhese inventory
                           data: [
                                {
                                    key: "ag", 
                                    value: "41"
                                },
                                {
                                    key: "ge", 
                                    value: "male"
                                },
                                {
                                    key: "interests", 
                                    value: "sports,cooking"
                                },
                                {
                                    key: "interests", 
                                    value: "stock_market"
                                }
                            ] // array of key/value objects you want to use in the request, for collections, use comma as seperator between the values, or send the key multiple times
                       }
                   }
               ]
           },
       ];
```
