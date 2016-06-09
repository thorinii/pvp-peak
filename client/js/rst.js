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
    var base = 0;
    var items = 0;

    var ensureArrayCapacity = function (at) {
      while (array.length < bound && at >= array.length) {
        array.push(emptyItem);
      }
    }

    var index = function(at) {
      if (at - bound >= base) {
        base = at - bound + 1;
      }

      if (at < base) return at - base;
      var arrayIndex = (at) % bound;
      return arrayIndex;
    }

    this.get = function(at) {
      if (at >= items) return undefined;
      if (at < base) return emptyItem;
      return array[at - base];
    }

    this.set = function(at, value) {
      if (at < base) return;

      while (items <= at) {
        this.push(emptyItem);
      }

      array[at - base] = value;
    }

    this.push = function(value) {
      if (items >= bound) {
        array.splice(0, 1);
        base++;
      }

      array.push(value);
      items++;
    }

    this.toString = function() {
      var s = '[';
      for (var i = 0; i < items; i++) {
        if (i > 0) s += ', ';
        s += this.get(i);
      }
      s += ']';
      return s + ' (' + array + ')';
    }
  }

  var bil = new BoundedInfiniteList(3, '?');
  console.log('== Empty');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());
  bil.push(0);
  bil.push(1);
  bil.push(2);
  console.log('== Adding 1,2,3');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());
  bil.push(3);
  console.log('== Adding 3');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());
  bil.push(4);
  bil.push(5);
  bil.push(6);
  console.log('== Adding 4,5,6');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());
  bil.set(1, 384);
  console.log('== Set [1] = 384');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());
  bil.set(5, 384);
  console.log('== Set [5] = 384');
  console.log(bil.toString());
  console.log(bil.get(1));
  console.log(bil.toString());

  // state[n+1] = state[n] + input[n];
  function RecalculatingStateTimeline(initialState, emptyInput, step, statesToKeep) {
    var states = new BoundedInfiniteList(statesToKeep, initialState);
    var input = new BoundedInfiniteList(statesToKeep, emptyInput);
    var validAt = -1;

    validAt = 0;

    var calculateTo = function(at) {
      while (validAt < at) {
        var previousState = states.get(validAt);
        var previousInput = input.get(validAt);

        if (previousState === undefined) previousState = initialState;
        if (previousInput === undefined) previousInput = emptyInput;

        var next = step(previousState, previousInput);

        states.set(validAt + 1,  next);
        validAt++;
      }
    };

    this.get = function(at) {
      calculateTo(at);
      return states.get(at);
    };

    this.updateInput = function(at, f) {
      var prev = input.get(at);
      var next = f(prev);
      this.setInput(at, next);
    }

    this.setInput = function(at, newInput) {
      input.set(at, newInput);
      if (at < validAt) validAt = at;
    }

    this.setState = function(at, newState) {
      states.set(at, newState);
      if (at < validAt) validAt = at;
    }
  }

  return {
    RecalculatingStateTimeline: RecalculatingStateTimeline
  };
});
