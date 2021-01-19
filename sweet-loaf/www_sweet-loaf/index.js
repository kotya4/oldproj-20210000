/* gen by new.py at 2020-11-28 01:42:48.024758

Генерация комнат.

*/
window.onload = async function onload() {
  // if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 600;
  const width = 600;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;

  const rooms = new ConnectedRects({ max_w: 20, max_h: 20, min_w: 6, min_h: 6, min_strip: 3, min_face: 4, rects_num: 3 });

  const COLORS = Array(rooms.rects_num).fill().map(() => `rgb(${Array(3).fill().map(() => 100+Math.random()*156)})`);

  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  const offset_x = (width - (rooms.grid.bottom - rooms.grid.top)) >> 1;
  const offset_y = (height - (rooms.grid.right - rooms.grid.left)) >> 1;
  ctx.translate(offset_x, offset_y);
  const scaler = 4;
  ctx.scale(scaler, scaler);
  for (let y = rooms.grid.top; y <= rooms.grid.bottom; ++y) {
    for (let x = rooms.grid.left; x <= rooms.grid.right; ++x) {
      const i = rooms.grid.get(x, y);
      if (i != null) {
        ctx.fillStyle = COLORS[i];
        ctx.fillRect(x, y, 0.9, 0.9);
      }
    }
  }
  ctx.restore();
}


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
  faces(for_index, void_value, left, top, right, bottom, is_colored) {
    top = top || this.top;
    left = left || this.left;
    right = right || this.right;
    bottom = bottom || this.bottom;
    void_value = void_value === undefined ? null : void_value; // converts undefined to null
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
        const are_faces_ok = !grid.faces(i, null, x, y, x+w, y+h, true).some((side) => side.some((line) => {
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
