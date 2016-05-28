requirejs([], function () {
  "use strict";

  var Key = {
    _pressed: {},

    LEFT: 37,
    RIGHT: 39,

    isDown: function (keyDown) {
      return this._pressed[keyDown];
    },

    onKeydown: function (event) {
      this._pressed[event.keyCode] = true;
    },

    onKeyup: function (event) {
      delete this._pressed[event.keyCode];
    }
  }

  window.addEventListener('keydown', function (event) { Key.onKeydown(event); }, false);
  window.addEventListener('keyup', function (event) { Key.onKeyup(event); }, false);


  function HistoryBuffer(maxLength) {
    var data = [];
  }

  function ComputedHistoryBuffer(maxLength) {

  }

  var server = {
    states: new ComputedHistoryBuffer(2),
    input: new HistoryBuffer(2)
  };

  var serverDebug = {};
  serverDebug.html = document.getElementById('server-debug');
  serverDebug.render = function (state, pings) {
    var pingText = "";
    for (var key in pings) {
      pingText += key + "=" + pings[key] + "ms  ";
    }

    this.html.innerHTML =
      '<h2>Server</h2>' +
      '<span>Iteration ' + state.seq + '</span><br>' +
      '<span>Pings: ' + pingText + '</span><br>' +
      '<span>A: ' + state.p[0] + 'm ' + state.v[0] + 'm/s</span><br>' +
      '<span>B: ' + state.p[1] + 'm ' + state.v[1] + 'm/s</span><br>' +
      '<span style="margin-left:' + (state.p[0] * 5) + 'px">A</span><br>' +
      '<span style="margin-left:' + (state.p[1] * 5) + 'px">B</span><br>'
  }

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

  var lag = 200;
  var withLag = function (f) {
    setTimeout(function () { f(); }, lag);
  }

  var server = (function () {
    var fps = 10;
    var updateInterval = 1000 / fps;

    var going = false;
    var clients = [];
    var pingsInProgress = {};
    var latestPings = {};

    var state = {
      seq: 0,
      p: [10, 80],
      v: [2, -1]
    }
    var inputQueue = [];

    var step = function (previous, input) {
      var nv = [previous.v[0], previous.v[1]];

      var inputX = 0;

      if (input.length > 0) {
        inputX = input.reduce(function (a, b) {
          return a + (b.left ? -1 : 0) + (b.right ? 1 : 0);
        }, 0) / input.length;
      }

      nv[0] = inputX * 2;

      if(previous.p[0] <= 0 && nv[0] < 0) nv[0] = 0;
      else if (previous.p[0] >= 50 && nv[0] > 0) nv[0] = 0;

      if(previous.p[1] <= 0 && nv[1] < 0) nv[1] = 1;
      else if (previous.p[1] >= 50 && nv[1] > 0) nv[1] = -1;

      var np = [
        Math.max(0, previous.p[0]+nv[0]),
        Math.max(0, previous.p[1]+nv[1])
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

      state = step(state, inputQueue);
      inputQueue = [];

      if (state.seq % 10 == 1) {
        var now = Date.now();

        clients.forEach(function (c, index) {
          if (pingsInProgress[index] === undefined) {
            pingsInProgress[index] = now;
            c.ping();
          }
        });
      }

      sendToClient(state);
      serverDebug.render(state, latestPings);
    };

    var connect = function (client) {
      clients.push(client);
    };

    var sendToClient = function (state) {
      clients.forEach(function (c) {
        c.state(state, latestPings);
      });
    }

    var start = function () {
      going = true;
      setTimeout(update, 0);
    };

    var stop = function () {
      going = false;
    };

    var receiveInput = function (input) {
      inputQueue.push(input);
    };

    var pingBack = function () {
      var now = Date.now();

      if (pingsInProgress[0] !== undefined) {
        var ping = now - pingsInProgress[0];
        latestPings[0] = ping;
        delete pingsInProgress[0];
      }
    };

    return {
      update: update,
      connect: connect,
      start: start,
      stop: stop,
      receiveInput: receiveInput,
      pingBack: pingBack
    }
  })();

  server.start();

  var serverInterface = {
    connect: function (client) {
      withLag(function () {server.connect(client);});
    },
    sendInput: function (input) {
      withLag(function () {server.receiveInput(input);});
    },
    pingBack: function () {
      withLag(function () {server.pingBack();});
    }
  };


  var client = (function (serverInterface) {
    var fps = 30;
    var updateInterval = 1000 / fps;
    var going = false;

    var latestPings = {};
    var latestState = undefined;

    var collectInput = function () {
      return {
        left: Key.isDown(Key.LEFT) === true,
        right: Key.isDown(Key.RIGHT) === true
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

    var start = function () {
      going = true;
      serverInterface.connect({
        ping: function () {
          withLag(function () {ping();});
        },
        state: function (s, p) {
          withLag(function () {state(s, p);});
        }
      });
      setTimeout(update, 0);
    };

    var stop = function () {
      going = false;
    }

    return {
      update: update,
      start: start,
      stop: stop
    };
  })(serverInterface);

  client.start();
});