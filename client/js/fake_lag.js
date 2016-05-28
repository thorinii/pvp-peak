define(function () {
  "use strict";

  var lag = 200;

  return {
    withLag: function (f) {
      setTimeout(function () { f(); }, lag);
    }
  };
});
