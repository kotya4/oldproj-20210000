class Room {
  constructor(seed, type, opt={}) {
    this.interactives = [];

    const default_random = Math.random;
    if (seed == null) seed = Math.random();
    Math.seedrandom(seed);

    if (type === 'coridor') this.init_coridor(seed);
    else this.init_room(seed);

    Math.random = default_random;

    // buffer for collision
    this.last_collision = {
      type: 'none',
      dx: 0,
      dy: 0,
    };

    this.seed = seed;
  }


  // coridor_seed -- coridor index, calcs as room_seed % DATA.coridor_doors_num
  init_coridor(coridor_seed) {
    const wall_h = 64;
    const x0 = 5;
    const y0 = wall_h;
    const w = DATA.coridor_width;
    const h = 64;

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = w | 0;
    ctx.canvas.height = y0 + x0 + h + wall_h | 0;
    ctx.imageSmoothingEnabled = false;

    // ctx.fillStyle = 'grey';
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const fl = new Floor(w, h, {
      pattern_type: 1,
      is_monocolor: false,
      pattern_colors: [[130, 100, 100]],
      pattern_dirt_num: 5,
    });
    ctx.drawImage(fl.canvas, 0, x0+wall_h);
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.fillRect(0, x0+wall_h, w, h);

    const wp = new Wallpaper(w, wall_h, {
      is_line: false,
      is_pattern: false,
      base_value: 160,
      base_color: [100, 120, 90],
      is_inverse_dirt: true,
    });
    ctx.drawImage(wp.canvas, 0, x0);

    const bc = 75;
    for (let y1 = 0; y1 < x0; ++y1) {
      const op = 1-(y1+1)/x0;
      ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op})`;
      ctx.fillRect(0, x0-y1, w, 1);
    }
    for (let y1 = 0; y1 < y0; ++y1) {
      const op = 1-(y1+1)/y0;
      ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op})`;
      ctx.fillRect(0, x0+wall_h+h+y1, w, 1);
    }

    const door_w = 32*0.8|0;
    const door_h = 64/1.5|0;
    const door_offset_x = (w / DATA.coridor_doors_num - door_w) / 2;
    const doors_coords = [];
    for (let i = 0; i < DATA.coridor_doors_num; ++i) {
      ctx.fillStyle = 'black';
      const x = door_offset_x + (door_w + door_offset_x * 2) * i | 0;
      const y = x0+wall_h-door_h | 0;
      ctx.fillRect(x, y, door_w, door_h);
      doors_coords.push([x + door_w / 2, y]);
    }

    /////////////////////////////////////////////////////////////////////////

    this.canvas = ctx.canvas;
    this.faces_ndc = [[], [[0, x0, w, x0]], [], [[0, x0+wall_h+h, w, x0+wall_h+h]]];
    this.wall_h_ndc = wall_h;
    // this.door_pos_ndc = [0 + w / 2, x0 + h / 2];
    this.type = 'coridor';
    this.doors_coords = doors_coords;

    // interactives objects
    const first_room_index = coridor_seed * DATA.coridor_doors_num;
    doors_coords.forEach((pos, i) => {
      const room_seed = first_room_index + i;
      const o = new InteractiveObject(pos[0]-door_w/2, pos[1]+door_h, door_w, 10, 'войти');
      // interactive object can execute any code implemented outside of main game loop, f.e.
      // change game state calling ChangeGameState from utils.js.
      o.exec = () => {
        // ChangeGameState can provide some data for state handler in main game loop.
        ChangeGameState('ENTER_ROOM', {
          room_seed,
        });
      };
      this.interactives.push(o);

      ctx.fillStyle = 'black';
      ctx.font = '11px monospace';
      ctx.fillText(room_seed, pos[0], pos[1]);
    });
  }


  init_room() {
    const rect_wall_h = 2;
    const rect_min = 3;
    const rects = new ConnectedRects({
      max_w: 10, max_h: 10,
      min_w: rect_min, min_h: rect_min + rect_wall_h,
      min_strip: rect_min + rect_wall_h, min_face: rect_min + rect_wall_h,
      rects_num: 1 + Math.random() * 4 | 0
    });

    // do not use grid offsets, they are not equal to rects offsets because of ghost rects
    let top = 0;
    let left = 0;
    let right = 0;
    let bottom = 0;
    rects.rects.forEach(rect => {
      if (rect[0] < left) left = rect[0];
      if (rect[1] < top) top = rect[1];
      if (rect[2]+rect[0] > right) right = rect[2]+rect[0];
      if (rect[3]+rect[1] > bottom) bottom = rect[3]+rect[1];
    });

    const scaler = 32; // how many pixels in one grid cell
    const x0 = 5;                  // offset for borders (also border width)
    const y0 = rect_wall_h*scaler; // offset for borders (also border height)
    const room_w = Math.abs(right - left); // in grid space
    const room_h = Math.abs(bottom - top); // in grid space

    const faces = rects.grid.faces({ });
    const faces_top = faces[1];

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.height = room_h * scaler + y0 + x0 | 0;
    ctx.canvas.width = room_w * scaler + x0 * 2 | 0;
    ctx.imageSmoothingEnabled = false;

    // draw bg
    // ctx.fillStyle = 'grey';
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.translate(x0, x0);

    const wall_h = rect_wall_h * scaler;

    // draw floor bg
    const fl = new Floor(room_w * scaler, room_h * scaler);
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    rects.rects.forEach((rect,i) => {
      const x1 = (rect[0]-left) * scaler;
      const y1 = (rect[1]-top) * scaler;
      const w1 = rect[2] * scaler;
      const h1 = rect[3] * scaler;
      ctx.drawImage(fl.canvas, x1, y1, w1, h1, x1, y1, w1, h1);
      ctx.fillRect(x1, y1, w1, h1);
    });

    // плинтус
    const baseboard_color = fl.pattern_colors[0].map(e => e / 1.25);
    const baseboard_h = 5+Math.random()*10;
    const baseboard_w = Math.min(4, baseboard_h >> 1);
    // // left
    faces[0].forEach(line => {
      const x = (line[0]-left) * scaler;
      const y = (line[1]-top) * scaler;
      const w = (line[2]-left) * scaler - x;
      const h = (line[3]-top) * scaler - y;
      ctx.fillStyle = `rgb(${baseboard_color})`;
      ctx.fillRect(x, y, baseboard_w, h+wall_h);
    });
    // right
    faces[2].forEach(line => {
      const x = (line[0]-left) * scaler;
      const y = (line[1]-top) * scaler;
      const w = (line[2]-left) * scaler - x;
      const h = (line[3]-top) * scaler - y;
      ctx.fillStyle = `rgb(${baseboard_color})`;
      ctx.fillRect(x-baseboard_w, y, baseboard_w, h+wall_h);
    });

    // borders
    const bc = 75;
    // bottom
    faces[3].forEach(line => {
      const x = (line[0]-left) * scaler;
      const y = (line[1]-top) * scaler;
      const w = (line[2]-left) * scaler - x;
      const h = (line[3]-top) * scaler - y;
      ctx.clearRect(x, y, w, y0);
      for (let y1 = 0; y1 < y0; ++y1) {
        const op = 1-(y1+1)/y0;
        ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op})`;
        ctx.fillRect(x, y+y1, w, 1);
        // for (let x1 = 0; x1 < x0; ++x1) {
        //   const op2 = Math.min(op, 1)-(x1+1)/x0;
        //   // const op2 = Math.min(op, 1-(x1+1)/x0);
        //   ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op2})`;
        //   ctx.fillRect(x+w+x1, y+y1, 1, 1);
        //   ctx.fillRect(x-x1-1, y+y1, 1, 1);
        // }
      }
    });
    // // left
    // faces[0].forEach(line => {
    //   const x = (line[0]-left) * scaler;
    //   const y = (line[1]-top) * scaler;
    //   const w = (line[2]-left) * scaler - x;
    //   const h = (line[3]-top) * scaler - y;
    //   for (let i = 0; i < x0; ++i) {
    //     ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${1-(i+1)/x0})`;
    //     ctx.fillRect(x-i, y, 1, h);
    //   }
    // });
    // // right
    // faces[2].forEach(line => {
    //   const x = (line[0]-left) * scaler;
    //   const y = (line[1]-top) * scaler;
    //   const w = (line[2]-left) * scaler - x;
    //   const h = (line[3]-top) * scaler - y;
    //   for (let i = 0; i < x0; ++i) {
    //     ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${1-(i+1)/x0})`;
    //     ctx.fillRect(x+i, y, 1, h);
    //   }
    // });
    // top
    faces[1].forEach(line => {
      const x = (line[0]-left) * scaler;
      const y = (line[1]-top) * scaler;
      const w = (line[2]-left) * scaler - x;
      const h = (line[3]-top) * scaler - y;
      for (let y1 = 0; y1 < x0; ++y1) {
        const op = 1-(y1+1)/x0;
        ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op})`;
        ctx.fillRect(x, y-y1, w, 1);
        // for (let x1 = 0; x1 < x0; ++x1) {
        //   const op2 = Math.min(op, 1)-(x1+1)/x0;
        //   // const op2 = Math.min(op, 1-(x1+1)/x0);
        //   ctx.fillStyle = `rgba(${bc},${bc},${bc}, ${op2})`;
        //   ctx.fillRect(x+w+x1, y-y1, 1, 1);
        //   ctx.fillRect(x-x1-1, y-y1, 1, 1);
        // }
      }
    });

    // draw wall bg
    const wp = new Wallpaper(room_w * scaler, rect_wall_h * scaler);
    const comb_ratio = 0.35;
    faces_top.forEach(face => {
      const wall_w = (face[2]-face[0]) * scaler;
      ctx.drawImage(
        wp.canvas,
        Math.random()*(wp.canvas.width-wall_w), 0,
        wall_w, wall_h,
        (face[0]-left) * scaler, (face[1]-top) * scaler,
        wall_w, wall_h
      );
    });
    // if (Math.random() > 0.8) { // комбинирование обоев
    //   const wp = new Wallpaper(room_w * scaler, rect_wall_h * scaler, false, false);
    //   faces_top.forEach(face => {
    //     const wall_w = (face[2]-face[0]) * scaler;
    //     ctx.drawImage(
    //       wp.canvas,
    //       Math.random()*(wp.canvas.width-wall_w), 0,
    //       wall_w, wall_h,
    //       (face[0]-left) * scaler, (face[1]-top) * scaler + wall_h*(1-comb_ratio),
    //       wall_w, wall_h*comb_ratio
    //     );
    //   });
    // }

    // плинтус топ
    faces[1].forEach(line => {
      const x = (line[0]-left) * scaler;
      const y = (line[1]-top) * scaler;
      const w = (line[2]-left) * scaler - x;
      const h = (line[3]-top) * scaler - y;
      ctx.fillStyle = `rgb(${baseboard_color})`;
      ctx.fillRect(x, y+wall_h-baseboard_h, w, baseboard_h);
      ctx.fillStyle = `rgb(${baseboard_color.map(e => e * 1.25)})`;
      ctx.fillRect(x, y+wall_h-baseboard_h, w, 2);
    });

    // draw door
    const door_w = 0.8;
    const door_h = rect_wall_h / 1.5;
    const door_face = faces_top.sort((a,b) => a[1]-b[1])[0];//faces_top[Math.random()*faces_top.length|0];
    const door_center_x = door_face[0] + (door_face[2] - door_face[0]) / 2;
    ctx.fillStyle = 'black';
    const door_x = door_center_x - door_w / 2 - left;
    const door_y = door_face[1] + rect_wall_h - door_h - top;
    ctx.fillRect(door_x * scaler, door_y * scaler, door_w * scaler, door_h * scaler);

    ///////////////////////////////////////////////////////////////////////////////////////

    this.door_pos_ndc = [x0+(door_x+door_w/2)*scaler, x0+door_y*scaler];
    this.canvas = ctx.canvas;
    // this.rects_ndc = rects.rects.map(rect =>
    //   [
    //     x0 + (rect[0]-left) * scaler,
    //     x0 + (rect[1]-top) * scaler,
    //     rect[2] * scaler,
    //     rect[3] * scaler,
    //   ]
    // );
    this.faces_ndc = faces.map(side => side.map(line => [
      x0 + (line[0]-left) * scaler,
      x0 + (line[1]-top ) * scaler,
      x0 + (line[2]-left) * scaler,
      x0 + (line[3]-top ) * scaler,
    ]));
    this.wall_h_ndc = wall_h;
    this.type = 'room';

    // door interactive object
    const door_iobj = new InteractiveObject(this.door_pos_ndc[0]-door_w*scaler/2, this.door_pos_ndc[1]+door_h*scaler, door_w*scaler, 10, 'выйти');
    // interactive object can execute any code implemented outside of main game loop, f.e.
    // change game state calling ChangeGameState from utils.js.
    door_iobj.exec = () => {
      // ChangeGameState can provide some data for state handler in main game loop.
      ChangeGameState('ENTER_ROOM', {
        room_seed: null,
      });
    };
    this.interactives.push(door_iobj);

  }


  // ox, oy   -- old origin coordinates
  // dx, dy   -- new coordinates deltas
  // cdx, cdy -- additional deltas for new coordinates to check (can be replaced via ow,oh)
  // ow, oh   -- additinal for old coordinates in range checking
  collision(ox, oy, dx, dy, cdx, cdy, ow, oh) {
    // collision detection result
    this.last_collision.type = 'none';
    this.last_collision.dx = dx;
    this.last_collision.dy = dy;
    // check for walls
    for (let si = 0; si < this.faces_ndc.length; ++si) {
      for (let li = 0; li < this.faces_ndc[si].length; ++li) {
        const line = this.faces_ndc[si][li];
        if (si === 1 || si === 3) { // horisontal wall, vertical collision
          if (line[0] <= ox+ow && ox-ow <= line[2]) { // was in range
            const ny = oy + dy + cdy;
            // top
            if (si === 1 && oy > line[1]+this.wall_h_ndc && line[1]+this.wall_h_ndc >= ny) {
              this.last_collision.type = 'wall';
              this.last_collision.dy = 0;
              break;
            }
            // bottom
            if (si === 3 && oy < line[1] && line[1] <= ny) {
              this.last_collision.type = 'wall';
              this.last_collision.dy = 0;
              break;
            }
          }
        } else { // vertical wall, horisontal collision
          if (line[1] <= oy+oh && oy-oh <= line[3]+this.wall_h_ndc) { // was in range
            const nx = ox + dx + cdx;
            // left
            if (si === 0 && ox > line[0] && line[0] >= nx) {
              this.last_collision.type = 'wall';
              this.last_collision.dx = 0;
              break;
            }
            // right
            if (si === 2 && ox < line[0] && line[0] <= nx) {
              this.last_collision.type = 'wall';
              this.last_collision.dx = 0;
              break;
            }
          }
        }
      }
    }
    return this.last_collision;
  }




}
