const width = 640;
const height = 480;
const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.height = height;
ctx.canvas.width = width;

const grid_sz = 28;
const grid_w = 18;
const grid_h = 15;
const grid = Array(grid_w * grid_h).fill(-1);
const I = (x, y) => (x < 0 || x >= grid_w || y < 0 || y >= grid_h) ? -1 : x + y * grid_w;

const circles_blocks = [
  { type: 'circle', color:        'red', hsl_arr: [ 10, 67, 58] },
  { type: 'circle', color:       'blue', hsl_arr: [234, 67, 58] },
  { type: 'circle', color:      'green', hsl_arr: [131, 67, 58] },
  { type: 'circle', color:     'yellow', hsl_arr: [ 53, 67, 58] },
  { type: 'circle', color:       'pink', hsl_arr: [332, 67, 58] },
  { type: 'circle', color:    'magenta', hsl_arr: [283, 67, 58] },
  { type: 'circle', color: 'lightgreen', hsl_arr: [ 73, 67, 58] },
  { type: 'circle', color:     'orange', hsl_arr: [ 35, 67, 58] },
];

const blocks = [
  ...circles_blocks,
  ...circles_blocks.map(e => ({ ...e, type: 'quad' })),
  { type:    'any', weight: 3*2 },
  { type:   'star', weight: 2*2 },
  { type:   'rock', weight: 1*2 },
  { type: 'candle', weight: 4*2 },
];
const blocks_circle_offset = circles_blocks.length;

const weights = blocks.map(e => e.weight || 0);
let circle_indices = null;

const fb1 = { block_id: 0, pos: [0, 0] };
const fb2 = { block_id: 0, pos: [0, 0] };
let rot = 0;

let speed = 500;
let keyboard_disabled = false;

let levelnum = 0;
let quads_cur_num = 0;

// must be loaded from localStorage
let levels_seeds_table = null;
let current_level_index = null;
let current_score = 0;
let game_score = 0; // flush every game
let is_sound = true;
let is_music = true;

// levels page constants
const levels_on_row = 5;
const levels_on_col = 3;
const levelscreen_w = 105;
const levelscreen_h = 90;
const levelscreen_offset_x = 15;
const levelscreen_offset_y = 15;
const levelscreen_start_x = 25;
const levelscreen_start_y = 90;
const levels_clickables = [];

// buttons
let button_go;
let button_prev;
let button_next;
let button_regen;
let button_sound;
let button_music;
let button_pause;
let button_close;

// mp3
const mp3_click_0 = new Audio('www_bubbles/mp3/click_0.mp3');
const mp3_click_1 = new Audio('www_bubbles/mp3/click_1.mp3');
const mp3_bubble_0 = new Audio('www_bubbles/mp3/bubble_0.mp3');
const mp3_bubble_1 = new Audio('www_bubbles/mp3/bubble_1.mp3');
const mp3_loser_0 = new Audio('www_bubbles/mp3/loser_0.mp3');
const mp3_stone_0 = new Audio('www_bubbles/mp3/stone_0.mp3');
const mp3_stone_1 = new Audio('www_bubbles/mp3/stone_1.mp3');
const mp3_pop_0 = new Audio('www_bubbles/mp3/pop_0.mp3');
const mp3_pop_1 = new Audio('www_bubbles/mp3/pop_1.mp3');
const mp3_water_0 = new Audio('www_bubbles/mp3/water_0.mp3');
const mp3_candle_0 = new Audio('www_bubbles/mp3/candle_0.mp3');
const mp3_happy_0 = new Audio('www_bubbles/mp3/happy_0.mp3');
const mp3_win_0 = new Audio('www_bubbles/mp3/win_0.mp3');
const sounds = [
  mp3_click_0,
  mp3_click_1,
  mp3_bubble_0,
  mp3_bubble_1,
  mp3_loser_0,
  mp3_stone_0,
  mp3_stone_1,
  mp3_pop_0,
  mp3_pop_1,
  mp3_water_0,
  mp3_candle_0,
  mp3_happy_0,
  mp3_win_0,
];

// beeth
const mp3_beeth = new Audio('www_bubbles/beeth/beeth.mp3');
// mp3_beeth.addEventListener('canplaythrough', () => console.log('beeth ready'));
mp3_beeth.loop = true;

let beeth_volume_iid = null;
let beeth_max_volume = 0.5;
const beeth_volume_delay = 100;
const beeth_volume_inc = 0.01;

// png
const png_stone = new Image(); png_stone.src = 'www_bubbles/png/stone.png';
const png_any = new Image(); png_any.src = 'www_bubbles/png/any.png';
const png_sun = new Image(); png_sun.src = 'www_bubbles/png/sun.png';
const png_candle = new Image(); png_candle.src = 'www_bubbles/png/candle.png';

const grid_center = [grid_w/2*grid_sz, grid_h/2*grid_sz];
const block3d_pb = Array(4).fill().map(_ => [0, 0]); // buffers
const block3d_po = Array(4).fill().map(_ => [0, 0]);
const block3d_dz = 0.05; // distortion

let is_paused = false;
let is_close = false;
let is_gamelooping = false;
let is_regen = false;
let times_failed = 0;

//////////////////////////////////////////////
//           LOGIC                          //
//////////////////////////////////////////////


function main() {
  document.body.appendChild(ctx.canvas);

  // load from localStorage or init new game
  const savegame = JSON.parse(window.localStorage.getItem('bubbles__savegame') || '{}');
  levels_seeds_table = savegame.levels_seeds_table || [Math.random()];
  current_level_index = levels_seeds_table.length-1; //savegame.current_level_index || 0;
  current_score = savegame.current_score || 0;
  is_sound = savegame.is_sound || true;
  is_music = savegame.is_music || true;

  // define clickables (reusing them on each page drawing)
  define_levelpage_clickables();

  define_button_go();
  define_other_buttons();

  intro().then(() => {
    draw_levelpage();
  });

}


function generate_level(levelnum, seed) {
  // if (null == seed) seed = Math.random();
  if (null == seed) throw Error('LEVELSEED NOT DEFINED');
  const myrng = new Math.seedrandom(seed);

  grid.fill(-1);

  for (let i = 0; i < weights.length; ++i) weights[i] = blocks[i].weight || 0;
  if (levelnum > 10 && (levelnum+1) % 12 === 0 || (myrng()*1000|0)===0) {
    weights[blocks.findIndex(e => e.type==='star')]=100;
    // console.log('stars fall');
  }
  else if (levelnum > 10 && (levelnum+1) % 7 === 0 || (myrng()*1000|0)===0) {
    blocks.forEach((e,i) => e.type!=='circle'&&e.type!=='quad'&&(weights[i]=200));
    // console.log('nishtyaks fall');
  }

  const circle_min = 3;
  const circle_num = circle_min+Math.min(5,6*Math.min(100,levelnum)/100|0);
  circle_indices = permutate(Array(circle_num).fill().map((_,i) =>i), myrng);
  for (let i = 0; i < circle_num; ++i) {
    weights[circle_indices[i]  ] = 100; // circles
    // weights[circle_indices[i]+8] = myrng()*levelnum*0.1|0; // quads
  }

  const min_h = 3;
  const max_height = min_h+((grid_h>>1)-(min_h>>1))*myrng()*Math.min(1,levelnum/20)|0;
  const junk_num = 1+myrng()*Math.min(1,levelnum/10)*15|0;
  const quad_num = 3+myrng()*Math.min(1,levelnum/50)*20|0;
  const mirror = myrng()*(Math.min(5,levelnum)/5)>0.3;

  for (let i = 0; i < junk_num; ++i) {
    let id = 0;
    if(myrng()*(Math.min(20,levelnum)/20)<0.5) // is circle
      id = circle_indices[myrng()*circle_indices.length|0];
    else // star or rock
      id = (myrng()*(Math.min(30,levelnum)/30)<0.5) ? 17 : 18;
    const x = myrng()*(mirror ? (grid_w>>1) : grid_w)|0;
    const y = grid_h-1-myrng()*max_height|0;
    grid[I(x,y)]=id;
  }

  for (let i = 0; i < quad_num; ++i) {
    const x = myrng()*(mirror ? (grid_w>>1) : grid_w)|0;
    const y = grid_h-1-myrng()*max_height|0;
    grid[I(x,y)] = 8+circle_indices[myrng()*circle_indices.length|0];
  }

  if (mirror) {
    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < (grid_w>>1); ++x)
        grid[I(grid_w-1-x,y)] = grid[I(x,y)];
  }

  //speed = Math.max(200, 502-200*(Math.min(100,(levelnum))/100)|0);
  speed = 350+(1-(current_level_index%(levels_on_row*levels_on_col))/(levels_on_row*levels_on_col))*340|0;

  // calcs blocks number (will be decreasing in animate_strip and checking if zero in gameloop).
  // quad_num is not actual quads num because we are mirroring grid.
  quads_cur_num = 0;
  for (let i = 0; i < grid.length; ++i)
    if (grid[i] >= 0 && blocks[grid[i]].type === 'quad')
      ++quads_cur_num;

  return seed;
}


function permutate(a, myrng) {
  if (null == myrng) myrng = Math.random;
  for (let i = a.length - 1; i > 0; --i) {
    const k = myrng() * (1 + i) | 0;
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
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


function reset_fb_and_rot() {
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


function collide_grid_any() {
  return collide_grid(fb1) || collide_grid(fb2);
}


function fb_by_left() { return fb1.pos[0] < fb2.pos[0] ? fb1 : fb2; }


function fb_by_right() { return fb1.pos[0] < fb2.pos[0] ? fb2 : fb1; }


function fb_by_top() { return fb1.pos[1] < fb2.pos[1] ? fb1 : fb2; }


function fb_by_bottom() { return fb1.pos[1] < fb2.pos[1] ? fb2 : fb1; }


function save_pos_rot() { return [[...fb1.pos], [...fb2.pos], rot]; }


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


function gameloop_onkeypress(e) {
  if (keyboard_disabled) return;

  if ('KeyA' === e.code) {
    const dump = save_pos_rot(fb1, fb2);
    fb1.pos[0] -= 1;
    fb2.pos[0] -= 1;
    if (collide_grid_any(fb_by_left())) {
      restore_pos_rot(dump);
    } else {
      mp3_pop_0.play();
    }
  }

  if ('KeyD' === e.code) {
    const dump = save_pos_rot(fb1, fb2);
    fb1.pos[0] += 1;
    fb2.pos[0] += 1;
    // TODO: collide_grid_any grabs no argument, so calling fb_by_* must be deprecated.
    if (collide_grid_any(fb_by_right())) {
      restore_pos_rot(dump);
    } else {
      mp3_pop_0.play();
    }
  }

  if ('KeyQ' === e.code) {
    const dump = save_pos_rot(fb1, fb2);
    change_rot(+1);
    if (collide_grid_any(fb2)) {
      restore_pos_rot(dump);
    } else {
      mp3_pop_1.play();
    }
  }

  if ('KeyE' === e.code) {
    const dump = save_pos_rot(fb1, fb2);
    const dump_rot = rot;
    change_rot(-1);
    if (collide_grid_any(fb2)) {
      restore_pos_rot(dump);
    } else {
      mp3_pop_1.play();
    }
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
    mp3_pop_0.play();
  }

  redraw(ctx);
}


function animate_strip(pos, top_pos=null) {
  let len = 0;
  let start_y = pos[1];
  const gi = I(pos[0], pos[1]);
  if (gi < 0 || grid[gi] < 0) return;
  if ('candle' === blocks[grid[gi]].type) return;
  let score_type=1;
  // check if any
  if ('any' === blocks[grid[gi]].type) {
    for (let t = 1; t < grid_h; ++t) {
      const ngi = I(pos[0], pos[1]+t);
      if (ngi >= 0 && grid[ngi] >= 0) {
        if        ('quad' === blocks[grid[ngi]].type) {
          grid[gi] = grid[ngi]-blocks_circle_offset;
        } else if ('any'  === blocks[grid[ngi]].type) {
          continue;
        }
        else {
          grid[gi] = grid[ngi];
        }
      } else {
        grid[gi] = circle_indices[Math.random()*circle_indices.length|0];
      }
      break;
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
    if ('circle' === blocks[grid[gi]].type && grid[I(pos[0], y)] === grid[gi] + blocks_circle_offset) {
      ++len;
      score_type=1.5;
    }
    // если меньше 4, то стрипа нет.
    if (len < 4) return;
  }
  // quad or rock (do nothing)
  if ('quad' === blocks[grid[gi]].type || 'rock' === blocks[grid[gi]].type) return;
  const is_star = ('star' === blocks[grid[gi]].type);
  if (is_star) score_type = 3;
  // анимируем стрип
  let k = 0;
  const score_mod = (current_level_index>0?(1+current_level_index)**0.5:1)*(1+current_level_index/(levels_on_row*levels_on_col)|0);
  return new Promise((r) => {
    redraw(ctx);
    const iid = setInterval(() => {
      const gi = I(pos[0], start_y + k);
      if (gi >= 0 && blocks[grid[gi]].type === 'quad') --quads_cur_num;
      grid[gi] = -1;
      ++k;
      game_score += score_type*score_mod;
      redraw(ctx);
      if (--len <= 0) {
        if (is_star) {
          mp3_happy_0.play();
        } else {
          mp3_bubble_1.play();
        }
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
      } else {
        mp3_bubble_0.play();
      }
    }, speed >> 1);
  });
}


//////////////////////////////////////////////
//           LOOPS                          //
//////////////////////////////////////////////


// resolve_cb has to be called with certain argument before stopping the loop:
// * after completing the level -- with argument 0 (an integer);
// * after failing the level -- with argument 1 (an integer).
async function gameloop(resolve_cb) {
  if (is_regen) {
    is_regen = false;
    removeEventListener('keypress', gameloop_onkeypress);
    resolve_cb(3);
    return;
  }
  if (is_close) {
    is_close = false;
    removeEventListener('keypress', gameloop_onkeypress);
    resolve_cb(2);
    return;
  }
  keyboard_disabled = true;
  if (is_paused) {
    ctx.save();
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    ctx.font = '30px monospace';
    ctx.fillStyle = 'lightgrey';
    ctx.strokeStyle = 'hotpink';
    ctx.strokeText('ПАУЗА', width/2, height/2-15);
    ctx.fillText('ПАУЗА', width/2, height/2-15);
    ctx.restore();
  } else {
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
      reset_fb_and_rot();

      // game over
      if (_1_pos[1] < 0 && _2_pos[1] < 0) {
        removeEventListener('keypress', gameloop_onkeypress);
        resolve_cb(1);
        return;
      }

      // sound
      if      ('candle' === blocks[_1_block_id].type)                                          mp3_candle_0.play();
      else if ('rock'   === blocks[_1_block_id].type || 'rock'   === blocks[_2_block_id].type) mp3_stone_1.play();
      else if ('any'    === blocks[_1_block_id].type || 'any'    === blocks[_2_block_id].type) mp3_water_0.play();
      else                                                                                     mp3_stone_0.play();

      if (!is__1_collided) { // bottom not collided
        _1_pos[1] = find_y_with_block_below(_1_pos);
      }
      if ('candle' === blocks[_1_block_id].type) { // bottom is candle
        const ngi = I(_1_pos[0], _1_pos[1]+1);
        // if (ngi >= 0 && !(grid[ngi] >= 8 && grid[ngi] < 16)) {
        if (ngi >= 0 && 'quad' !== blocks[grid[ngi]].type) {
          grid[ngi] = -1;
        }
      } else { // not a candle
        grid[I(..._1_pos)] = _1_block_id;
      }

      if (!is__2_collided) { // top not collided
        _2_pos[1] = find_y_with_block_below(_2_pos);
      }
      if ('candle' === blocks[_2_block_id].type) { // top is candle
        // console.log('candle in top');
        // const ngi = I(_2_pos[0], _2_pos[1]+1);
        // // if (ngi >= 0 && !(grid[ngi] >= 8 && grid[ngi] < 16)) {
        // if (ngi >= 0 && 'quad' !== blocks[grid[ngi]].type) {
        //   grid[ngi] = -1;
        // }
      } else { // not a candle
        grid[I(..._2_pos)] = _2_block_id;
      }

      // if ('any' === blocks[_1_block_id].type && 'any' === blocks[_2_block_id].type)

      await animate_strip(_2_pos);
      await animate_strip(_1_pos, vert ? _2_pos : null);

      // candle must
      if ('candle' === blocks[_2_block_id].type) { // top is candle
        mp3_candle_0.play();
        for (let t = 1; t < grid_h; ++t) {
          const ngi = I(_2_pos[0], _2_pos[1]+t);
          if (ngi >= 0 && ngi < grid.length) {
            if (grid[ngi] !== -1) {
              if ('quad' !== blocks[grid[ngi]].type) {
                grid[ngi] = -1;
                break;
              }
            }
          }
        }
      }

      // level completed
      if (quads_cur_num <= 0) {
        removeEventListener('keypress', gameloop_onkeypress);
        resolve_cb(0);
        return;
      }
    }

    redraw(ctx);
    keyboard_disabled = false;
  }

  setTimeout(() => gameloop(resolve_cb), speed);
}


//////////////////////////////////////////////
//           GRAPHICS                       //
//////////////////////////////////////////////


// deprecated
function redraw__deprecated(ctx, offx=50, offy=50) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.translate(offx, offy);

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);

  for (let y = 0; y < grid_h; ++y)
    for (let x = 0; x < grid_w; ++x)
  {
    const block_id = grid[I(x, y)];
    if (block_id === -1) continue;
    draw_block(ctx, x, y, block_id);
  }

  draw_block(ctx, ...fb1.pos, fb1.block_id);
  draw_block(ctx, ...fb2.pos, fb2.block_id);

  ctx.restore();
}


// do not change "draw_block", edit "draw_block_new" instead
function draw_block(ctx, x, y, id) {
  const b = blocks[id];
  if ('circle' === b.type) {
    ctx.fillStyle = b.color;
    const r = (grid_sz >> 1) - 1;
    ctx.beginPath();
    ctx.ellipse(x * grid_sz + r, y * grid_sz + r, r, r, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if ('quad' === b.type) {
    ctx.fillStyle = b.color;
    ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
  } else if ('any' === b.type) {
    draw_sprite([x, y], png_any);
  } else if ('star' === b.type) {
    draw_sprite([x, y], png_sun);
  } else if ('rock' === b.type) {
    draw_sprite([x, y], png_stone);
  } else if ('candle' === b.type) {
    draw_sprite([x, y], png_candle);
  } else {
    ctx.fillStyle = 'white';
    ctx.fillRect(x*grid_sz, y*grid_sz, grid_sz, grid_sz);
    ctx.fillStyle = 'black';
    ctx.font = '12px monospace';
    ctx.fillText(b.type, x*grid_sz, y*grid_sz+grid_sz/2);
  }
}


//////////////////////////////////////////////
//           LEVELPAGE                      //
//////////////////////////////////////////////


function define_levelpage_clickables() {
  for (let y = 0; y < levels_on_col; ++y)
    for (let x = 0; x < levels_on_row; ++x)
  {
    const clx = levelscreen_start_x + x * (levelscreen_w + levelscreen_offset_x);
    const cly = levelscreen_start_y + y * (levelscreen_h + levelscreen_offset_y);
    const clickable = new Clickable(ctx.canvas, clx, cly, levelscreen_w, levelscreen_h);
    const line_width = 4;

    clickable.onenter = () => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'grey';
      ctx.strokeRect(clx-line_width/2, cly-line_width/2, levelscreen_w+line_width, levelscreen_h+line_width);
      if (clickable.seed) {
        // seed blank
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, 13);
        // seed
        const textalign = ctx.textAlign;
        ctx.font = '12px monospace';
        ctx.fillStyle = 'darkgrey';
        ctx.textAlign = 'right'
        ctx.fillText(clickable.seed, width - 5, 12);
        ctx.textAlign = textalign;
      }
    };

    clickable.onleave = () => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.strokeRect(clx-line_width/2, cly-line_width/2, levelscreen_w+line_width, levelscreen_h+line_width);
      // seed blank
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, 13);
    };

    levels_clickables.push(clickable);
  }
}


function draw_levelscreen(ctx, x, y, sw, sh, is_active) {
  ctx.fillStyle = 'rgb(50,50,50)';
  ctx.fillRect(x, y, sw, sh);
  ctx.save();

  if (is_active) {
    const sx = sw / (grid_sz*grid_w); // scaler
    const sy = sh / (grid_sz*grid_h);

    ctx.translate(x, y);
    ctx.scale(sx, sy);

    for (let y_ = 0; y_ < grid_h; ++y_)
      for (let x_ = 0; x_ < grid_w; ++x_)
    {
      const block_id = grid[I(x_, y_)];
      if (block_id === -1) continue;
      draw_block(ctx, x_, y_, block_id);
    }

    ctx.restore();
  } else {
    ctx.fillStyle = 'rgb(20, 20, 20)';
    ctx.fillRect(x, y, sw, sh);
  }
}


function prepare_level_and_run(level_index, force_regen=false) {
  current_level_index = level_index;
  // create new seed only if no seed in table yet
  if (null == levels_seeds_table[level_index] || force_regen)
    levels_seeds_table[level_index] = Math.random();

  // save current_level_index and levels_seeds_table to localstorage
  window.localStorage.setItem('bubbles__savegame', JSON.stringify({ levels_seeds_table, current_level_index, current_score, is_music, is_sound }));

  // generate certain level (again)
  generate_level(level_index, levels_seeds_table[level_index]);

  reset_fb_and_rot();

  game_score = 0;

  // draw level
  redraw(ctx);

  // activate level with button
  button_go.draw();
  button_prev.disable();
  button_next.disable();
}


function draw_levelpage(_level_index) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = 'yellow';
  ctx.font = '12px monospace';
  ctx.fillText(`очки: ${current_score+game_score|0}`, 10, height - 5);

  ctx.fillStyle = 'white';
  ctx.font = '20px monospace';
  ctx.fillText('Выбор уровня', 255, 50);

  const sz = levels_on_row*levels_on_col;
  let level_index = ((_level_index||current_level_index)/sz|0)*sz;
  let clickables_index = 0;
  for (let y = 0; y < levels_on_col; ++y)
    for (let x = 0; x < levels_on_row; ++x)
  {
    const clx = levelscreen_start_x + x * (levelscreen_w + levelscreen_offset_x);
    const cly = levelscreen_start_y + y * (levelscreen_h + levelscreen_offset_y);
    const clickable = levels_clickables[clickables_index];
    const clickable_level_index = level_index;
    const is_level_active = level_index < levels_seeds_table.length;

    if (is_level_active) {
      clickable.enable();
      // generate level with seed
      generate_level(level_index, levels_seeds_table[level_index]);

      clickable.seed = `${level_index}+${levels_seeds_table[level_index]}`;

      // redefine clickable controls
      clickable.onrelease = () => {
        // disable clickables
        levels_clickables.forEach(e => e.disable());
        // run the game
        prepare_level_and_run(clickable_level_index);
      };

      // enable clickable
      clickable.enable();
    } else {
      clickable.seed = null;
      clickable.disable();
    }

    // draw levelscreen
    draw_levelscreen(ctx, clx, cly, levelscreen_w, levelscreen_h, is_level_active);

    ctx.fillStyle = 'grey';
    ctx.font = '12px monospace';
    ctx.fillText(`${level_index+1}`, clx, cly+10);

    // next level index
    ++level_index;
    // next clickable
    ++clickables_index;
  }

  button_go.disable();
  button_prev.draw();
  button_next.draw();
  button_sound.draw();
  button_music.draw();
  button_pause.disable();
  button_close.disable();
  button_regen.disable();
}


function define_button_go() {
  const w = 26;
  const h = 18;
  const x = (width  - w) >> 1;
  const y = (height - h) >> 1;

  function draw_button_1(cl, text, bkg_color, txt_color) {
    const font = 14;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = bkg_color;
    ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
    ctx.fillStyle = txt_color;
    ctx.font = `${font}px monospace`;
    ctx.fillText(text, cl.x + cl.w/2, cl.y + cl.h/2 + font/2-4);
    ctx.restore();
  }

  button_go = new Clickable(ctx.canvas, x, y, w, h);

  button_go.onleave = () => {
    draw_button_1(button_go, 'go', 'green', 'yellow');
  };

  button_go.onenter = () => {
    draw_button_1(button_go, 'go', 'lightgreen', 'white');
  };

  button_go.onpress = () => {
    draw_button_1(button_go, 'go', 'darkgreen', 'orange');
  };

  button_go.onrelease = () => {
    window.removeEventListener('keypress', button_go.onpress);
    window.removeEventListener('keyup', button_go.onrelease);
    button_go.disable();

    // activate beeth
    mp3_beeth.currentTime = Math.random() * mp3_beeth.duration;
    mp3_beeth.volume = 0;
    if (null != beeth_volume_iid) clearInterval(beeth_volume_iid);
    beeth_volume_iid = setInterval(() => {
      if (!is_music) {
        mp3_beeth.volume = 0;
        clearInterval(beeth_volume_iid);
        beeth_volume_iid = null;
        return;
      }
      if (mp3_beeth.volume + beeth_volume_inc >= beeth_max_volume
      ||  mp3_beeth.volume + beeth_volume_inc >= 1)
      {
        clearInterval(beeth_volume_iid);
        beeth_volume_iid = null;
        return;
      }
      mp3_beeth.volume += beeth_volume_inc;
    }, beeth_volume_delay);
    mp3_beeth.play();

    is_gamelooping = true;
    // activate game (removeEventListener will be called in gameloop)
    window.addEventListener('keypress', gameloop_onkeypress);
    (new Promise(r => gameloop(r))).then(status => {
      is_gamelooping = false;
      if (beeth_volume_iid != null) clearInterval(beeth_volume_iid);
      mp3_beeth.volume = 0;
      // status is 1 if you lose
      if (status > 0) {
        if (status === 1) {
          mp3_loser_0.play();
          ++times_failed;
          // draw loser scene
          ctx.font = '60px monospace';
          ctx.strokeStyle = 'lightgrey';
          ctx.lineWidth = 5;
          ctx.strokeText('Конец игры', 150, 200);
          ctx.fillStyle = 'hotpink';
          ctx.fillText('Конец игры', 150, 200);

          const run_levelpage_on_buttonup = () => {
            window.removeEventListener('mouseup', run_levelpage_on_buttonup);
            window.removeEventListener('keyup', run_levelpage_on_buttonup);
            draw_levelpage();
          };
          window.addEventListener('mouseup', run_levelpage_on_buttonup);
          window.addEventListener('keyup', run_levelpage_on_buttonup);
        } else if (status === 2) {
          draw_levelpage();
        } else if (status === 3) {
          prepare_level_and_run(current_level_index, true);
        } else {
          console.log(status, 'error');
        }
      } else {
        times_failed = 0;
        mp3_win_0.play();
        current_score += game_score;
        prepare_level_and_run(++current_level_index);
      }
    });
  };

  button_go.draw = () => {
    button_go.enable();
    button_go.onleave();
    window.addEventListener('keypress', button_go.onpress);
    window.addEventListener('keyup', button_go.onrelease);
  };
}


function define_other_buttons() {
  function draw_button_1(cl, text, bkg_color, txt_color) {
    const font = 14;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = bkg_color;
    ctx.beginPath();
    ctx.ellipse(cl.x+cl.w/2, cl.y+cl.h/2, cl.w/2, cl.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    // ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
    ctx.fillStyle = txt_color;
    ctx.font = `${font}px monospace`;
    ctx.fillText(text, cl.x + cl.w/2, cl.y + cl.h/2 + font/2-3);
    ctx.restore();
  }

  // prev
  button_prev  = new Clickable(ctx.canvas, 25, 420, 20, 20);
  button_prev.onleave = () => draw_button_1(button_prev, '<', 'hotpink', 'lightgrey');
  button_prev.onenter = () => draw_button_1(button_prev, '<', 'pink', 'white');
  button_prev.onpress = () => draw_button_1(button_prev, '<', 'red', 'black');
  button_prev.draw = () => {
    const page_index = current_level_index/(levels_on_row*levels_on_col)|0;
    if (page_index > 0) {
      button_prev.enable();
      button_prev.onleave();
    } else {
      button_prev.disable();
    }
  };
  button_prev.onrelease = () => {
    button_prev.onenter();
    const page_index = current_level_index/(levels_on_row*levels_on_col)|0;
    current_level_index = (page_index-1)*(levels_on_row*levels_on_col);
    draw_levelpage();
  };

  // next
  button_next  = new Clickable(ctx.canvas, width - 50, 420, 20, 20);
  button_next.onleave = () => draw_button_1(button_next, '>', 'hotpink', 'lightgrey');
  button_next.onenter = () => draw_button_1(button_next, '>', 'pink', 'white');
  button_next.onpress = () => draw_button_1(button_next, '>', 'red', 'black');
  button_next.draw = () => {
    const page_index = current_level_index/(levels_on_row*levels_on_col)|0;
    const pages_max = levels_seeds_table.length/(levels_on_row*levels_on_col)|0;
    if (page_index < pages_max) {
      button_next.enable();
      button_next.onleave();
    } else {
      button_next.disable();
    }
  };
  button_next.onrelease = () => {
    button_next.onenter();
    const page_index = current_level_index/(levels_on_row*levels_on_col)|0;
    current_level_index = (page_index+1)*(levels_on_row*levels_on_col);
    draw_levelpage();
  };

  // sound
  button_sound = new Clickable(ctx.canvas, width-22, 25, 15, 15);
  button_sound.onleave = () => draw_button_1(button_sound, 'S', 'hotpink', 'lightgrey');
  button_sound.onenter = () => draw_button_1(button_sound, 'S', 'pink', 'white');
  button_sound.onpress = () => draw_button_1(button_sound, 'S', 'red', 'black');
  button_sound.draw = () => {
    button_sound.enable();
    button_sound.onleave();
  };
  button_sound.onrelease = () => {
    button_sound.onenter();
    is_sound = !is_sound;
    sounds.forEach(e => e.volume = is_sound ? 1 : 0);
  };

  // music
  button_music = new Clickable(ctx.canvas, width-22, 45, 15, 15);
  button_music.onleave = () => draw_button_1(button_music, 'M', 'hotpink', 'lightgrey');
  button_music.onenter = () => draw_button_1(button_music, 'M', 'pink', 'white');
  button_music.onpress = () => draw_button_1(button_music, 'M', 'red', 'black');
  button_music.draw = () => {
    button_music.enable();
    button_music.onleave();
  };
  button_music.onrelease = () => {
    button_music.onenter();
    is_music = !is_music;
    mp3_beeth.volume = is_music ? beeth_max_volume : 0;
  };

  // pause
  button_pause = new Clickable(ctx.canvas, 11, 28, 45, 15);
  button_pause.onleave = () => draw_button_1(button_pause, 'пауза', 'hotpink', 'lightgrey');
  button_pause.onenter = () => draw_button_1(button_pause, 'пауза', 'pink', 'white');
  button_pause.onpress = () => draw_button_1(button_pause, 'пауза', 'red', 'black');
  button_pause.draw = () => {
    button_pause.enable();
    button_pause.onleave();
  };
  button_pause.onrelease = () => {
    button_pause.onenter();
    is_paused = !is_paused;
  };

  // close
  button_close = new Clickable(ctx.canvas, 11, height - 45, 45, 15);
  button_close.onleave = () => draw_button_1(button_close, 'меню', 'hotpink', 'lightgrey');
  button_close.onenter = () => draw_button_1(button_close, 'меню', 'pink', 'white');
  button_close.onpress = () => draw_button_1(button_close, 'меню', 'red', 'black');
  button_close.draw = () => {
    button_close.enable();
    button_close.onleave();
  };
  button_close.onrelease = () => {
    button_close.onenter();
    if (is_gamelooping) {
      is_close = true;
    } else {
      draw_levelpage();
    }
  };

  // pause
  button_regen = new Clickable(ctx.canvas, 11, 80, 45, 15);
  button_regen.onleave = () => draw_button_1(button_regen, 'другой', 'green', 'lightgrey');
  button_regen.onenter = () => draw_button_1(button_regen, 'другой', 'lightgreen', 'white');
  button_regen.onpress = () => draw_button_1(button_regen, 'другой', 'darkgreen', 'black');
  button_regen.draw = () => {
    button_regen.enable();
    button_regen.onleave();
  };
  button_regen.onrelease = () => {
    button_regen.onenter();
    times_failed = 0;
    button_regen.disable();
    if (is_gamelooping) {
      is_regen = true;
    } else {
      prepare_level_and_run(current_level_index, true);
    }
  };
}


class Clickable {
  constructor(domElement, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    // for tests (not only)
    this.draw = (ctx) => {
      ctx.fillStyle = 'white';
      ctx.fillRect(x, y, w, h);
      return this;
    };

    // can be redefined

    this.onenter = (x, y, w, h) => {
      // console.log('Clickable onenter');
    };

    this.onleave = (x, y, w, h) => {
      // console.log('Clickable onleave');
    };

    this.onpress = (x, y, w, h) => {
      // console.log('Clickable onpress');
    };

    this.onrelease = (x, y, w, h) => {
      // console.log('Clickable onrelease');
    };

    // system

    const in_range = (_x, _y) => x <= _x && _x <= x+w && y <= _y && _y <= y+h;
    let is_onhover = false;
    let hover_pos = [0, 0];
    let is_pressed = false;

    this._onmousemove = (e) => {
      const rect = domElement.getBoundingClientRect();
      const is_in_range = in_range(e.clientX-rect.x, e.clientY-rect.y);
      if      (is_in_range && !is_onhover) {
        is_onhover = true;
        this.onenter(x, y, w, h);
      }
      else if (!is_in_range && is_onhover) {
        is_onhover = false;
        this.onleave(x, y, w, h);
        if (is_pressed) {
          is_pressed = false;
          // this.onrelease(x, y, w, h);
        }
      }
    };

    this._onmousedown = (e) => {
      e.preventDefault();
      if (e.button !== 0 || !is_onhover) return;
      is_pressed = true;
      this.onpress(x, y, w, h);
      mp3_click_0.play();
    };

    this._onmouseup = (e) => {
      e.preventDefault();
      if (e.button !== 0 || !is_onhover) return;
      is_pressed = false;
      this.onrelease(x, y, w, h);
      mp3_click_1.play();
    };

    this.is_enabled = false;
  }

  enable() {
    if (!this.is_enabled) {
      window.addEventListener('mousemove', this._onmousemove);
      window.addEventListener('mousedown', this._onmousedown);
      window.addEventListener('mouseup', this._onmouseup);
      this.is_enabled = true;
    }
  }

  disable() {
    if (this.is_enabled) {
      window.removeEventListener('mousemove', this._onmousemove);
      window.removeEventListener('mousedown', this._onmousedown);
      window.removeEventListener('mouseup', this._onmouseup);
      this.is_enabled = false;
    }
  }
}


//////////////////////////////////////////////
//           GRAPHICS                       //
//////////////////////////////////////////////


function redraw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = 'yellow';
  ctx.font = '12px monospace';
  ctx.fillText(`очки: ${current_score+game_score|0}`, 10, height - 5);

  ctx.fillStyle = 'grey';
  ctx.font = '16px monospace';
  ctx.fillText(`уровень: ${current_level_index+1}`, 65, 18);

  ctx.save();
  ctx.translate((width-grid_w*grid_sz)>>1, (height-grid_h*grid_sz)>>1);

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'grey';
  ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);

  let block_id;
  const half_grid_w = grid_w / 2;
  for (let y = grid_h - 1; y >= 0; --y) {
    for (let x = 0; x < (grid_w >> 1); ++x) {
      block_id = grid[I(x         , y)]; if (block_id !== -1) draw_block_new(ctx, x         , y, block_id);
      block_id = grid[I(grid_w-x-1, y)]; if (block_id !== -1) draw_block_new(ctx, grid_w-x-1, y, block_id);
    }
    if (grid_w % 2 > 0) {
      block_id = grid[I(grid_w >> 1, y)]; if (block_id !== -1) draw_block_new(ctx, grid_w >> 1, y, block_id);
    }
  }

  draw_block_new(ctx, ...fb1.pos, fb1.block_id);
  draw_block_new(ctx, ...fb2.pos, fb2.block_id);

  ctx.restore();

  button_sound.draw();
  button_music.draw();
  button_pause.draw();
  button_close.draw();
  if (times_failed > 3) button_regen.draw();
}


function draw_block_new(ctx, x, y, id) {
  const b = blocks[id];
  if ('circle' === b.type) {
    draw_circle3d([x, y], b.hsl_arr);
  } else if ('quad' === b.type) {
    draw_block3d([x, y], b.hsl_arr);
  } else if ('any' === b.type) {
    draw_sprite([x, y], png_any);
  } else if ('star' === b.type) {
    draw_sprite([x, y], png_sun);
  } else if ('rock' === b.type) {
    draw_sprite([x, y], png_stone);
  } else if ('candle' === b.type) {
    draw_sprite([x, y], png_candle);
  } else {
    draw_circle3d([x, y], [0,100,100]);
  }
}


function draw_block3d(pos, hsl_arr) {
  block3d_pb[0][0] = (pos[0]  )*grid_sz; block3d_pb[0][1] = (pos[1]  )*grid_sz;
  block3d_pb[1][0] = (pos[0]+1)*grid_sz; block3d_pb[1][1] = (pos[1]  )*grid_sz;
  block3d_pb[2][0] = (pos[0]  )*grid_sz; block3d_pb[2][1] = (pos[1]+1)*grid_sz;
  block3d_pb[3][0] = (pos[0]+1)*grid_sz; block3d_pb[3][1] = (pos[1]+1)*grid_sz;

  let dx, dy;
  for (let i = 0; i < block3d_pb.length; ++i) {
    dx = grid_center[0] - block3d_pb[i][0];
    dy = grid_center[1] - block3d_pb[i][1];
    block3d_po[i][0] = block3d_pb[i][0] + dx * block3d_dz;
    block3d_po[i][1] = block3d_pb[i][1] + dy * block3d_dz;
  }

  const [c,cl1,cl2,cd1,cd2] = hsl_to_strs(hsl_arr);

  if (dx > 0) { // right
    ctx.fillStyle = cd1;
    ctx.beginPath();
    ctx.moveTo(...block3d_pb[1]);
    ctx.lineTo(...block3d_pb[3]);
    ctx.lineTo(...block3d_po[3]);
    ctx.lineTo(...block3d_po[1]);
    ctx.fill();
  } else if (dx < 0) { // left
    ctx.fillStyle = cd1;//cl1;
    ctx.beginPath();
    ctx.moveTo(...block3d_pb[0]);
    ctx.lineTo(...block3d_pb[2]);
    ctx.lineTo(...block3d_po[2]);
    ctx.lineTo(...block3d_po[0]);
    ctx.fill();
  }
  if (dy > 0) { // bttom
    ctx.fillStyle = cd2;
    ctx.beginPath();
    ctx.moveTo(...block3d_pb[2]);
    ctx.lineTo(...block3d_pb[3]);
    ctx.lineTo(...block3d_po[3]);
    ctx.lineTo(...block3d_po[2]);
    ctx.fill();
  } else if (dy < 0) { // top
    ctx.fillStyle = cl2;
    ctx.beginPath();
    ctx.moveTo(...block3d_pb[0]);
    ctx.lineTo(...block3d_pb[1]);
    ctx.lineTo(...block3d_po[1]);
    ctx.lineTo(...block3d_po[0]);
    ctx.fill();
  }
  // front
  ctx.fillStyle = c;
  ctx.fillRect(...block3d_pb[0], grid_sz, grid_sz);
}


function draw_circle3d(pos, hsl_arr) {
  const [c,cl1,cl2,cd1,cd2] = hsl_to_strs(hsl_arr);

  const x = pos[0]*grid_sz+(grid_sz+(grid_center[0]-pos[0]*grid_sz)*block3d_dz)/2;
  const y = pos[1]*grid_sz+(grid_sz+(grid_center[1]-pos[1]*grid_sz)*block3d_dz)/2;
  const r = (grid_sz >> 1);

  // Create a radial gradient
  var gradient = ctx.createRadialGradient(x-r/4,y-r/4,r/3, x,y,r+1);
  gradient.addColorStop(0, c);
  gradient.addColorStop(.9, cd1);
  gradient.addColorStop(1, cl1);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r, 0, 0, Math.PI*2);
  ctx.fill();
}


function draw_sprite(pos, img) {
  const x = pos[0]*grid_sz+((grid_center[0]-pos[0]*grid_sz)*block3d_dz)/2;
  const y = pos[1]*grid_sz+((grid_center[1]-pos[1]*grid_sz)*block3d_dz)/2;
  ctx.drawImage(img, x, y, grid_sz, grid_sz);
}


function hsl_to_strs(hsl_arr) {
  const c   = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]    }%)`; // front
  const cl1 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]*1.2}%)`; // left
  const cl2 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]*1.4}%)`; // top
  const cd1 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]/2.5}%)`; // right
  const cd2 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]/2.5}%)`;
  return [c,cl1,cl2,cd1,cd2];
}


function intro() {
  return new Promise(r => {
    const colors = Array(10).fill().map(() => `rgb(${Math.random()*256},${Math.random()*256},${Math.random()*256})`);

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';

    ctx.font = '12px monospace';
    ctx.fillStyle = 'grey';
    ctx.fillText('by Sluchaynaya Kotya', width/2, height/2+12);

    ctx.font = '100px monospace';
    let i = 0;
    const iid = setInterval(() => {
      ctx.fillStyle = colors[i];
      ctx.fillText('БУБЛЕС', width/2-i*2, height/2-i*4);
      if (++i >= colors.length) {
        clearInterval(iid);
        ctx.restore();
        setTimeout(() => {
          r();
        }, 2000);
      }
    }, 100);
  });
}
