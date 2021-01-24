
var Debug = {
  do_times_counters: {},
};

Debug.do_times = function (id, counter) {
  if (id in this.do_times_counters) {
    return --this.do_times_counters[id] > 0;
  }
  this.do_times_counters[id] = counter;
  return true;
};
