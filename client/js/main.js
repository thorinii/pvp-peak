requirejs(['fake_lag', 'server', 'client'], function (fakeLag, server, client) {
  "use strict";

  var withLag = fakeLag.withLag;

  server.start();

  var directServerInterface = function () {
    var id = -1;
    return {
      connect: function (client) {
        id = server.connect(client);
      },
      sendInput: function (input) {
        server.receiveInput(id, input);
      },
      pingBack: function () {
        server.pingBack(id);
      }
    };
  };

  var laggify = function (delegate) {
    return {
      connect: function (client) {
        var laggyClient = {
          ping: function () {
            withLag(function () {client.ping();});
          },
          state: function (s, p) {
            withLag(function () {client.state(s, p);});
          }
        };

        withLag(function () {delegate.connect(laggyClient);});
      },
      sendInput: function (input) {
        withLag(function () {delegate.sendInput(input);});
      },
      pingBack: function () {
        withLag(function () {delegate.pingBack();});
      }
    };
  };

  var client = new client.Client(
    30, // fps
    laggify(directServerInterface()));

  client.start();

  {
    var laggyServerInterface = laggify(directServerInterface());
    var v = 1;
    laggyServerInterface.connect({
      ping: function () {
        laggyServerInterface.pingBack();
      },
      state: function (s, p) {
        // console.log(s);

        if (s.p[0] <= 0)
          v = 1;
        else if (s.p[0] >= 50)
          v = -1;
        laggyServerInterface.sendInput({left: v < 0 ? 1 : 0, right: v > 0 ? 1 : 0});
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
