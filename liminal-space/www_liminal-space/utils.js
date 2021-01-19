var Utils = {};

Utils.get_permutation = function (size) {
  const arr = Array(size).fill();
  for (let v = 0; v < arr.length; ++v) {
    const offset = Math.random() * size | 0;
    for (let i = 0; i < arr.length; ++i) {
      const index = (offset + i) % size;
      if (arr[index] == null) {
        arr[index] = v;
        break;
      }
    }
  }
  return arr;
};
