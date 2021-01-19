class Player {
  constructor(room_type, room_seed) {
    this.pos = [0, 0];
    this.dir = 'bottom';
    this.is_moving = false;
    this.sprite_size = [24, 39];
    this.sprite_is_loaded = false;
    this.sprite_img = null;
    this.sprite_tilei = 0;
    this.interactives = [];
    this.active_interaction_index = 0; // TODO: do changable
    this.room_seed = room_seed;

    this.change_room(room_type === 'coridor' ? null : room_seed);
  }


  get origin() {
    return [this.pos[0]+this.sprite_size[0]/2, this.pos[1]+this.sprite_size[1]-3];
  }


  recalc_interactives() {
    this.interactives.length = 0;
    for (let i = 0; i < this.room.interactives.length; ++i) {
      if (this.room.interactives[i].collision(...this.origin)) {
        this.interactives.push(this.room.interactives[i]);
      }
    }
    if (this.active_interaction_index > this.interactives.length) {
      this.active_interaction_index = 0;
    }
  }


  // seed -- room seed where player should teleport to. Teleports to coridor if seed == null.
  // coridor seed will be calculated automaticly according to player's current room_seed.
  change_room(seed=null) {
    this.interactives.length = 0;
    this.dir = 'bottom';
    this.coridor_seed = this.room_seed / DATA.coridor_doors_num | 0;
    // coridor
    if (seed == null) {
      // HACK: this ifs make far teleportations change coridor parts incorrectly, but ok in usual teleports.
      // if (this.coridor_left   == null) this.coridor_left   = new Room(this.coridor_seed-1, 'coridor');
      // if (this.coridor_middle == null) this.coridor_middle = new Room(this.coridor_seed+0, 'coridor');
      // if (this.coridor_right  == null) this.coridor_right  = new Room(this.coridor_seed+1, 'coridor');
      this.coridor_left   = new Room(this.coridor_seed-1, 'coridor');
      this.coridor_middle = new Room(this.coridor_seed+0, 'coridor');
      this.coridor_right  = new Room(this.coridor_seed+1, 'coridor');
      this.room = this.coridor_middle;
      let door_i = this.room_seed % DATA.coridor_doors_num | 0;
      if (door_i < 0) door_i = DATA.coridor_doors_num + door_i;
      const door_pos = this.room.doors_coords[door_i];
      this.pos[0] = door_pos[0] - this.sprite_size[0]/2;
      this.pos[1] = door_pos[1] + 10;
    }
    // room
    else {
      this.room_seed = seed;
      this.room = new Room(this.room_seed);
      this.pos[0] = this.room.door_pos_ndc[0] - this.sprite_size[0]/2;
      this.pos[1] = this.room.door_pos_ndc[1] + 10;
    }
  }


  load_tileset(url) {
    this.sprite_img = new Image();
    this.sprite_img.src = url;
    this.sprite_is_loaded = false;
    return new Promise((res, rej) => {
      this.sprite_img.addEventListener('load', () => {
        this.sprite_is_loaded = true;
        res();
      });
      this.sprite_img.addEventListener('error', () => {
        rej();
      });
    });
  }


  draw(ctx, delta) {
    const animation_speed = 10;
    const tiles_num = 8;

    let tileset_row = 0;
    if      (this.dir === 'bottom') tileset_row = 2;
    else if (this.dir ===  'right') tileset_row = 1;
    else if (this.dir ===   'left') tileset_row = 1; // need mirror
    else if (this.dir ===    'top') tileset_row = 3;

    if (this.is_moving) {
      this.sprite_tilei = (this.sprite_tilei + delta * animation_speed) % tiles_num;
    }

    const sx = this.is_moving ? this.sprite_size[0] * (this.sprite_tilei | 0) : 0;
    const sy = this.sprite_size[1] * (tileset_row);
    const sw = this.sprite_size[0];
    const sh = this.sprite_size[1];
    const dx = this.pos[0];
    const dy = this.pos[1];
    const dw = this.sprite_size[0];
    const dh = this.sprite_size[1];

    this.is_moving = false;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(...this.origin, 10, 5, 0, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // player
    ctx.save();
    ctx.translate(dx, dy);
    if (this.dir === 'left') { // mirror sprite
      ctx.translate(dw, 0);
      ctx.scale(-1, +1);
    }
    if (this.sprite_img != null) {
      ctx.drawImage(this.sprite_img, sx, sy, sw, sh, 0, 0, dw, dh);
    } else {
      ctx.fillStyle = 'hotpink';
      ctx.fillRect(0, 0, dw, dh);
    }
    ctx.restore();
  }


  move(dx=0, dy=0) {
    if (this.room == null) throw Error('Room has to be setted.');

    const origin_x = this.pos[0]+this.sprite_size[0]/2;
    const origin_y = this.pos[1]+this.sprite_size[1];

    let cdx = 0; // collision delta coordinates
    let cdy = 0;

    if (dy > 0) { this.dir = 'bottom'; cdy = +2;                     }
    if (dx > 0) { this.dir = 'right';  cdx = +this.sprite_size[0]/2; }
    if (dx < 0) { this.dir = 'left';   cdx = -this.sprite_size[0]/2; }
    if (dy < 0) { this.dir = 'top';    cdy = -5;                     }

    const collision = this.room.collision(origin_x, origin_y, dx, dy, cdx, cdy, this.sprite_size[0]/3, 5/3);

    const speed_mod = collision.dx && collision.dy ? 2 ** 0.5 : 1;
    this.pos[0] += collision.dx / speed_mod;
    this.pos[1] += collision.dy / speed_mod;
    this.is_moving = collision.dx || collision.dy;

    if (collision.dx && this.room.type === 'coridor') {
      // teleport player to another coridor and shift coridors
      const player_origin_x = this.pos[0]+this.sprite_size[0]/2;
      if        (collision.dx < 0 && player_origin_x < 0) {
        this.pos[0] = DATA.coridor_width-this.sprite_size[0]/2;
        this.coridor_seed -= 1;
        this.coridor_right = this.coridor_middle;
        this.coridor_middle = this.coridor_left;
        this.coridor_left = new Room(this.coridor_seed-1, 'coridor'); // TODO: make suddenly before view range
        this.room = this.coridor_middle;
      } else if (collision.dx > 0 && player_origin_x > DATA.coridor_width) {
        this.pos[0] = 0-this.sprite_size[0]/2;
        this.coridor_seed += 1;
        this.coridor_left = this.coridor_middle;
        this.coridor_middle = this.coridor_right;
        this.coridor_right = new Room(this.coridor_seed+1, 'coridor');
        this.room = this.coridor_middle;
      }
    }

    this.recalc_interactives();
  }


  /*
  proc_keys(keys, delta) {
    // moving
    const speed = delta * 100;
    let dx = 0, dy = 0;
    if (keys['KeyS']) dy = +speed;
    if (keys['KeyA']) dx = -speed;
    if (keys['KeyD']) dx = +speed;
    if (keys['KeyW']) dy = -speed;
    if (dx || dy) this.move(dx, dy);
    // interaction
    if (keys['KeyE']) {
      if (this.interactives.length > 0) {
        this.interactives[this.active_interaction_index].exec();
      }
    }
  }
  */

  /*
  proc(ctx, keys, delta) {
    // draw side coridors
    // TDOO: draw only in view range
    if (this.room.type === 'coridor') {
      ctx.drawImage(this.coridor_left.canvas, -DATA.coridor_width, 0);
      ctx.drawImage(this.coridor_right.canvas, +DATA.coridor_width, 0);
    }
    // draw current room/coridor
    ctx.drawImage(this.room.canvas, 0, 0);
    // draw player
    this.draw(ctx, delta);

    // draw interactives
    const font_size = 8;
    ctx.font = `${font_size}px monospace`;
    ctx.fillStyle = 'lightblue';
    for (let i = 0; i < this.interactives.length; ++i) {
      const x = this.pos[0] + this.sprite_size[0] + 10;
      const y = this.pos[1] + (i + 1) * font_size;
      ctx.fillText(this.interactives[i].name, x, y);
      if (i === this.active_interaction_index) {
        ctx.fillRect(x - 4, y - font_size / 2, 2, 2);
      }
    }

    // moving
    this.proc_keys(keys, delta);
  }
  */
}
