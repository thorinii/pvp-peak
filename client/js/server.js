define(['rst'], function (rst) {
  "use strict";

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
      '<div class="stage">' +
      '<span style="margin-left:' + (state.p[0] * 5) + 'px">A</span><br>' +
      '<span style="margin-left:' + (state.p[1] * 5) + 'px">B</span><br>' +
      '</div>'
  }


  var fps = 10;
  var updateInterval = 1000 / fps;

  var step = function (dt, previous, clientsInput) {
    var np = [];
    var nv = [];

    for (var id = 0; id < clients.length; id++) {
      var input = clientsInput[id];
      if (input === undefined) input = [];

      if (input.length > 0) {
          var inputX = input.reduce(function (a, b) {
          return a + (b.left ? -1 : 0) + (b.right ? 1 : 0);
        }, 0) / input.length;

        nv[id] = inputX * 20;
      } else {
        nv[id] = 0;
      }

      if (previous.p[id] === undefined) previous.p[id] = 10;

      if(previous.p[id] <= 0 && nv[id] < 0) nv[id] = 0;
      else if (previous.p[id] >= 50 && nv[id] > 0) nv[id] = 0;

      np[id] = Math.max(0, previous.p[id]+nv[id]*dt);

      if (input.length == 0) {
        nv[id] = previous.v[id] === undefined ? 0 : previous.v[id];
      }
    }

    return {
      seq: previous.seq+1,
      p: np,
      v: nv
    };
  }

  var going = false;
  var clients = [];
  var pingsInProgress = {};
  var latestPings = {};

  var tick = 0;
  var stateTimeline = new rst.RecalculatingStateTimeline(
    {
      seq: 0,
      p: [10, 30],
      v: [0, -10]
    },
    undefined,
    function (prevState, prevInput) {
      if (prevInput === undefined) prevInput = [];
      return step(1 / fps, prevState, prevInput);
    },
    10 * fps);

  var update = function () {
    if (!going) return;
    setTimeout(update, updateInterval);

    tick++;
    var state = stateTimeline.get(tick);

    if (tick % 10 == 1) {
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
    var id = clients.length;
    clients.push(client);
    return id;
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

  var receiveInput = function (id, input) {
    var behind = ((latestPings[id] || 0) / 2 / updateInterval) | 0;
    behind = Math.min(fps, behind);
    var at = tick - behind;

    stateTimeline.updateInput(at, function (prev) {
      if (prev === undefined) prev = [];
      if (prev[id] === undefined) prev[id] = [];
      prev[id].push(input);
      return prev;
    });
  };

  var pingBack = function (id) {
    var now = Date.now();

    if (pingsInProgress[id] !== undefined) {
      var ping = now - pingsInProgress[id];
      latestPings[id] = ping;
      delete pingsInProgress[id];
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
});
