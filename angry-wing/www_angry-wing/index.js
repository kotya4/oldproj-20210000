/* gen by new.py at 2020-09-22 08:15:12.085995 */
window.onload = async function onload() {
  // if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 400;

  const ctx = Utils.create_canvas(width, height, document.body);

  window.onresize = () => {
    // TODO: check for custom canvas ratios too.
    const { width, height } = document.body.getBoundingClientRect();
    if (width < height) {
      ctx.canvas.style.width = '100%';
      ctx.canvas.style.height = 'auto';
    } else {
      ctx.canvas.style.width = 'auto';
      ctx.canvas.style.height = '100%';
    }
  };
  window.onresize();

  const keys = {};
  const keys_holded = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => { keys[e.code] = false; keys_holded[e.code] = false; });
  function key_pressed(code, type = null) {
    if (keys[code]) {
      if (type === 'ONCE' && keys_holded[code]) return false;
      keys_holded[code] = true;
      return true;
    }
    return false;
  }

  // TODO: load player savefile here
  const player_room_type = 'coridor';
  const player_room_seed = 7;

  const player = new Player(player_room_type, player_room_seed);
  player.load_tileset(DATA.player_tileset);

  let camera_offset_x = ctx.canvas.width / 2;
  let camera_offset_y = ctx.canvas.height / 2;
  let camera_scaler = 2;

  let last_time = Date.now();
  (function animate() {
    requestAnimationFrame(animate);
    // timer
    const current_time = Date.now();
    const delta = (current_time - last_time) / 1000;
    last_time = current_time;
    // game state
    const gs = ProcGameState(delta);
    const is_keys_locked = !!gs; // all non-zero gs will lock keys
    if (gs === 2) { // game ready to change current scene (GAMESTATE_CURRENT === GAMESTATE_FUTURE)
      if      ('ENTER_ROOM' === GAMESTATE_CURRENT) {
        player.change_room(GAMESTATE_DATA.room_seed);
      }
      else if ('TEST_ROOM_SCROLL' === GAMESTATE_CURRENT) {
        player.change_room(player.room.seed + 50);
      }
    }

    ////////////////////////////////////////////////////////

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // camera
    ctx.translate(camera_offset_x|0, camera_offset_y|0);
    ctx.scale(camera_scaler, camera_scaler);
    ctx.translate(-player.pos[0]-player.sprite_size[0]/2, -player.pos[1]-player.sprite_size[1]/2);

    //////////////////////////////////////////////////////////////////////////
    // draw side coridors
    // TDOO: draw only in view range
    if (player.room.type === 'coridor') {
      ctx.drawImage(player.coridor_left.canvas, -DATA.coridor_width, 0);
      ctx.drawImage(player.coridor_right.canvas, +DATA.coridor_width, 0);
    }
    // draw current room/coridor
    ctx.drawImage(player.room.canvas, 0, 0);
    // draw player
    player.draw(ctx, delta);
    // draw interactives
    const font_size = 8;
    ctx.font = `${font_size}px monospace`;
    ctx.fillStyle = 'lightblue';
    for (let i = 0; i < player.interactives.length; ++i) {
      const x = player.pos[0] + player.sprite_size[0] + 10;
      const y = player.pos[1] + (i + 1) * font_size;
      ctx.fillText(player.interactives[i].name, x, y);
      if (i === player.active_interaction_index) {
        ctx.fillRect(x - 4, y - font_size / 2, 2, 2);
      }
      player.interactives[i].draw(ctx);
    }
    //////////////////////////////////////////////////////////////////////////
    if (!is_keys_locked) {
      // moving
      const speed = delta * 100;
      let dx = 0, dy = 0;
      if (keys['KeyS']) dy = +speed;
      if (keys['KeyA']) dx = -speed;
      if (keys['KeyD']) dx = +speed;
      if (keys['KeyW']) dy = -speed;
      if (dx || dy) player.move(dx, dy);
      // interaction
      if (key_pressed('KeyE', 'ONCE')) {
        if (player.interactives.length > 0) {
          player.interactives[player.active_interaction_index].exec();
        }
      }
      // etc.
      if (keys['ArrowLeft']) camera_scaler += delta;
      if (keys['ArrowRight']) camera_scaler -= delta;
      if (keys['ArrowUp']) ChangeGameState('TEST_GS');
      if (keys['ArrowDown']) ChangeGameState('TEST_ROOM_SCROLL');
    }
    //////////////////////////////////////////////////////////////////////////

    ctx.restore();
    // gamestate display fading
    ctx.fillStyle = `rgba(0,0,0,${1-(Math.min(GAMESTATE_DELAY, Math.max(0, GAMESTATE_TIME)) / GAMESTATE_DELAY)})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ////////////////////////////////////////////////////////
    ctx.font = '11px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`build 20201213`, 0, 400);
    ctx.fillText(`WASD - двигаться, E - войти/выйти`, 100, 390);
    ctx.fillStyle = 'red';
    ctx.fillText(`pos : ${player.pos.map(e => ~~e)}`, 20, 20);
    ctx.fillText(`cori: ${player.coridor_seed}`, 20, 30);
    ctx.fillText(`room: ${player.room_seed}`, 20, 40);
    ctx.fillText(`inte: ${player.interactives.length}`, 20, 50);
    ctx.fillText(`GS C: ${GAMESTATE_CURRENT}`, 20, 60);
    ctx.fillText(`GS F: ${GAMESTATE_FUTURE}`, 20, 70);
    ctx.fillText(`GS T: ${GAMESTATE_TIME}`, 20, 80);
    ctx.fillText(`GS D: ${GAMESTATE_DELAY}`, 20, 90);
  })();
}
