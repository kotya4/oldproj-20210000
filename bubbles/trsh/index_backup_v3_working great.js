window.onload = async function onload() {
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  const grid_sz = 26;
  const grid_w = 12;
  const grid_h = 10;
  const grid = Array(grid_w * grid_h).fill(-1);
  const I = (x, y) => (x < 0 || x >= grid_w || y < 0 || y >= grid_h)
    ? -1 : x + y * grid_w;

  const blocks = [
    { color: 'red' },
    { color: 'green' },
  ];

  const fb1 = {
    block_id: 0,
    pos: [0, 0],
  };

  const fb2 = {
    block_id: 0,
    pos: [0, 0],
  };

  let rot = 0;

  function circle(x, y) {
    const r = (grid_sz >> 1) - 1;
    ctx.beginPath();
    ctx.ellipse(x * grid_sz + r,
                y * grid_sz + r,
                r, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function reset() {
    fb1.pos[0] = (grid_w >> 1) - 1;
    fb1.pos[1] = -1;
    fb1.block_id = Math.random() * blocks.length | 0;
    fb2.pos[0] = (grid_w >> 1) - 0;
    fb2.pos[1] = -1;
    fb2.block_id = Math.random() * blocks.length | 0;
    rot = 0;
  }

  function change_rot(dr) {
    rot = (rot + dr + 4) % 4;
    if        (rot === 0) {
      fb2.pos[0] = fb1.pos[0] + 1;
      fb2.pos[1] = fb1.pos[1];
    } else if (rot === 1) {
      fb2.pos[0] = fb1.pos[0];
      fb2.pos[1] = fb1.pos[1] + 1;
    } else if (rot === 2) {
      fb2.pos[0] = fb1.pos[0] - 1;
      fb2.pos[1] = fb1.pos[1];
    } else if (rot === 3) {
      fb2.pos[0] = fb1.pos[0];
      fb2.pos[1] = fb1.pos[1] - 1;
    }
  }

  function collide_grid(fb) {
    const x = fb.pos[0];
    const y = fb.pos[1];
    if (x < 0 || x >= grid_w || y >= grid_h) return true;
    const i = I(x, y);
    if (i < 0 || grid[i] >= 0) return true;
    return false;
  }

  function fb_by_left() {
    return fb1.pos[0] < fb2.pos[0] ? fb1 : fb2;
  }

  function fb_by_right() {
    return fb1.pos[0] < fb2.pos[0] ? fb2 : fb1;
  }

  function fb_by_top() {
    return fb1.pos[1] < fb2.pos[1] ? fb1 : fb2;
  }

  function fb_by_bottom() {
    return fb1.pos[1] < fb2.pos[1] ? fb2 : fb1;
  }

  function save_pos_rot() {
    return [[...fb1.pos], [...fb2.pos], rot];
  }

  function restore_pos_rot(dump) {
    fb1.pos[0] = dump[0][0];
    fb1.pos[1] = dump[0][1];
    fb2.pos[0] = dump[1][0];
    fb2.pos[1] = dump[1][1];
    rot = dump[2];
  }

  function find_y_with_block_below(pos) {
    let y = pos[1] + 1;
    for ( ; y < grid_h; ++y)
      if (grid[I(pos[0], y)] >= 0)
        return y - 1;
    return y - 1;
  }

  function set_block(x, y, v) {
    const i = I(x, y);
    if (i >= 0) grid[i] = v;
  }

  function redraw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(50, 50);

    ctx.strokeStyle = 'white';
    ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);

    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < grid_w; ++x)
    {
      const gv = grid[I(x, y)];
      if (gv === -1) continue;
      ctx.fillStyle = blocks[gv].color;
      circle(x, y, (grid_sz >> 1) - 1);
    }

    ctx.fillStyle = blocks[fb1.block_id].color;
    circle(...fb1.pos);

    ctx.fillStyle = blocks[fb2.block_id].color;
    circle(...fb2.pos);

    ctx.restore();
  }

  function onkeypress(e) {
    if ('KeyA' === e.code) {
      const dump = save_pos_rot();
      fb1.pos[0] -= 1;
      fb2.pos[0] -= 1;
      collide_grid(fb_by_left()) && restore_pos_rot(dump);
    }

    if ('KeyD' === e.code) {
      const dump = save_pos_rot();
      fb1.pos[0] += 1;
      fb2.pos[0] += 1;
      collide_grid(fb_by_right()) && restore_pos_rot(dump);
    }

    if ('KeyS' === e.code) {
      if (rot === 0 || rot === 2) {
        fb1.pos[1] = find_y_with_block_below(fb1.pos);
        fb2.pos[1] = find_y_with_block_below(fb2.pos);
      } else {
        const _1 = fb_by_bottom();
        const _2 = fb_by_top();
        _1.pos[1] = find_y_with_block_below(_1.pos);
        _2.pos[1] = _1.pos[1] - 1;
      }
      // HACK: После этого действия все еще можно двигаться,
      //       если достаточно быстро нажимать на клавиши.
      //       Пока что это не баг, а фича.
    }

    if ('KeyQ' === e.code) {
      const dump = save_pos_rot();
      change_rot(+1);
      collide_grid(fb2) && restore_pos_rot(dump);
    }

    if ('KeyE' === e.code) {
      const dump = save_pos_rot();
      const dump_rot = rot;
      change_rot(-1);
      collide_grid(fb2) && restore_pos_rot(dump);
    }

    redraw(ctx);
  }

  function strip_len(pos) {
    let y = pos[1];
    const v = grid[I(pos[0], y)];
    let len = 1;
    for (++y; y < grid_h; ++y) {
      if (grid[I(pos[0], y)] !== v) break;
      ++len;
    }
    return len;
  }

  function animate_strip(pos) {
    let len = strip_len(pos);
    if (len < 4) return null;
    return new Promise((r) => {
      redraw();
      const iid = setInterval(() => {
        grid[I(pos[0], pos[1] + len - 1)] = -1;
        redraw();
        if (--len < 0) {
          clearInterval(iid);
          return r();
        }
      }, 100);
    });
  }

  async function render() {
    const dump = save_pos_rot();
    fb1.pos[1] += 1;
    fb2.pos[1] += 1;
    const is_fb1_collided = collide_grid(fb1);
    const is_fb2_collided = collide_grid(fb2);
    if (is_fb1_collided || is_fb2_collided) {
      const [fb1_pos, fb2_pos] = dump;

      if (fb1_pos[1] < 0 && fb2_pos[1]) {
        console.log('game over');

        ctx.fillStyle = 'yellow';
        ctx.fillRect(0, 0, width, height);

        return;
      }

      if (is_fb1_collided) {
        grid[I(...fb1_pos)] = fb1.block_id;
      }

      if (is_fb2_collided) {
        grid[I(...fb2_pos)] = fb2.block_id;
      }

      if (!is_fb1_collided) {
        fb1_pos[1] = find_y_with_block_below(fb1_pos);
        grid[I(...fb1_pos)] = fb1.block_id;
      }

      if (!is_fb2_collided) {
        fb2_pos[1] = find_y_with_block_below(fb2_pos);
        grid[I(...fb2_pos)] = fb2.block_id;
      }

      reset();

      await animate_strip(fb1_pos);
      await animate_strip(fb2_pos);
    }

    redraw();

    setTimeout(render, 300);
  }

  reset();
  addEventListener('keypress', onkeypress);
  render();
}
