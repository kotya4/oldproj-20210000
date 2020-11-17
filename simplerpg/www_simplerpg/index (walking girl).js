/* gen by new.py at 2020-09-22 08:15:12.085995 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 200;
  const width = 200;
  const scale = 2;

  const container = document.createElement('div');
  container.classList.add('render-container');
  container.style.outline = 'none';
  container.style.height = `${scale * height}px`;
  container.style.width = `${scale * width}px`;
  document.body.appendChild(container);

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  ctx.canvas.style.width = '100%';
  ctx.imageSmoothingEnabled = false;
  container.appendChild(ctx.canvas);

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  const vctx = document.createElement('canvas').getContext('2d');
  vctx.canvas.height = height;
  vctx.canvas.width = width;
  // vctx.canvas.style.width = '400%';
  vctx.imageSmoothingEnabled = false;
  container.appendChild(vctx.canvas);

  // ТИПЫ ПАТТЕРНОВ:
  // - текстура камня
  // - текстура кирпича
  // - текстура обоев
  // - текстура дерева
  // - текстура гладкого камня
  function gen_pattern(ctx) {
    const width = 32;
    const height = 32;

    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const x = 5 * (i / width);
        const y = 5 * (j / height);
        const z = 0;

        const n = tooloud.Worley.Euclidean(x, y, z);
        const r = Math.floor(255 * n[0]);  // R
        const g = Math.floor(255 * n[0]);  // G
        const b = Math.floor(255 * n[0]);  // B
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i, j, 1, 1);
      }
    }


    const type = [
      'source-over',
      'source-in',
      'source-out',
      'source-atop',
      'destination-over',
      'destination-in',
      'destination-out',
      'destination-atop',
      'lighter',
      'copy',
      'xor',
      'multiply',
      'screen',
      'overlay',
      'darken',
      'lighten',
      'color-dodge',
      'color-burn',
      'hard-light',
      'soft-light',
      'difference',
      'exclusion',
      'hue',
      'saturation',
      'color',
      'luminosity',
    ][24];

    // console.log(type.length);

    // ctx.globalCompositeOperation = type;


    // ctx.fillStyle = 'red';
    // ctx.fillRect(0, 0, width, height);


    // const w = 16;
    // const h = 16;

    // ctx.fillStyle = 'green';
    // ctx.fillRect(0, 0, w, h);

    // const num = 1000;
    // for (let i = 0; i < num; ++i) {
    //   const size = 1 + Math.random() * 4 | 0;
    //   const x = Math.random() * (w - size) | 0;
    //   const y = Math.random() * (h - size) | 0;
    //   const r = Math.random() * 256 | 0;
    //   const g = Math.random() * 256 | 0;
    //   const b = g;
    //   ctx.fillStyle = `rgb(${r},${g},${b})`;
    //   ctx.fillRect(x, y, size, size);
    // }
  }

  // gen_pattern(vctx);

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  for (let node of container.children) {
    // node.style.position = 'absolute';
  }

  /////////////////////////////////////////////////
  /////////////////////////////////////////////////

  const room_w = 150;
  const room_h = 125;
  const room_d = 50;
  const room_x = 25;
  const room_y = 65;
  function draw_room(ctx) {

    // floor
    ctx.fillStyle = 'grey';
    ctx.fillRect(room_x, room_y, room_w, room_h);

    // wall
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(room_x, room_y, room_w, -room_d);

  }

  /////////////////////////////////////////////////
  /////////////////////////////////////////////////

  const player_pos = [room_x, room_y]; // display-space
  let player_dir = 0; // direction, 0 - top, 1 - right, ...
  let player_moving = false;
  const player_w = 24;
  const player_h = 39

  let img_loaded = false;
  let img_i = 0;
  const img = new Image();
  img.src = sprite;
  img.onload = () => {
    img_loaded = true;
  };
  function player_draw(ctx, delta) {
    const sw = player_w;
    const sh = player_h;

    let shi = 0;
    if      (player_dir === 0) {
      shi = 3;
    }
    else if (player_dir === 1) {
      shi = 1;
    }
    else if (player_dir === 2) {
      shi = 2;
    }
    else if (player_dir === 3) {
      shi = 1;
    }

    const sx = sw * (img_i | 0);
    const sy = sh * shi;

    const dx = player_pos[0] | 0;
    const dy = player_pos[1] | 0;
    const dw = sw;
    const dh = sh;

    ctx.save();
    ctx.translate(dx, dy);
    if (player_dir === 3) {
      ctx.translate(dw, 0);
      ctx.scale(-1, +1);
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    ctx.restore();

    if (player_moving) {
      img_i = (img_i + delta * 10) % 8;
    }
  }

  function player_move(dx=0, dy=0) {
    if      (dx > 0) {
      player_dir = 1;
    }
    else if (dx < 0) {
      player_dir = 3;
    }
    if      (dy > 0) {
      player_dir = 2;
    }
    else if (dy < 0) {
      player_dir = 0;
    }

    if (player_pos[0]+dx >= room_x && player_pos[0]+dx < room_x+room_w-player_w) {
      player_pos[0] += dx;
      player_moving = true;
    }

    if (player_pos[1]+dy >= room_y-player_h/2 && player_pos[1]+dy < room_y+room_h-player_h) {
      player_pos[1] += dy;
      player_moving = true;
    }
  }

  /////////////////////////////////////////
  /////////////////////////////////////////

  const keys = {};
  addEventListener('keydown', e => { keys[e.code] = true; });
  addEventListener('keyup', e => { keys[e.code] = false; });

  function proc_keyboard(delta) {
    const player_speed = delta * 100;
    let player_dx = 0;
    let player_dy = 0;

    if (keys['KeyS']) {
      player_dy = +player_speed;
    }

    if (keys['KeyA']) {
      player_dx = -player_speed;
    }

    if (keys['KeyD']) {
      player_dx = +player_speed;
    }

    if (keys['KeyW']) {
      player_dy = -player_speed;
    }

    if (player_dx || player_dy) {
      player_move(player_dx, player_dy);
    }
  }

  ///////////////////////////////////////////////
  ///////////////////////////////////////////////

  let last_time = Date.now();
  (function animate() {
    requestAnimationFrame(animate);
    const current_time = Date.now();
    const delta = (current_time - last_time) / 1000;
    last_time = current_time;

    player_moving = false;
    proc_keyboard(delta);

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    draw_room(ctx);
    player_draw(ctx, delta);

    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${delta}`, 20, 20);

    ctx.restore();
  })();
}
