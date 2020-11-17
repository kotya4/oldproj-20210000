window.onload = async function onload() {
  let last_log = 'print_last_log active.';
  function print_last_log(log) {
    if (last_log === log) return;
    last_log = log;
    console.log(last_log);
  }

  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  function clear(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
  }

  const grid_sz = 10;

  const grid_w = 11;
  const grid_h = 10;
  const grid = Array(grid_w * grid_h).fill(-1);
  const I = (x,y) => (x < 0 || x >= grid_w || y < 0 || y >= grid_h) ? -1 : x + y * grid_w;

  const start_point = [grid_w >> 1, -1];

  async function strip(x, y, block) {
    const curr_value = grid[I(x, y)];

    const len = 3;

    let is_strip = true;

    for (let k = 0; k < len; ++k) {
      const gi = I(x, y + k + 1);
      if (gi === -1 || grid[gi] !== curr_value) {
        is_strip = false;
        break;
      }
    }

    if (is_strip) {
      let k = 0;
      await new Promise((r) => {
        redraw(ctx);
        const iid = setInterval(() => {
          grid[I(x, y + k)] = -1;
          redraw(ctx);
          ++k;
          if (k >= len + 1) {
            clearInterval(iid);
            r();
            return;
          }
        }, 100);
      });
    } else if (x === start_point[0] && y === start_point[1] + 1) {
      return false;
    }

    return true;
  }

  const blocks = [
    { color: 'red' },
    { color: 'green' },
    // пролетает сквозь все блоки
    // взрывает блоки рядом
    // горизонтальные блоки
    // меняется местами с блоком снизу
    // создает рядом с собой блоки

  ].map((e, id) => ({ ...e, id }));

  var something = {
    pos: [0, -1],
    block: null,

    draw(ctx) {
      ctx.fillStyle = this.block.color;
      ctx.fillRect(this.pos[0] * grid_sz + 1, this.pos[1] * grid_sz + 1, grid_sz - 2, grid_sz - 2);
    },

    reset() {
      this.block = blocks[Math.random() * blocks.length | 0];
      this.pos[0] = start_point[0];
      this.pos[1] = start_point[1];
    },

    move(dx=0, dy=0) {
      if (grid[I(this.pos[0] + dx, this.pos[1] + dy)] !== -1) return;
      this.pos[0] += dx;
      this.pos[1] += dy;
    },

    async check() {
      const [x, y] = this.pos;
      const curr_i = I(x, y);
      const next_i = I(x, y + 1);
      if (next_i === -1) {
        grid[curr_i] = this.block.id;
        this.reset();
      } else if (grid[next_i] !== -1) {
        grid[curr_i] = this.block.id;
        this.reset();
        stop_moving();
        if (await strip(x, y)) {
          start_moving();
        } else {
          console.log('game over');
        }
      }
    },

  };

  function redraw(ctx) {
    clear(ctx);

    ctx.save();
    ctx.translate(50, 50);

    ctx.strokeStyle = 'white';
    ctx.strokeRect(-1, -1, grid_w*grid_sz+2, grid_h*grid_sz+2);

    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < grid_w; ++x)
    {
      const gv = grid[I(x, y)];
      if (gv === -1) continue;
      ctx.fillStyle = blocks[gv].color;
      ctx.fillRect(x * grid_sz, y * grid_sz, grid_sz, grid_sz);
    }

    something.draw(ctx);

    ctx.restore();
  }

  function onkeypress(e) {
    if ('KeyA' === e.code) something.move(-1, 0);
    if ('KeyD' === e.code) something.move(+1, 0);
    if ('KeyS' === e.code) something.move(0, +1);
    redraw(ctx);
  }

  let moving_iid = null;

  function start_moving() {
    if (null != moving_iid) return;
    addEventListener('keypress', onkeypress);
    moving_iid = setInterval(async () => {
      await something.check();
      something.move(0, 1);
      redraw(ctx);
    }, 500);
  }

  function stop_moving() {
    if (null == moving_iid) return;
    removeEventListener('keypress', onkeypress);
    clearInterval(moving_iid);
    moving_iid = null;
  }

  something.reset();
  start_moving();
}
