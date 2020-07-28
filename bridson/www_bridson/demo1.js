//
async function bridson_demo_1(o) {
  const {
    parent,
    seed,
    radius,
    tries,
    height,
    width,
    fill_canvas,
    draw_grid,
    animate_b_gen_rc__point_radius,
    animate_b_gen_rc__overall_time,
    animate_b_gen_rc__frame_delay,
    animate_b_gen_rc__with_points,
    animate_b_gen_rc__with_await,
    animate_b_gen_rc__colorized_stroke,
    animate_b_gen_rc__colorized_fill,
  } = Object.assign({
    parent: document.body,
    seed: null,
    radius: 10,
    tries: 30,
    height: 300,
    width: 300,
    fill_canvas: false,
    draw_grid: true,
    animate_b_gen_rc__point_radius: 1.5,
    animate_b_gen_rc__overall_time: 200,
    animate_b_gen_rc__frame_delay: 50,
    animate_b_gen_rc__with_points: false,
    animate_b_gen_rc__with_await: true,
    animate_b_gen_rc__colorized_stroke: true,
    animate_b_gen_rc__colorized_fill: true,
  }, o);

  // randomize seed
  if (null != seed)
    Math.seedrandom(seed);

  // create canvas
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  parent.innerHTML = '';
  parent.appendChild(ctx.canvas);

  // create noise
  const b2 = new Bridson2d(ctx.canvas.width, ctx.canvas.height, radius, tries);
  b2.generate();

  // create animation
  async function animate_b_gen_rc(i=0) {
    if (animate_b_gen_rc__with_points) {
      const r = animate_b_gen_rc__point_radius;
      if (animate_b_gen_rc__colorized_fill)
        ctx.fillStyle = xterm_hex_colors[i];
      ctx.beginPath();
      ctx.ellipse(...b2.points[i], r, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let k of b2.links[i]) {
      const frame_delay = animate_b_gen_rc__frame_delay;
      const overall_time = animate_b_gen_rc__overall_time;
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
          if (animate_b_gen_rc__colorized_stroke)
            ctx.strokeStyle = xterm_hex_colors[i];
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(x, y);
          ctx.stroke();
          if (++iters >= iterations) {
            clearInterval(stroke_iid);
            r();
          }
        }, frame_delay);
      });

      if (animate_b_gen_rc__with_await) {
        await animate_b_gen_rc(k);
      } else {
        animate_b_gen_rc(k);
      }
    }
  }

  // clear canvas
  if (fill_canvas) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // draw grid
  if (draw_grid) {
    ctx.strokeStyle = '#222';
    ctx.beginPath();
    for (let y = 1; y < b2.grid_h; ++y) {
      ctx.moveTo(       0, y * b2.cell_size);
      ctx.lineTo(b2.width, y * b2.cell_size);
    }
    for (let x = 1; x < b2.grid_w; ++x) {
      ctx.moveTo(x * b2.cell_size,         0);
      ctx.lineTo(x * b2.cell_size, b2.height);
    }
    ctx.stroke();
  }

  // draw animation
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#aaa';
  animate_b_gen_rc();

  // debug
  console.log('bridson_demo_1');
}
