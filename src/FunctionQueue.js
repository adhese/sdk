const queue = (window.adhesetag && window.adhesetag.ahq) || [];
window.adhesetag = {
  ahq: {
    push: function(fn) {
        fn();
    },
  },
  init: function(options) {
    window.adhesetag.adhese = new Adhese();
    window.adhesetag.adhese.init(options);
  },
  adhese: null,
  AdheseAjax: AdheseAjax,
}

queue.forEach(window.adhesetag.ahq.push);
