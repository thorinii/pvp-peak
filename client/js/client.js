var ENABLE_CLIENTSIDE_PREDICTION = false;

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

    var step = function (dt, previous, input) {
      var nv = [previous.v[0], previous.v[1]];

      var inputX = 0;

      if (input !== undefined) {
        inputX = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      }

      nv[0] = inputX * 20;

      if(previous.p[0] <= 0 && nv[0] < 0) nv[0] = 0;
      else if (previous.p[0] >= 50 && nv[0] > 0) nv[0] = 0;

      if(previous.p[1] <= 0 && nv[1] < 0) nv[1] = 10;
      else if (previous.p[1] >= 50 && nv[1] > 0) nv[1] = -10;

      var np = [
        Math.max(0, previous.p[0]+nv[0]*dt),
        Math.max(0, previous.p[1]+nv[1]*dt)
      ];

      return {
        seq: previous.seq+1,
        p: np,
        v: nv
      };
    }

    var update = function () {
      if (!going) return;
      setTimeout(update, updateInterval);

      var input = collectInput();
      serverInterface.sendInput(input);

      if(latestState !== undefined) {
        if (ENABLE_CLIENTSIDE_PREDICTION) {
          latestState = step(1/fps, latestState, input);
        }

        clientDebug.render(latestState, latestPings);
      }
    };

    var server_ping = function () {
      serverInterface.pingBack();
    };

    var server_state = function (s, p) {
      latestState = s;
      latestPings = p;
    };

    this.start = function () {
      going = true;
      serverInterface.connect({
        ping: server_ping,
        state: server_state
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
