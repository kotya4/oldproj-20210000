/* gen by new.py at 2020-11-16 12:13:40.629132

Линейная НС.

*/
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const sigmoid = (e) => 1.0 / (1 + Math.exp(-e));
  const dsigmoid = (e) => e * (1 - e);


  const net = new Linear([2, 3, 2], sigmoid, dsigmoid);

  const input = mat(1, 2);
  input[0] = 1;

  net.feed(input);

  console.log(net);

};


class Linear {
  constructor(sizes, activation, derivative) {
    this.layers  = Array(sizes.length-1).fill().map((_,i) => mat(1, sizes[i+1]).map(Math.random)); // TODO: map переписывает mat
    this.biases  = Array(sizes.length-1).fill().map((_,i) => mat(1, sizes[i+1]).map(Math.random));
    this.weights = Array(sizes.length-1).fill().map((_,i) => mat(sizes[i+0], sizes[i+1]).map(Math.random));
    this.activation = activation;
    this.derivative = derivative;
  }

  // feed forward
  feed(input) {
    for (let i = 0; i < this.layers.length; ++i) {
      const layer = i > 0 ? this.layers[i-1] : input;
      const m = mat();
      mat.mul(m, this.weights[i], layer);
      mat.add(this.layers[i], m, this.biases[i]);
      this.layers[i] = this.layers[i].map(e => this.activation(e));

      console.log(m);
    }
  }


}


function mat(w, h) {
  return mat.create(w, h);
}


mat.create = function (w=1, h=1) {
  const m = Array(w*h).fill(0);
  m.width = w;
  m.height = h;
  m.index = (x, y) => ~~x + ~~y * m.width;
  m.get = (x, y) => m[m.index(x, y)];
  m.set = (x, y, v) => m[m.index(x, y)] = v;
  return m;
};


mat.add = function (out, m1, m2) {
  for (let i = 0; i < m1.length; ++i) out[i] = m1[i] + m2[i];
  return out;
};


mat.mul = function (out, m1, m2) {
  for (let x = 0; x < m2.width; ++x) for (let y = 0; y < m1.height; ++y) {
    let v = 0;
    for (let i = 0; i < m1.width; ++i) v += m1.get(i, y) * m2.get(x, i);
    out.set(x, y, v);
  }
  out.width = m2.width;
  out.height = m1.height;
  console.log(m1, m2);
  return out;
};

