define(function () {
  "use strict";

  var _pressed = {};

  var keyboard = document.getElementsByClassName('keyboard')[0];
  var render;

  var onKeydown = function (event) {
    _pressed[event.keyCode] = true;
    render();
  };
  var onKeyup = function (event) {
    delete _pressed[event.keyCode];
    render();
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

  var DEBUG_MAPPING = {
    37: '&#8592;', // LEFT
    39: '&#8594;'  // RIGHT
  };

  render = function () {
    var text = '';

    for (var code in _pressed) {
      var mapping = DEBUG_MAPPING[code];
      if (mapping === undefined) {
        mapping = code;
      }

      if (text !== '') text += ' ';
      text += mapping;
    }

    keyboard.innerHTML = 'Keys pressed: ' + text;
  }

  render();

  return exports;
});
