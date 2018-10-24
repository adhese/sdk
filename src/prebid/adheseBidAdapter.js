'use strict';

import {registerBidder} from 'src/adapters/bidderFactory';
import { BANNER, VIDEO } from 'src/mediaTypes';
const BIDDER_CODE = 'adhese';
export const spec = {
    code: BIDDER_CODE,
    isBidRequestValid: function(bid) {
      return !!(bid.params.account && bid.params.location && bid.params.formats);
    },
    
    buildRequests: function(validBidRequests, bidderRequest) {
      var account = undefined;
      var location = "_prebid_demo_";
      var reqParams = [];
      var ads = [];
      validBidRequests.forEach(function(bid, index, array) {
        if (!account) {
          account = bid.params.account;
          if (bid.params.data) {
            for (var y=0; y<bid.params.data.length; y++) {
              reqParams.push(new Array(bid.params.data[y].key, bid.params.data[y].value));
            }
          }
        }
        location = bid.params.location;
        bid.params.formats.forEach(function(format, index, array) {
          ads.push({slotName:location + "-" + format, uid:format, bidId:bid.bidId});
        });
      });
      
      var uri = "https://ads-" + account + ".adhese.com/json/";
      ads.forEach(function(ad, index, array) {
        uri += "sl" + ad.slotName + "/";
      });
      reqParams.forEach(function(reqP, index, array) {
        uri += reqP[0] + reqP[1] + '/';
      });
      uri += '?t=' + new Date().getTime();

      return {
        method: 'GET',
        url: uri,
        bids: ads
      };

    },
    
    interpretResponse: function(serverResponse, request) {
      const bids = request.bids;
      const bidResponses = [];
      let ads = serverResponse.body.reduce(function(map, ad) {
        map[ad.adType] = ad;
        return map;
      }, {});        
      for (var j = 0; j<bids.length; j++) {
        let ad = ads[bids[j].uid];
        if (!ad) {
          const bidResponse = {
            requestId: bids[j].bidId,
            cpm: 0,
            width: 0,
            height: 0,
            creativeId: 0,
            dealId: 0,
            currency: 'USD',
            netRevenue: true,
            ttl: 360,
            ad: ""
          };
          bidResponses.push(bidResponse);
        } else {
            let tag = ad.tag;
            if(ad.ext=="js" && ad.body != undefined && ad.body != "" && ad.body.match(/<script|<SCRIPT/)) {
                tag = ad.body;
            }
            let price = 0; 
            if (ad.extension && ad.extension.prebid && ad.extension.prebid.cpm) {
                let cpm = ad.extension.prebid.cpm;
                if (cpm.currency == 'USD') {
                    price = Number(cpm.amount);
                }
            }

            let creativeId = '', dealId = '';
            if(ad.origin == 'RUBICON'){
              creativeId = ad.originData.bid.crid;
              dealId = ad.originData.bid.dealid;
              tag = ad.body
            } else {
              creativeId = ad.id;
              dealId = ad.orderId;
            }
            const bidResponse = {
              requestId: bids[j].bidId,
              cpm: price,
              width: ad.width,
              height: ad.height,
              creativeId: creativeId,
              dealId: dealId,
              currency: 'USD',
              netRevenue: true,
              ttl: 360,
              ad: tag
            };
            bidResponses.push(bidResponse);
        }
      }
      return bidResponses;
    },
    
    getUserSyncs: function(syncOptions, serverResponses) {},
    
    onTimeout: function(timeoutData) {}, 
}
registerBidder(spec);
