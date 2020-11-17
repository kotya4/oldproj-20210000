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

  const grid_sz = 10;
  const grid_w = 12;
  const grid_h = 10;
  const grid = Array(grid_w * grid_h).fill(-1);
  const I = (x,y) =>
    (x < 0 || x >= grid_w || y < 0 || y >= grid_h) ? -1 : x + y * grid_w;

  const LEN = 2;

  function is_strip(x, y) {
    const val = grid[I(x, y)];
    const len = LEN;
    let is_strip = true;
    for (let k = 0; k < len; ++k) {
      const gi = I(x, y + k + 1);
      if (gi === -1 || grid[gi] !== val) return;
    }
    return is_strip;
  }

  function circle(ctx, x, y, r) {
    // ctx.fillRect(this.pos[0] * grid_sz + 1,
    //              this.pos[1] * grid_sz + 1,
    //              grid_sz - 2, grid_sz - 2);
    ctx.beginPath();
    ctx.ellipse(x * grid_sz + r,
                y * grid_sz + r,
                r, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const blocks = [
    { color: 'red' },
    { color: 'green' },
  ].map((e, id) => ({ ...e, id }));

  const falling_blocks = [];

  class FallingBlock {
    constructor(default_pos, default_rot) {
      this.pos = [0, 0];
      this.default_pos = default_pos;
      this.default_rot = default_rot;
      this.reset();
    }

    reset() {
      this.ready_to_move = false;
      this.block = blocks[Math.random() * blocks.length | 0];
      this.pos[0] = this.default_pos[0];
      this.pos[1] = this.default_pos[1];
      this.rot = this.default_rot;
    }

    move(dx, dy, neighbour=null) {
      if (!this.ready_to_move) return;
      // grid check
      const gi = I(this.pos[0] + dx, this.pos[1] + dy);
      if (gi < 0 || grid[gi] !== -1) return;
      // fb check
      if (neighbour) {
        if (neighbour.pos[0] === this.pos[0] + dx
        &&  neighbour.pos[1] === this.pos[1] + dy)
        {
          return;
        }
      }
      // move
      this.pos[0] += dx;
      this.pos[1] += dy;
    }
  }

  falling_blocks.push(new FallingBlock([(grid_w >> 1) - 1, -1], -1));
  falling_blocks.push(new FallingBlock([(grid_w >> 1)    , -1], 2));

  function redraw(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(50, 50);
    // cage
    ctx.strokeStyle = 'white';
    ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);
    // grid
    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < grid_w; ++x)
    {
      const gv = grid[I(x, y)];
      if (gv === -1) continue;
      ctx.fillStyle = blocks[gv].color;
      // ctx.fillRect(x * grid_sz, y * grid_sz, grid_sz, grid_sz);
      circle(ctx, x, y, (grid_sz >> 1) - 1);
    }
    // player
    ctx.fillStyle = falling_blocks[0].block.color;
    circle(ctx, ...falling_blocks[0].pos, (grid_sz >> 1) - 1);
    ctx.fillStyle = falling_blocks[1].block.color;
    circle(ctx, ...falling_blocks[1].pos, (grid_sz >> 1) - 1);
    // flush
    ctx.restore();
  }

  function onkeypress(e) {
    if ('KeyA' === e.code) {
      const sorted = falling_blocks.sort((a,b) => a.pos[0] - b.pos[0]);
      for (let i = 0; i < sorted.length; ++i) {
        sorted[i].move(-1, 0, i > 0 ? sorted[i - 1] : null);
      }
    }

    if ('KeyD' === e.code) {
      const sorted = falling_blocks.sort((b,a) => a.pos[0] - b.pos[0]);
      for (let i = 0; i < sorted.length; ++i) {
        sorted[i].move(+1, 0, i > 0 ? sorted[i - 1] : null);
      }
    }

    if ('KeyW' === e.code) {





    }

    redraw(ctx);
  }

  async function proc() {
    let noone_moves = true;

    for (let fb of falling_blocks) {

      if (false === fb.ready_to_move) continue;
      noone_moves = false;

      const [x, y] = fb.pos;
      const curr_i = I(x, y);
      const next_i = I(x, y + 1);

      if (next_i === -1 || grid[next_i] !== -1) {
        removeEventListener('keypress', onkeypress);
        grid[curr_i] = fb.block.id;
        fb.reset();

        if (is_strip(x, y)) {

          // animate success strip
          const len = LEN;
          let k = 0;

          await new Promise((r) => {
            redraw(ctx);
            const iid = setInterval(() => {
              grid[I(x, y + k)] = -1;
              redraw(ctx);
              ++k;
              if (k > len) {
                clearInterval(iid);
                return r();
              }
            }, 100);
          });

        } else {

          if (x === fb.default_pos[0] && y === fb.default_pos[1] + 1) {

            console.log('game over');

          }

        }

        addEventListener('keypress', onkeypress);
      } else {



        fb.move(0, 1);



      }
    }

    if (noone_moves) {

      falling_blocks.forEach(e => e.ready_to_move = true);

    }

    redraw(ctx);

    setTimeout(proc, 500);
  }

  addEventListener('keypress', onkeypress);
  proc();
}
