var Utils = {};


Utils.create_canvas = function (width, height, domElement=document.body) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  // ctx.canvas.style.width = '100%';
  ctx.canvas.style.imageRendering = 'pixelated';
  ctx.imageSmoothingEnabled = false;
  domElement.appendChild(ctx.canvas);
  return ctx;
};


// negative indices will be used, also no boundary checks
class InfinitGrid {
  constructor() {
    this.grid = [];
    this.top = 0;
    this.left = 0;
    this.right = 0;
    this.bottom = 0;
  }

  get(x, y) {
    if (this.grid[y] instanceof Array) {
      return this.grid[y][x];
    }
    return null;
  }

  fill_back(x, y, w, h, value) {
    let area = 0;
    if (x < this.left) this.left = x;
    if (x+w > this.right) this.right = x+w;
    if (y < this.top) this.top = y;
    if (y+h > this.bottom) this.bottom = y+h;
    for (let y0 = 0; y0 < h; ++y0) {
      if (!(this.grid[y0+y] instanceof Array)) {
        this.grid[y0+y] = [];
      }
      for (let x0 = 0; x0 < w; ++x0) {
        if (this.grid[y0+y][x0+x] == null) {
          this.grid[y0+y][x0+x] = value;
          ++area;
        }
      }
    }
    return area;
  }

  clear_value(value) {
    for (let y = this.top; y <= this.bottom; ++y)
      if (this.grid[y] instanceof Array)
        for (let x = this.left; x <= this.right; ++x)
          if (this.grid[y][x] === value)
            this.grid[y][x] = null;
  }

  // source: creature/grid.js->make_outlines,~205
  // Creates [side_left, side_top, side_right, side_bottom], where side_* contains array of lines, where
  // line is array of [x1, y1, x2, y2, neighbour_index], x2 >= x1, y2 >= y1.
  // If "for_index" is null then faces would be generated for all not "void_value"d cells.
  // If "is_colored" is true then faces will be separated with heighbour value (saved as fifth element).
  faces({ for_index, void_value, left, top, right, bottom, is_colored }) {
    top = top == null ? this.top : top;
    left = left == null ? this.left : left;
    right = right == null ? this.right : right;
    bottom = bottom == null ? this.bottom : bottom;
    for_index = for_index === undefined ? null : for_index; // converts undefined to null
    void_value = void_value === undefined ? null : void_value; // converts undefined to null
    is_colored = !!is_colored;
    const nullify = (v) => v === undefined ? void_value : v; // converts undefined to "void_value"
    const FCI = for_index != null; // "for certain index" flag (if not then for all non null)
    const FIV = FCI ? for_index : void_value; // "for_index" value
    const faces_L=[], faces_T=[], faces_R=[], faces_B=[];
    for (let y = top; y <= bottom; ++y) {
      if (!(this.grid[y] instanceof Array)) continue;
      for (let x = left; x <= right; ++x) {
        if (this.grid[y][x] == void_value) continue; // skip void cell.
        if (FCI && this.grid[y][x] != FIV) continue; // skip for certain index.
        const vL = nullify(this.grid[y][x-1]); // left
        if (vL == FIV ^ FCI) {
          const line = faces_L.find((line) => x === line[0] && y === line[3]);
          if (line && (!is_colored || vL == line[4])) line[3] = y+1; else faces_L.push([x, y, x, y+1, vL]);
        }
        const vR = nullify(this.grid[y][x+1]); // right
        if (vR == FIV ^ FCI) {
          const line = faces_R.find((line) => x+1 === line[0] && y === line[3]);
          if (line && (!is_colored || vR == line[4])) line[3] = y+1; else faces_R.push([x+1, y, x+1, y+1, vR]);
        }
        const vT = nullify(this.grid[y-1] instanceof Array ? this.grid[y-1][x] : void_value); // top
        if (!(this.grid[y-1] instanceof Array) || vT == FIV ^ FCI) {
          const line = faces_T.find((line) => y === line[1] && x === line[2]);
          if (line && (!is_colored || vT == line[4])) line[2] = x+1; else faces_T.push([x, y, x+1, y, vT]);
        }
        const vB = nullify(this.grid[y+1] instanceof Array ? this.grid[y+1][x] : void_value); // bottom
        if (!(this.grid[y+1] instanceof Array) || vB == FIV ^ FCI) {
          const line = faces_B.find((line) => y+1 === line[1] && x === line[2]);
          if (line && (!is_colored || vB == line[4])) line[2] = x+1; else faces_B.push([x, y+1, x+1, y+1, vB]);
        }
      }
    }
    return [faces_L, faces_T, faces_R, faces_B];
  }
}


class ConnectedRects {
  constructor({ max_w, max_h, min_w, min_h, min_strip, min_face, tries_num, rects_num }) {
    max_w = max_w || 15;
    max_h = max_h || 15;
    min_w = min_w || 4;
    min_h = min_h || 4;
    min_strip = min_strip || 3;
    min_face = min_face || 2;
    tries_num = tries_num || 100;
    rects_num = rects_num || 10;

    const grid = new InfinitGrid();
    const rects = [];

    for (let i = 0; i < rects_num; ++i) {
      for (let t = 0; t < tries_num; ++t) {
        const parent = rects[Math.random() * rects.length | 0] || [0, 0, 0, 0];
        const w = min_w + Math.random() * (max_w - min_w) | 0;
        const h = min_h + Math.random() * (max_h - min_h) | 0;
        const angle = Math.random() * Math.PI * 2;
        const r = (Math.min(parent[2], parent[3]) + Math.min(w, h)) / 2;
        const x = parent[0] + parent[2] / 2 + r * Math.cos(angle) - w / 2 | 0;
        const y = parent[1] + parent[3] / 2 + r * Math.sin(angle) - h / 2 | 0;

        if (grid.fill_back(x, y, w, h, i) === 0) continue; // area === 0

        // checks if every strip of rect equal or greater than min_strip.
        // strip is a one-colored line of cells closed with void/another color.
        const are_strips_ok = (() => {
          for (let x0 = 0; x0 < w; ++x0) { // vertical
            let strip_len = 0;
            let is_start_found = false;
            for (let y0 = 0; y0 < h; ++y0) {
              const value = grid.get(x0+x, y0+y);
              if (value === i) {
                is_start_found = true;
                ++strip_len;
                continue;
              }
              if (strip_len > 0 && strip_len < min_strip) {
                return false; // any strip less than min_strip is not ok.
              }
              is_start_found = false;
              strip_len = 0;
            }
            if (strip_len > 0 && strip_len < min_strip) {
              return false; // any strip less than min_strip is not ok.
            }
          }
          for (let y0 = 0; y0 < h; ++y0) { // horisontal
            let strip_len = 0;
            let is_start_found = false;
            for (let x0 = 0; x0 < w; ++x0) {
              const value = grid.get(x0+x, y0+y);
              if (value === i) {
                is_start_found = true;
                ++strip_len;
                continue;
              }
              if (strip_len > 0 && strip_len < min_strip) {
                return false; // any strip less than min_strip is not ok.
              }
              is_start_found = false;
              strip_len = 0;
            }
            if (strip_len > 0 && strip_len < min_strip) {
              return false; // any strip less than min_strip is not ok.
            }
          }
          return true; // ok
        })();

        if (!are_strips_ok) {
          grid.clear_value(i);
          continue;
        }

        // check if every two-side-colored face equal or greater than min_face
        const are_faces_ok = !grid.faces(
          { for_index: i, void_value: null, left: x, top: y, right: x+w, bottom: y+h, is_colored: true }
        ).some((side) => side.some((line) => {
          if (line[4] === null) return false; // not two-side-colored
          const w = Math.abs(line[2]-line[0]);
          const h = Math.abs(line[3]-line[1]);
          return w > 0 && w < min_face || h > 0 && h < min_face;
        }));

        if (!are_faces_ok) {
          grid.clear_value(i);
          continue;
        }

        // ok
        rects.push([x, y, w, h]);
        break;
      }
    }

    this.max_w = max_w;
    this.max_h = max_h;
    this.min_w = min_w;
    this.min_h = min_h;
    this.min_strip = min_strip;
    this.min_face = min_face;
    this.tries_num = tries_num;
    this.rects_num = rects_num;
    this.grid = grid;
    this.rects = rects;
  }
}


class Wallpaper {
  constructor(wall_width, wall_height, opt = {}) {
    const {
      is_line=Math.random()>0.3,
      is_pattern=Math.random()>0.4,
      base_value=Math.random()*200,
      base_color=Array(3).fill().map(() => Math.random()*256),
      is_inverse_dirt=false,
    } = opt;

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.height = wall_height;
    ctx.canvas.width = wall_width;
    ctx.imageSmoothingEnabled = false;

    // const base_value = Math.random()*200;
    ctx.fillStyle = `rgb(${base_value},${base_value},${base_value})`;
    ctx.fillRect(0, 0, wall_width, wall_height);

    const base_opacity = 0.1;
    // const base_color = Array(3).fill().map(() => Math.random() * 256);
    ctx.fillStyle = `rgba(${base_color},${base_opacity})`;
    ctx.fillRect(0, 0, wall_width, wall_height);

    const pattern_width = 5+Math.random()*10|0;
    const pattern_height = 5+Math.random()*10|0;
    const pattern_offset_x = pattern_width+Math.random()*pattern_width|0;
    const pattern_offset_y = pattern_height+Math.random()*pattern_height|0;
    const pattern_x0 = Math.random() * pattern_width|0;
    const pattern_y0 = Math.random() * pattern_height|0;
    const pattern_offset_acc = (pattern_height+pattern_offset_y)*Math.random()|0;
    if (is_pattern) {
      const pattern_mirror_x = Math.random()>0.5;
      const pattern_mirror_y = Math.random()>0.5;
      const pattern_color = Array(3).fill().map(() => Math.random()*256);
      const pattern_dist = Math.random()*0.4;
      const pattern_img = Array(pattern_width*pattern_height).fill(0);
      const pattern_opacity = 0.3+Math.random()*0.5;
      for (let y = 0; y < pattern_height; ++y)
        for (let x = 0; x < pattern_width; ++x)
      {
        pattern_img[x + pattern_width*y] = Math.random()<pattern_dist ? 1 : 0;
      }
      if (pattern_mirror_x) {
        for (let y = 0; y < pattern_height; ++y)
          for (let x = 0; x < pattern_width/2; ++x)
        {
          pattern_img[x + pattern_width*y] = pattern_img[(pattern_width-x-1) + pattern_width*y];
        }
      }
      if (pattern_mirror_y) {
        for (let x = 0; x < pattern_width; ++x)
          for (let y = 0; y < pattern_height/2; ++y)
        {
          pattern_img[x + pattern_width*y] = pattern_img[x + pattern_width*(pattern_height-y-1)];
        }
      }
      for (let y = 0; y <= wall_height+pattern_offset_y; y += pattern_height + pattern_offset_y) {
        let i = 0;
        for (let x = 0; x <= wall_width+pattern_offset_x; x += pattern_width + pattern_offset_x) {
          i++;
          for (let py = 0; py < pattern_height; ++py)
            for (let px = 0; px < pattern_width; ++px)
          {
            const pi = pattern_img[px + pattern_width * py];
            if (pi === 0) continue;
            ctx.fillStyle = `rgba(${pattern_color}, ${pattern_opacity})`;
            ctx.fillRect(x+px-pattern_x0, y+py-(pattern_offset_acc)*(i%2===0|0)-pattern_y0, 1, 1);
          }
        }
      }
    }

    if (is_line) {
      // const line_offset = 5 + Math.random() * 10 | 0;
      // const line_num = 1 + Math.random() * (line_offset >> 1) | 0;
      const line_offset = (pattern_width + pattern_offset_x);
      const line_num = 1 + Math.random()*pattern_offset_x/4 | 0;
      for (let k = 0; k < line_num; ++k) {
        const line_color = Array(3).fill().map(() => Math.random() * 256);
        let line_opacity_min = Math.random();
        let line_opacity_max = Math.random();
        if (line_opacity_min > line_opacity_max) [line_opacity_max, line_opacity_min] = [line_opacity_min, line_opacity_max];
        for (let x = k; x <= wall_width+line_offset; x += line_offset) {
          ctx.fillStyle = `rgba(${line_color},${line_opacity_min+Math.random()*(line_opacity_max-line_opacity_min)})`;
          ctx.fillRect(x-pattern_x0-(pattern_offset_x>>1)-(line_num>>1), 0, 1, wall_height);
        }
      }
    }

    // const dirt_dist = 4;
    const dirt_num = 10+Math.random()*5|0;
    const dirt_size = 2+Math.random()*2|0;
    const dirt_color = base_color.map(e => Math.min(e, 150));//Array(3).fill().map(() => Math.random()*150);
    for (let k = 0; k < dirt_num; ++k) {
      // const dirt_dist_value = Math.max(Math.min(1, Math.random()*dirt_dist)*dirt_dist-dirt_dist/2,0);
      const dirt_radius_x = 10+Math.random()*(30) | 0;
      const dirt_radius_y = 10+Math.random()*(30) | 0;
      let dirt_dist_x = Math.random();
      let dirt_dist_y = Math.random();
      // Math.random()>0.5 ? (dirt_dist_x = dirt_dist_value) : (dirt_dist_y = dirt_dist_value);
      // Math.random()>0.5 ?
      // dirt_radius_y > dirt_radius_x ? (dirt_dist_x = (Math.random()>0.5|0)) : (dirt_dist_y = (Math.random()>0.5|0));
      if (is_inverse_dirt) { // is dirt in center
        // if (dirt_radius_y > dirt_radius_x) dirt_dist_x = Math.random(); else dirt_dist_y = Math.random();
      } else {
        if (dirt_radius_y > dirt_radius_x) dirt_dist_x = Math.random() > 0.5 | 0; else dirt_dist_y = Math.random() > 0.5 | 0;
      }
      const dirt_x = dirt_dist_x*wall_width  | 0;
      const dirt_y = dirt_dist_y*wall_height | 0;
      const dirt_opacity = 0.075;
      const dirt_divisor = 1;//0.5+Math.random()*2;
      for (let y = -dirt_radius_y; y < +dirt_radius_y; y += dirt_size)
        for (let x = -dirt_radius_x; x < +dirt_radius_x; x += dirt_size)
      {
        const dirt_pixel_size = dirt_size
                              + Math.random() * ((dirt_radius_x-Math.abs(x)/dirt_divisor || 1) / dirt_radius_x)
                              * Math.random() * ((dirt_radius_x-Math.abs(x)/dirt_divisor || 1) / dirt_radius_x)
                              // * (dirt_size + Math.random() * 20);
      ctx.fillStyle = `rgba(${dirt_color},${dirt_opacity})`;
        if (dirt_pixel_size > 0)
          if (Math.random() * ((dirt_radius_y-Math.abs(y)/dirt_divisor || 1) / dirt_radius_y) > 0.4)
            if ((x/dirt_radius_x) ** 2 + (y/dirt_radius_y) ** 2 < 1)
              ctx.fillRect(x + dirt_x, y + dirt_y, dirt_pixel_size, dirt_pixel_size);
      }
    }

    this.canvas = ctx.canvas;
  }
}


class Floor {
  constructor(floor_w, floor_h, opt = {}) {
    const {
      pattern_type=Math.random()*3|0,
      pattern_colors=Array(1+Math.random()*3|0).fill().map(() => Array(3).fill().map(() => 50+Math.random()*50)),
      is_monocolor=Math.random() > 0.6,
      pattern_dirt_num=Math.random()*20,
    } = opt;

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.height = floor_h;
    ctx.canvas.width = floor_w;
    ctx.imageSmoothingEnabled = false;

    // const pattern_type = Math.random()*3|0;

    const offset_scaler = (pattern_type === 2) ? 1.75 : 1+Math.random()*4|0;
    const offset_x = 6*offset_scaler|0;
    const offset_y = 6*offset_scaler|0;

    const x0 = (Math.random() - 0.5) * offset_x | 0;
    const y0 = (Math.random() - 0.5) * offset_y | 0;

    const pattern_mod_x = Math.random()*10;
    const pattern_mod_y = Math.random()*10;
    // const pattern_colors_num = 1+Math.random()*3|0;
    // const pattern_colors = Array(pattern_colors_num).fill().map(() => Array(3).fill().map(() => 50+Math.random()*50));
    // multicolor/monocolor
    if (is_monocolor) {
      const mag = 1.5 - Math.random();
      for (let i = 1; i < pattern_colors.length; ++i) {
        pattern_colors[i][0] = pattern_colors[0][0]*mag;
        pattern_colors[i][1] = pattern_colors[0][1]*mag;
        pattern_colors[i][2] = pattern_colors[0][2]*mag;
      }
    }
    const pattern_offset_color = pattern_colors[Math.random()*pattern_colors.length|0].map(e => e * 1.5);
    const pattern_dirt_color = pattern_colors[Math.random()*pattern_colors.length|0].map(e => e / 1.5);
    // const pattern_dirt_num = Math.random()*20;
    const pattern_offset_mod = 0.5+Math.random()/2;


    function bresenham(ctx, x1, y1, x2, y2) {
      const dx = Math.abs(x2 - x1) | 0;
      const dy = Math.abs(y2 - y1) | 0;
      const sx = x1 < x2 ? +1 : -1;
      const sy = y1 < y2 ? +1 : -1;
      let err = (dx > dy ? dx : -dy) >> 1;
      for (let i = dx + dy + 1; i > 0; --i) {
        ctx.fillRect(x1, y1, 1, 1);
        if (x1 === x2 && y1 === y2) break;
        if (err >= -dx) { err -= dy; x1 += sx; }
        if (err <   dy) { err += dx; y1 += sy; }
      }
    }


    // плитка
    if (pattern_type === 0) {
      for (let y = -offset_y; y < floor_h + offset_y * 3; y += offset_y) {
        let i = 0;
        for (let x = -offset_x; x < floor_w + offset_x * 2; x += offset_x) {
          const posm = [x0+x, y0+y-(offset_y>>1)*(i++%2)];
          const posl = [posm[0]-(offset_x), posm[1]+(offset_y>>1)];
          const posr = [posm[0]+(offset_x), posm[1]+(offset_y>>1)];
          const posb = [posm[0], posm[1]+offset_y];

          const patt = Math.abs(x/offset_x*pattern_mod_x+y/offset_y*pattern_mod_y);
          ctx.fillStyle = `rgb(${pattern_colors[patt%pattern_colors.length|0]})`;
          ctx.beginPath();
          ctx.moveTo(posm[0], posm[1]+1);
          ctx.lineTo(posl[0], posl[1]+1);
          ctx.lineTo(posb[0], posb[1]+1);
          ctx.lineTo(posr[0], posr[1]+1);
          ctx.closePath();
          ctx.fill();

          for (let i = 0; i < Math.random()*pattern_dirt_num; ++i) {
            ctx.fillStyle = `rgba(${pattern_dirt_color}, ${Math.random()/2})`;
            ctx.fillRect(posm[0]-offset_x/2+Math.random()*offset_x|0, posm[1]+Math.random()*offset_y/2|0, 1, 1);
          }
        }
      }

      for (let y = -offset_y; y < floor_h + offset_y * 3; y += offset_y) {
        let i = 0;
        for (let x = -offset_x; x < floor_w + offset_x * 2; x += offset_x) {
          const posm = [x0+x, y0+y-(offset_y>>1)*(i++%2)];
          const posl = [posm[0]-(offset_x), posm[1]+(offset_y>>1)];
          const posr = [posm[0]+(offset_x), posm[1]+(offset_y>>1)];
          ctx.fillStyle = `rgba(${pattern_offset_color}, ${Math.random()*pattern_offset_mod})`;
          bresenham(ctx, posm[0], posm[1], posr[0], posr[1]);
          ctx.fillStyle = `rgba(${pattern_offset_color}, ${Math.random()*pattern_offset_mod})`;
          bresenham(ctx, posm[0], posm[1], posl[0], posl[1]);
        }
      }
    }

    // ковролин
    else if (pattern_type === 1) {
      ctx.fillStyle = `rgba(${pattern_colors[0]})`;
      ctx.fillRect(x0-offset_x, y0-offset_y, floor_w + offset_x * 2, floor_h + offset_y * 3);
      for (let i = 0; i < Math.random()*(floor_w*floor_h*pattern_dirt_num); ++i) {
        ctx.fillStyle = `rgba(${pattern_dirt_color}, ${Math.random()/2})`;
        ctx.fillRect(x0-offset_x+Math.random()*(floor_w + offset_x * 2)|0, y0-offset_y+Math.random()*(floor_h + offset_y * 3), 1, 1);
      }
    }

    // паркет
    else if (pattern_type === 2) {
      const row_colors_indices = Array(floor_w / offset_x | 0).fill().map(() => Math.random()*pattern_colors.length|0);

      let k = 0;
      for (let y = -offset_y; y < floor_h + offset_y * 3; y += offset_y) {
        let i = 0;
        let index = -k;
        let inversed = true;
        for (let x = -offset_x; x < floor_w + offset_x * 2; x += offset_x) {
          const posm = [x0+x, y0+y-(offset_y>>1)*(i++%2)];
          const posl = [posm[0]-(offset_x), posm[1]+(offset_y>>1)];
          const posr = [posm[0]+(offset_x), posm[1]+(offset_y>>1)];
          const posb = [posm[0], posm[1]+offset_y];

          const is_changed = Math.random() > 0.85;
          if (is_changed) {
            const ii = Math.abs(index)%row_colors_indices.length;
            const oldi = row_colors_indices[ii];
            let newi = Math.random()*pattern_colors.length|0;
            if (newi === oldi) newi = (newi + 1) % pattern_colors.length;
            row_colors_indices[ii] = newi;
          }

          if ((inversed = !inversed)) ++index;
          const color =  pattern_colors[row_colors_indices[Math.abs(index)%row_colors_indices.length]];

          ctx.fillStyle = `rgb(${color})`;
          ctx.beginPath();
          ctx.moveTo(posm[0]+0, posm[1]+0);
          ctx.lineTo(posl[0]-1, posl[1]+0);
          ctx.lineTo(posb[0]+0, posb[1]+0);
          ctx.lineTo(posr[0]+1, posr[1]+0);
          ctx.closePath();
          ctx.fill();

          for (let i = 0; i < Math.random()*pattern_dirt_num; ++i) {
            ctx.fillStyle = `rgba(${pattern_dirt_color}, ${Math.random()/4})`;
            ctx.fillRect(posm[0]-offset_x/2+Math.random()*offset_x|0, posm[1]+Math.random()*offset_y/2|0, 1, 1);
          }

          if (is_changed) {
            ctx.fillStyle = `rgba(${pattern_offset_color}, ${0.5+Math.random()/2})`;
            bresenham(ctx, posm[0]-1, posm[1], posl[0]-1, posl[1]);
          }
        }
        ++k;
      }

      for (let y = -offset_y; y < floor_h + offset_y * 3; y += offset_y) {
        let i = 0;
        for (let x = -offset_x; x < floor_w + offset_x * 2; x += offset_x) {
          const posm = [x0+x, y0+y-(offset_y>>1)*(i++%2)];
          const posl = [posm[0]-(offset_x), posm[1]+(offset_y>>1)];
          const posr = [posm[0]+(offset_x), posm[1]+(offset_y>>1)];
          ctx.fillStyle = `rgba(${pattern_offset_color}, ${0.5})`;
          bresenham(ctx, posm[0], posm[1], posr[0], posr[1]);
        }
      }
    }

    this.canvas = ctx.canvas;
    this.pattern_colors = pattern_colors;
  }
}


class InteractiveObject {
  constructor(x, y, w, h, name) {
    this.rect = [x, y, w, h];
    this.name = name;
    // this.data = data;
  }

  collision(nx, ny) {
    return (this.rect[0] <= nx && nx <= this.rect[0]+this.rect[2] && this.rect[1] <= ny && ny <= this.rect[1]+this.rect[3]);
  }

  draw(ctx) {
    ctx.strokeStyle = 'red';
    ctx.strokeRect(...this.rect);
  }

  exec() {
    console.log(`pure InteractiveObject "${name}" was executed.`);
  }
}


var GAMESTATE_CURRENT = null;
var GAMESTATE_FUTURE = null;
var GAMESTATE_DELAY = 1; // in secs
var GAMESTATE_TIME = GAMESTATE_DELAY;
var GAMESTATE_DATA = null;

function ChangeGameState(to, data=null) {
  if (to == null) throw Error('Cannot change game state to null');
  GAMESTATE_CURRENT = null;
  GAMESTATE_FUTURE = to;
  GAMESTATE_TIME = GAMESTATE_DELAY;
  GAMESTATE_DATA = data;
}

function ProcGameState(delta) {
  // state must to be changed
  if (GAMESTATE_CURRENT !== GAMESTATE_FUTURE) {
    GAMESTATE_TIME -= delta; // timer goes down
    if (GAMESTATE_TIME <= 0) { // if timer gone
      GAMESTATE_CURRENT = GAMESTATE_FUTURE; // state changing
      return 2;
    }
    return 1;
  }
  // state changed and display fades to normal
  else if (GAMESTATE_TIME <= GAMESTATE_DELAY) {
    GAMESTATE_TIME += delta;
    return 3;
  }
  // state not changing at all
  else {
    return 0;
  }
}
