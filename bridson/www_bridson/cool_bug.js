//
window.onload = (async function main() {
  Math.seedrandom('a');

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = 300;
  ctx.canvas.width = 300;
  document.body.appendChild(ctx.canvas);

  const b2 = new Bridson2d(ctx.canvas.width, ctx.canvas.height, 10, 30);
  b2.generate();

  function draw_grid(cell_size) {
    const cols = ~~(ctx.canvas.width  / cell_size);
    const rows = ~~(ctx.canvas.height / cell_size);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    for (let y = 1; y < rows; ++y) {
      ctx.moveTo(               0, y * cell_size);
      ctx.lineTo(ctx.canvas.width, y * cell_size);
    }
    for (let x = 1; x < cols; ++x) {
      ctx.moveTo(x * cell_size,                 0);
      ctx.lineTo(x * cell_size, ctx.canvas.height);
    }
    ctx.stroke();
  }

  function draw_point(p, color, radius) {
    const r = 2; //Math.min((radius+1)/100, 5);
    ctx.fillStyle = color || 'blue';
    ctx.beginPath();
    ctx.ellipse(...p, r, r, 0, 0, Math.PI*2);
    ctx.fill();
  }

  async function stroke_links_rc(i=0) {
    for (let k of b2.links[i]) {
      ctx.strokeStyle = 'pink';
      ctx.beginPath();
      ctx.moveTo(...b2.points[i]);
      ctx.lineTo(...b2.points[k]);
      ctx.stroke();
      await new Promise(r => setTimeout(r, 400));
      stroke_links_rc(k);
    }
  }

  async function animate_b_gen_rc(i=0) {
    {
      const r = 2;
      ctx.beginPath();
      ctx.ellipse(...b2.points[i], r, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    await new Promise(r => setTimeout(r, 400));

    for (let k of b2.links[i]) {
      ctx.beginPath();
      ctx.moveTo(...b2.points[i]);

      const frame_delay = 100;
      const overall_time = 400;
      const iterations = overall_time / frame_delay | 0;
      const [fx, fy] = b2.points[i];
      const [tx, ty] = b2.points[k];
      const dx = (tx - fx) / iterations;
      const dy = (ty - fy) / iterations;
      let iters = 0;
      let [x, y] = [fx, fy];

      await new Promise(r => {
        const stroke_iid = setInterval(() => {
          x += dx;
          y += dy;
          ctx.lineTo(x, y);
          ctx.stroke();
          if (++iters >= iterations) {
            clearInterval(stroke_iid);
            r();
          }
        }, 50);
      });

      animate_b_gen_rc(k);
    }
  }

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // draw_grid(cell_size);
  // for (let p of b2.points) {
  //   draw_point(p, 'lightblue');
  // }
  // stroke_links_rc();

  ctx.fillStyle = 'blue';
  ctx.strokeStyle = 'pink';
  animate_b_gen_rc();



  console.log('done');
});
