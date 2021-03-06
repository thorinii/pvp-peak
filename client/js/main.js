requirejs(['fake_lag', 'server', 'client'], function (fakeLag, server, client) {
  "use strict";

  var withLag = fakeLag.withLag;

  server.start();

  var directServerInterface = function () {
    var id = -1;
    return {
      connect: function (client) {
        id = server.connect(client);
        client.receiveId(id);
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
          receiveId: function (id) {
            withLag(function () {client.receiveId(id);});
          },
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


  var clientScreen = document.getElementById("client-screen");
  console.log("WIDTH: " + clientScreen.offsetWidth);
  var renderer = PIXI.autoDetectRenderer(clientScreen.offsetWidth, 200);
  clientScreen.appendChild(renderer.view);

  var stage = new PIXI.Container();

  PIXI.loader
      .add("images/entity_player.png")
      .load(onLoadingFinished);

  var playerSprite1 = null;
  var playerSprite2 = null;

  function onLoadingFinished() {
    playerSprite1 = new PIXI.Sprite(
      PIXI.loader.resources["images/entity_player.png"].texture);
    stage.addChild(playerSprite1);
    playerSprite1.anchor.x = 0.5;
    playerSprite1.anchor.y = 1;

    playerSprite2 = new PIXI.Sprite(
      PIXI.loader.resources["images/entity_player.png"].texture);
    stage.addChild(playerSprite2);
    playerSprite2.anchor.x = 0.5;
    playerSprite2.anchor.y = 1;

    playerSprite1.x = 50;
    playerSprite1.y = 200;
    playerSprite2.x = 50;
    playerSprite2.y = 200;
  }

  renderer.render(stage);


  {
    var laggyServerInterface = laggify(directServerInterface());
    var testPlayerId;
    var v = 1;
    laggyServerInterface.connect({
      receiveId: function (id) {
        testPlayerId = id;
      },
      ping: function () {
        laggyServerInterface.pingBack();
      },
      state: function (s, p) {
        // console.log(s);

        if (s.p[1] <= 10)
          v = 1;
        else if (s.p[1] >= 40)
          v = -1;
        laggyServerInterface.sendInput({left: v < 0 ? 1 : 0, right: v > 0 ? 1 : 0});


        if (playerSprite1 != null) {
          playerSprite1.x = 20 + s.p[0] * 2;
        }
        if (playerSprite2 != null) {
          playerSprite2.x = 20 + s.p[1] * 2;
        }
        requestAnimationFrame(function () {renderer.render(stage);});
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
