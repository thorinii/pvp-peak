define(['keyboard', 'rst'], function (keyboard, rst) {
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

    var collectInput = function () {
      return {
        left: keyboard.isDown(keyboard.LEFT) === true,
        right: keyboard.isDown(keyboard.RIGHT) === true
      };
    }

    var step = function (dt, previous, input) {
      if (previous === undefined) return undefined;

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
        seq: previous.seq,
        p: np,
        v: nv
      };
    }

    var stateTimeline = new rst.RecalculatingStateTimeline(
      undefined,
      undefined,
      function (prevState, prevInput) { return step(1 / fps, prevState, prevInput); },
      10 * fps);
    var tick = 0;
    var latestPings = {};

    var update = function () {
      if (!going) return;
      setTimeout(update, updateInterval);

      var input = collectInput();
      stateTimeline.setInput(tick, input);
      serverInterface.sendInput(input);

      tick++;
      var state = stateTimeline.get(tick);

      if (state !== undefined) {
        clientDebug.render(state, latestPings);
      }
    };

    var server_ping = function () {
      serverInterface.pingBack();
    };

    var server_state = function (s, p) {
      latestPings = p;

      var behind = ((latestPings[0] || 0) / updateInterval) | 0;
      behind = Math.min(fps, behind);
      var at = Math.max(0, tick - behind);

      stateTimeline.setState(at, s);
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
