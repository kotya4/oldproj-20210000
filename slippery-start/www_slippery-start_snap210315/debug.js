
var Debug = {
  counters: {},
};

Debug.counter = function (id) {
  if (false === id in this.counters) {
    this.counters[id] = 0;
  }
  return ++this.counters[id];
};

Debug.counter.usage = function () {
  for (let i = 0; i < 1000; ++i) {
    if (Debug.counter('some counter') <= 69) {
      console.log(`message number ${i+1}: this message will be shown only 69 times`);
    }
  }
};
