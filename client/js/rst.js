define(function () {
  "use strict";

  // WITH bound = 3
  // []
  // [0]
  // [0,1]
  // [0,1,2]
  // [?,1,2,3]
  // [?,?,2,3,4]
  // [?,?,?,3,4,5]
  function BoundedInfiniteList(bound, emptyItem) {
    var array = [];
    var size = 0;
    var head = -1;
    var offset = 0;

    var index = function(at) {
      while (size < bound && at >= size) {
        array.push(emptyItem);
        size++;
      }

      if (at - bound >= offset) {
        offset = at - bound + 1;
      }

      if (at < offset) return at - offset;
      var offsetIndex = (at) % bound;
      return offsetIndex;
    }

    this.get = function(at) {
      var i = index(at);
      if (i < 0) return emptyItem;
      return array[i];
    }

    this.set = function(at, value) {
      var i = index(at);
      if (i < 0) return;
      array[i] = value;
    }

    this.push = function(value) {
    	var at;
      if (size < bound) at = size;
      else at = offset + bound;
    	this.set(at, value);
    }

    this.toString = function() {
      var s = '[';
      for (var i = 0; i < size + offset; i++) {
        if (i > 0) s += ', ';
        s += this.get(i);
      }
      s += ']';
      return s + ' (' + array + ')';
    }
  }

  // state[n+1] = state[n] + input[n];
  function RecalculatingStateTimeline(initialState, emptyInput, step, statesToKeep) {
    var states = new BoundedInfiniteList(statesToKeep, initialState);
    var input = new BoundedInfiniteList(statesToKeep, emptyInput);
    var validAt = -1;

    states.push(initialState);
    validAt = 0;

    var calculateTo = function(at) {
      while (validAt < at) {
        var previousState = states.get(validAt);
        var previousInput = input.get(validAt);

        var next = step(previousState, previousInput);

        states.set(validAt + 1,  next);
        validAt++;
      }
    };

    this.get = function(at) {
      calculateTo(at);
      return states.get(at);
    };

    this.update = function(at, newInput) {
      input.set(at, newInput);
      if (at < validAt) validAt = at;
    }

    this.updateState = function(at, newState) {
      states.set(at, newState);
      if (at < validAt) validAt = at;
    }
  }

  return {
    RecalculatingStateTimeline: RecalculatingStateTimeline
  };
});
