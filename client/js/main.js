requirejs(['fake_lag', 'server', 'client'], function (fakeLag, server, client) {
  "use strict";

  var withLag = fakeLag.withLag;

  server.start();

  var serverInterface = {
    connect: function (client) {
      var laggyClient = {
        ping: function () {
          withLag(function () {client.ping();});
        },
        state: function (s, p) {
          withLag(function () {client.state(s, p);});
        }
      };

      withLag(function () {server.connect(laggyClient);});
    },
    sendInput: function (input) {
      withLag(function () {server.receiveInput(input);});
    },
    pingBack: function () {
      withLag(function () {server.pingBack();});
    }
  };

  var client = new client.Client(
    30, // fps
    serverInterface);

  client.start();

  {
    var v = 1;
    serverInterface.connect({
      ping: function () {
        serverInterface.pingBack();
      },
      state: function (s, p) {
        // console.log(s);

        if (s.p[0] <= 0)
          v = 1;
        else if (s.p[0] >= 50)
          v = -1;
        serverInterface.sendInput({left: v < 0 ? 1 : 0, right: v > 0 ? 1 : 0});
      }
    });
  }

  document.getElementsByClassName('kill-server')[0].addEventListener('click', function () {
    server.stop();
  });
  document.getElementsByClassName('kill-client')[0].addEventListener('click', function () {
    client.stop();
  });
});
