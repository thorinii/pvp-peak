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
});
