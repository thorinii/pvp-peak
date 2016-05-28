define(['keyboard'], function (keyboard) {
  "use strict";

  var clientDebug = {};
  clientDebug.html = document.getElementById('client-debug');
  clientDebug.render = function (state, pings) {
    var pingText = pings[0] === undefined ? "?" : pings[0] + "ms";

    this.html.innerHTML =
      '<h2>Client</h2>' +
      '<span>Iteration ' + state.seq + '</span><br>' +
      '<span>Ping: ' + pingText + '</span><br>' +
      '<span>A: ' + state.p[0] + 'm ' + state.v[0] + 'm/s</span><br>' +
      '<span>B: ' + state.p[1] + 'm ' + state.v[1] + 'm/s</span><br>' +
      '<span style="margin-left:' + (state.p[0] * 5) + 'px">A</span><br>' +
      '<span style="margin-left:' + (state.p[1] * 5) + 'px">B</span><br>'
  }

  keyboard.enable();

  function Client(fps, serverInterface) {
    var updateInterval = 1000 / fps;
    var going = false;

    var latestPings = {};
    var latestState = undefined;

    var collectInput = function () {
      return {
        left: keyboard.isDown(keyboard.LEFT) === true,
        right: keyboard.isDown(keyboard.RIGHT) === true
      };
    }

    var update = function () {
      if (!going) return;
      setTimeout(update, updateInterval);

      var input = collectInput();
      serverInterface.sendInput(input);

      if(latestState !== undefined)
        clientDebug.render(latestState, latestPings);
    };

    var ping = function () {
      serverInterface.pingBack();
    };

    var state = function (s, p) {
      latestState = s;
      latestPings = p;
    };

    this.start = function () {
      going = true;
      serverInterface.connect({
        ping: ping,
        state: state
      });
      setTimeout(update, 0);
    };

    this.stop = function () {
      going = false;
    }
  }

  return {
    Client: Client
  };
});
