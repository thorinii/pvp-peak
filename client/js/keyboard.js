define(function () {
  "use strict";

  var _pressed = {};

  var onKeydown = function (event) {
    _pressed[event.keyCode] = true;
  };
  var onKeyup = function (event) {
    delete _pressed[event.keyCode];
  };

  var exports = {
    isDown: function (key) {
      return _pressed[key] !== undefined;
    },
    enable: function () {
      window.addEventListener('keydown', onKeydown, false);
      window.addEventListener('keyup', onKeyup, false);
    },
    disable: function () {
      window.removeEventListener('keydown', onKeydown, false);
      window.removeEventListener('keyup', onKeyup, false);
    }
  };

  exports.LEFT = 37;
  exports.RIGHT = 39;

  return exports;
});
