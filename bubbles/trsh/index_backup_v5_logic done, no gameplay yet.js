window.onload = async function onload() {
  const height = 800;
  const width = 1000;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  const grid_sz = 26;
  const grid_w = 16;
  const grid_h = 14;
  const grid = Array(grid_w * grid_h).fill(-1);
  const I = (x, y) => (x < 0 || x >= grid_w || y < 0 || y >= grid_h) ? -1 : x + y * grid_w;

  const blocks = [
    { type: 'circle', color:        'red' },
    { type: 'circle', color:       'blue' },
    { type: 'circle', color:      'green' },
    { type: 'circle', color:     'yellow' },
    { type: 'circle', color:       'pink' },
    { type: 'circle', color:    'magenta' },
    { type: 'circle', color: 'lightgreen' },
    { type: 'circle', color:     'orange' },
    { type:   'quad', color:        'red' },
    { type:   'quad', color:       'blue' },
    { type:   'quad', color:      'green' },
    { type:   'quad', color:     'yellow' },
    { type:   'quad', color:       'pink' },
    { type:   'quad', color:    'magenta' },
    { type:   'quad', color: 'lightgreen' },
    { type:   'quad', color:     'orange' },
    { type:    'any', weight: 3 },
    { type:   'star', weight: 2 },
    { type:   'rock', weight: 1 },
    { type: 'candle', weight: 4 },
    // { type:    'any', weight: 300 },
    // { type:   'star', weight: 300 },
    // { type:   'rock', weight: 300 },
    // { type: 'candle', weight: 300 },
  ];

  const weights = blocks.map(e => e.weight || 0);
  let circle_indices = null;

  const fb1 = { block_id: 0, pos: [0, 0] };
  const fb2 = { block_id: 0, pos: [0, 0] };
  let rot = 0;

  let speed = 500;
  let keyboard_disabled = false;

  let levelnum = 0;

  //////////////////////////////////////////////
  //           LOGIC                          //
  //////////////////////////////////////////////

  function generate_level() {
    ++levelnum;

    grid.fill(-1);

    for (let i = 0; i < weights.length; ++i)
      weights[i] = blocks[i].weight || 0;

    const circle_min = 3;
    const circle_num = circle_min+Math.min(5,6*Math.min(100,levelnum)/100|0);
    circle_indices = permutate(Array(circle_num).fill().map((_,i) =>i));
    for (let i = 0; i < circle_num; ++i) {
      weights[circle_indices[i]  ] = 100; // circles
      weights[circle_indices[i]+8] = Math.random()*levelnum*0.1|0; // quads
    }

    const min_h = 3;
    const max_height = min_h+((grid_h>>1)-(min_h>>1))*Math.random()*Math.min(1,levelnum/20)|0;
    const junk_num = 1+Math.random()*Math.min(1,levelnum/10)*15|0;
    const quad_num = 3+Math.random()*Math.min(1,levelnum/50)*20|0;
    const mirror = Math.random()*(Math.min(5,levelnum)/5)>0.3;

    for (let i = 0; i < junk_num; ++i) {
      let id = 0;
      if(Math.random()*(Math.min(20,levelnum)/20)<0.5) // is circle
        id = circle_indices[Math.random()*circle_indices.length|0];
      else // star or rock
        id = (Math.random()*(Math.min(30,levelnum)/30)<0.5) ? 17 : 18;
      const x = Math.random()*(mirror ? (grid_w>>1) : grid_w)|0;
      const y = grid_h-1-Math.random()*max_height|0;
      grid[I(x,y)]=id;
    }

    for (let i = 0; i < quad_num; ++i) {
      const x = Math.random()*(mirror ? (grid_w>>1) : grid_w)|0;
      const y = grid_h-1-Math.random()*max_height|0;
      grid[I(x,y)] = 8+circle_indices[Math.random()*circle_indices.length|0];
    }

    if (mirror) {
      for (let y = 0; y < grid_h; ++y)
        for (let x = 0; x < (grid_w>>1); ++x)
          grid[I(grid_w-1-x,y)] = grid[I(x,y)];
    }

    speed = Math.max(200, 502-200*(Math.min(100,(levelnum))/100)|0);
  }

  function permutate(a) {
    for (let i = a.length - 1; i > 0; --i) {
      const k = Math.random() * (1 + i) | 0;
      [a[i], a[k]] = [a[k], a[i]];
    }
    return a;
  }

  function circle(x, y) {
    const r = (grid_sz >> 1) - 1;
    ctx.beginPath();
    ctx.ellipse(x * grid_sz + r,
                y * grid_sz + r,
                r, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw_block(x, y, id) {
    const b = blocks[id];
    if ('circle' === b.type) {
      ctx.fillStyle = b.color;
      circle(x, y);
    } else if ('quad' === b.type) {
      ctx.fillStyle = b.color;
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
    } else if ('any' === b.type) {
      ctx.fillStyle = 'white';
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
      ctx.fillStyle = 'black';
      ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
    } else if ('star' === b.type) {
      ctx.fillStyle = 'white';
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
      ctx.fillStyle = 'black';
      ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
    } else if ('rock' === b.type) {
      ctx.fillStyle = 'white';
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
      ctx.fillStyle = 'black';
      ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
    } else if ('candle' === b.type) {
      ctx.fillStyle = 'white';
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
      ctx.fillStyle = 'black';
      ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
    } else {
      ctx.fillStyle = 'white';
      ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
      ctx.fillStyle = 'black';
      ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
    }
  }

  function get_block_index_by_weight() {
    const weights_sum = weights.reduce((a,c) => a + c, 0);
    let r = Math.random() * weights_sum | 0;
    for (let i = 0; i < weights.length; ++i) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  function reset_fb(fb) {
    fb.pos[0] = (grid_w >> 1) - 1;
    fb.pos[1] = -1;
    fb.block_id = get_block_index_by_weight();
  }

  function reset() {
    fb1.pos[0] = (grid_w >> 1) - 1;
    fb1.pos[1] = -1;
    fb1.block_id = get_block_index_by_weight();
    fb2.pos[0] = (grid_w >> 1) - 0;
    fb2.pos[1] = -1;
    fb2.block_id = get_block_index_by_weight();
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

  function fb_by_left() { return fb1.pos[0] < fb2.pos[0] ? fb1 : fb2; }

  function fb_by_right() { return fb1.pos[0] < fb2.pos[0] ? fb2 : fb1; }

  function fb_by_top() { return fb1.pos[1] < fb2.pos[1] ? fb1 : fb2; }

  function fb_by_bottom() { return fb1.pos[1] < fb2.pos[1] ? fb2 : fb1; }

  function save_pos_rot(fb1, fb2) { return [[...fb1.pos], [...fb2.pos], rot]; }

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
      if (grid[I(pos[0], y)] >= 0) {
        // console.log('b', grid[I(pos[0], y)], blocks[grid[I(pos[0], y)]].type);
        return y - 1;
      }
    // console.log('a');
    return y - 1;
  }

  function set_block(x, y, v) {
    const i = I(x, y);
    if (i >= 0) grid[i] = v;
  }

  function redraw(offx=50, offy=50) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offx, offy);

    ctx.strokeStyle = 'white';
    ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);

    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < grid_w; ++x)
    {
      const block_id = grid[I(x, y)];
      if (block_id === -1) continue;
      draw_block(x, y, block_id);
    }

    draw_block(...fb1.pos, fb1.block_id);
    draw_block(...fb2.pos, fb2.block_id);

    ctx.restore();
  }

  function onkeypress(e) {
    if (keyboard_disabled) return;

    if ('KeyA' === e.code) {
      const dump = save_pos_rot(fb1, fb2);
      fb1.pos[0] -= 1;
      fb2.pos[0] -= 1;
      collide_grid(fb_by_left()) && restore_pos_rot(dump);
    }

    if ('KeyD' === e.code) {
      const dump = save_pos_rot(fb1, fb2);
      fb1.pos[0] += 1;
      fb2.pos[0] += 1;
      collide_grid(fb_by_right()) && restore_pos_rot(dump);
    }

    if ('KeyQ' === e.code) {
      const dump = save_pos_rot(fb1, fb2);
      change_rot(+1);
      collide_grid(fb2) && restore_pos_rot(dump);
    }

    if ('KeyE' === e.code) {
      const dump = save_pos_rot(fb1, fb2);
      const dump_rot = rot;
      change_rot(-1);
      collide_grid(fb2) && restore_pos_rot(dump);
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
      keyboard_disabled = true;
    }

    redraw();
  }

  function animate_strip(pos, top_pos=null) {
    let len = 0;
    let start_y = pos[1];
    const gi = I(pos[0], pos[1]);
    if (gi < 0 || grid[gi] < 0) return;

    // check if any
    if ('any' === blocks[grid[gi]].type) {
      const ngi = I(pos[0], pos[1]+1);
      if (ngi >= 0 && grid[ngi] >= 0) {
        if (grid[ngi] >= 8 && grid[ngi] < 16) {
          grid[gi] = grid[ngi]-8;
        } else {
          grid[gi] = grid[ngi];
        }
      } else {
        grid[gi] = circle_indices[Math.random()*circle_indices.length|0];
      }
    }
    // circle or star
    if ('circle' === blocks[grid[gi]].type || 'star' === blocks[grid[gi]].type) {
      let y = pos[1];
      for (--y; y >= 0; --y) { // перематываем до верха, пока совпадает
        if (grid[I(pos[0], y)] !== grid[gi]) break;
        start_y = y;
      }
      for (++y; y < grid_h; ++y) { // считаем количество совпадений
        if (grid[I(pos[0], y)] !== grid[gi]) break;
        ++len;
      }
      // если это круг, то квадрат под ним считается за круг
      if ('circle' === blocks[grid[gi]].type && grid[I(pos[0], y)] === grid[gi] + 8) {
        ++len;
      }
      // если меньше 4, то стрипа нет.
      if (len < 4) return;
    }
    // quad or rock (do nothing)
    if ('quad' === blocks[grid[gi]].type || 'rock' === blocks[grid[gi]].type) return;
    // анимируем стрип
    let k = 0;
    return new Promise((r) => {
      redraw();
      const iid = setInterval(() => {
        grid[I(pos[0], start_y + k)] = -1;
        ++k;
        redraw();
        if (--len <= 0) {
          // если это анимация нижнего блока и сверху был блок, тогда понижаем блок
          if (null != top_pos) {
            const pgi = I(...top_pos);
            if (pgi >= 0 && grid[pgi] >= 0) {
              grid[I(top_pos[0], find_y_with_block_below(top_pos))] = grid[pgi];
              grid[pgi] = -1;
            }
          }
          clearInterval(iid);
          return r();
        }
      }, speed >> 1);
    });
  }

  async function render() {
    keyboard_disabled = true;
    let _1 = fb1;
    let _2 = fb2;
    let vert = rot === 1 || rot === 3;
    if (vert) {
      _1 = fb_by_bottom();
      _2 = fb_by_top();
    }
    const _1_block_id = _1.block_id;
    const _2_block_id = _2.block_id;
    const _1_pos = [..._1.pos];
    const _2_pos = [..._2.pos];
    _1.pos[1] += 1;
    _2.pos[1] += 1;
    const is__1_collided = collide_grid(_1);
    const is__2_collided = collide_grid(_2);
    if (is__1_collided || is__2_collided) {

      reset();

      // game over
      if (_1_pos[1] < 0 && _2_pos[1] < 0) {
        console.log('game over');
        return;
      }

      if (!is__1_collided) { // bottom not collided
        _1_pos[1] = find_y_with_block_below(_1_pos);
      }
      if ('candle' === blocks[_1_block_id].type) { // bottom is candle
        const ngi = I(_1_pos[0], _1_pos[1]+1);
        if (ngi >= 0 && !(grid[ngi] >= 8 && grid[ngi] < 16))
          grid[ngi] = -1;
      } else { // not a candle
        grid[I(..._1_pos)] = _1_block_id;
      }

      if (!is__2_collided) { // bottom not collided
        _2_pos[1] = find_y_with_block_below(_2_pos);
      }
      if ('candle' === blocks[_2_block_id].type) { // bottom is candle
        const ngi = I(_2_pos[0], _2_pos[1]+1);
        if (ngi >= 0 && !(grid[ngi] >= 8 && grid[ngi] < 16))
          grid[ngi] = -1;
      } else { // not a candle
        grid[I(..._2_pos)] = _2_block_id;
      }

      await animate_strip(_2_pos);
      await animate_strip(_1_pos, vert ? _2_pos : null);
    }

    redraw();
    keyboard_disabled = false;
    setTimeout(render, speed);
  }


  // for (let y = 0; y < 10; ++y) for (let x = 0; x < 10; ++x) {
  //   generate_level();
  //   redraw(x*grid_w*grid_sz, y*grid_h*grid_sz);
  // }

  generate_level();
  reset();
  addEventListener('keypress', onkeypress);
  render();
}
