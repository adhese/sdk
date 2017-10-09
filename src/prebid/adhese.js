var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var utils = require('../utils.js');

var AdheseAdapter = function AdheseAdapter() {
  
  function addEmptyBidResponse(uid) {
    var bidObject = bidfactory.createBid(2, utils.getBidRequest(uid));
    bidObject.bidderCode = 'adhese';
    bidObject.cpm = 0;
    bidObject.ad = "";
    bidObject.width = 0;
    bidObject.height = 0;
    bidObject.impressionCounter = "";
    bidmanager.addBidResponse(uid, bidObject);
  }

  function addBidResponse(bid) {
    var bidObject = bidfactory.createBid(1, utils.getBidRequest(bid.adType));
    bidObject.bidderCode = 'adhese';
    bidObject.cpm = Math.random(0,1);
    bidObject.ad = bid.tag;
    bidObject.width = bid.width;
    bidObject.height = bid.height;
    bidObject.impressionCounter = bid.impressionCounter;
    bidmanager.addBidResponse(bid.adType, bidObject);
  }

  /**
   * This function will create requests based on the prebid params. It executes them and calls a callback function when doen to norify prebid
   * @param  {object} params An onject containing the different param attributes
   */
  function executeRequests(params) {
    adArray = new Array();
    adhese = new Adhese();
    for (x=0; x<params.bids.length; x++) {
      if (x==0) {
        adhese.init({account:params.bids[x].params.account, location: params.bids[x].params.location});
        for (y=0; y<params.bids[x].params.data.length; y++) {
          adhese.registerRequestParameter(params.bids[x].params.data[y].key, params.bids[x].params.data[y].value);
        }      
      }
      for (y=0; y<params.bids[x].params.formats.length; y++) {
        adArray.push(adhese.tag(params.bids[x].params.formats[y]));
      }
    }
    AdheseAjax.request({
      url: adhese.getMultipleRequestUri(adArray, {'type':'json'}),
      method: 'get',
      json: true
    }).done(function(result) {
        for (var j = 0; j<adArray.length; j++) {
          var found = false;
          for (var i = 0; i<result.length; i++) {
            if (adArray[j].uid == result[i].adType) {
              addBidResponse(result[i]);
              found = true;
            }
          }
          if (!found) {
              addEmptyBidResponse(adArray[j].uid);
          }
        }
    });
  };

  function _callBids(params) {
    executeRequests(params);
  }

  return {
      callBids: _callBids
  };

};

module.exports = AdheseAdapter;