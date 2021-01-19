//
// Оригинал в @js/bus/
class Grid {
  constructor(width, height) {
    this.height = height;
    this.width = width;
    this.grid = Array(width * height).fill(-1);
  }

  // Converts grid-coordinates into grid-index.
  I(x, y) {
    return (x < 0 || x >= this.width || y < 0 || y >= this.height) ? -1 : ~~x + ~~y * this.width;
  }

  // Draws grid.
  // cell_size  "Grid-space to Screen-space" mapper.
  // colors     Array of "ctx.fillStyle"-compatible strings.
  draw_grid(ctx, cell_size=5, colors=[]) {
    // draws colored grid-cells.
    for (let y = 0; y < this.height; ++y)
      for (let x = 0; x < this.width; ++x)
    {
      const i = this.I(x, y);
      if (this.grid[i] < 0) continue;
      if (colors.length) ctx.fillStyle = colors[this.grid[i] % colors.length];
      ctx.fillRect(x * cell_size, y * cell_size, cell_size, cell_size);
    }
    // draws background.
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(55, 55, 55, 0.2)';
    for (let y = 1; y < this.height; ++y) {
      ctx.moveTo(                     0, y * cell_size);
      ctx.lineTo(this.width * cell_size, y * cell_size);
    }
    for (let x = 1; x < this.width; ++x) {
      ctx.moveTo(x * cell_size,                       0);
      ctx.lineTo(x * cell_size, this.height * cell_size);
    }
    ctx.stroke();
  }

  //
  fill_random(thres=0.5) {
    this.grid.forEach((_,i) => this.grid[i] = Math.sign(Math.random() - thres));
  }

  // Fills grid with "grid-structure" (lattice).
  fill_lattice() {
    for (let y = 0; y < this.height; y += 2)
      for (let x = 0; x < this.width; ++x)
        this.grid[this.I(x, y)] = 1;
    for (let x = 0; x < this.width; x += 2)
      for (let y = 0; y < this.height; ++y)
        this.grid[this.I(x, y)] = 1;
  }

  // Makes maze out of lattice by randomly connecting lattice-cells.
  // Probably you need to call "fill_lattice" at first to see correct result.
  fill_lattice_maze(ctx) {
    const LEFT   = 0b0001;
    const TOP    = 0b0010;
    const RIGHT  = 0b0100;
    const BOTTOM = 0b1000;
    // Must be floor(S/2), S%2==1
    const w = this.width >> 1;
    const h = this.height >> 1;
    const m = Array(w * h).fill(0b0000);

    function __set_possible_direction(i) {
      const x = i % w;
      const y = i / w | 0;
      // Choose random direction, but not the existing or out of boundaries.
      const possible_dirs = [];
      !(m[i] &    TOP) && (y-1 >= 0) && possible_dirs.push(TOP);
      !(m[i] &   LEFT) && (x-1 >= 0) && possible_dirs.push(LEFT);
      !(m[i] &  RIGHT) && (x+1 <  w) && possible_dirs.push(RIGHT);
      !(m[i] & BOTTOM) && (y+1 <  h) && possible_dirs.push(BOTTOM);
      // Set choosen direction to the current and neighbour points, make
      // neighbour point as current and continue.
      let pv = -1; // Previous value of neighbour point.
      if (possible_dirs.length) {
        const dir = possible_dirs[Math.random() * possible_dirs.length | 0];
        m[i] |= dir;
        if      (dir ===    TOP) { pv = m[i = (x  )+(y-1)*w]; m[i] |= BOTTOM; }
        else if (dir ===   LEFT) { pv = m[i = (x-1)+(y  )*w]; m[i] |=  RIGHT; }
        else if (dir ===  RIGHT) { pv = m[i = (x+1)+(y  )*w]; m[i] |=   LEFT; }
        else if (dir === BOTTOM) { pv = m[i = (x  )+(y+1)*w]; m[i] |=    TOP; }
      }
      // Returns neighbour point index if only previous value of it was 0,
      // overwise returns -1 (and forces algorithm to find new neighbour point).
      return pv ? -1 : i;
    }

    // For more randomness, we'll generate permutation table.
    const perm_i = m.map((_,i) => i);
    for (let i = perm_i.length - 1; i > 0; --i) {
      const k = Math.random() * (1 + i) | 0;
      [perm_i[i], perm_i[k]] = [perm_i[k], perm_i[i]];
    }
    // To start, pick a random point with zero value.
    let mi = perm_i[0];

    // Algorithm is done when all points are have a direction.
    for (let k = 0; k < m.length; ++k) {
      // Changes mi and m if can.
      mi = __set_possible_direction(mi);
      if (mi < 0) {
        // Point refused.
        --k;
        // No directions to move. Pick one of non-zero points that has a zero point neighbour.
        for (let i = 0; i < perm_i.length; ++i) {
          const pi = perm_i[i];
          if (m[pi] !== 0b0000 && m[pi] !== 0b1111) {
            const x = pi % w;
            const y = pi / w | 0;
            if (!(m[pi] &    TOP) && (y-1 >= 0) && m[(x  )+(y-1)*w] === 0b0000
            ||  !(m[pi] &   LEFT) && (x-1 >= 0) && m[(x-1)+(y  )*w] === 0b0000
            ||  !(m[pi] &  RIGHT) && (x+1 <  w) && m[(x+1)+(y  )*w] === 0b0000
            ||  !(m[pi] & BOTTOM) && (y+1 <  h) && m[(x  )+(y+1)*w] === 0b0000)
            {
              mi = pi;
              break;
            }
          }
        }
        // If no free-neighbour points exist, then algorithm is done.
        if (mi < 0) {
          break;
        }
      }
    }

    // Connect starting point with something.
    __set_possible_direction(perm_i[0]);

    // Done. Now we need to modify grid itself.
    for (let y = 0; y < h; ++y)
      for (let x = 0; x < w; ++x)
    {
      const gx = (x << 1) + 1;
      const gy = (y << 1) + 1;
      const mv = m[x + y * w];
      if (mv &    TOP) this.grid[this.I(gx  , gy-1)] = -1;
      if (mv &   LEFT) this.grid[this.I(gx-1, gy  )] = -1;
      if (mv &  RIGHT) this.grid[this.I(gx+1, gy  )] = -1;
      if (mv & BOTTOM) this.grid[this.I(gx  , gy+1)] = -1;
    }
  }

  // Fills grid with rectangles and retuns their coordinates and sizes.
  // depth         How many rects will have a child.
  // tries         How many times child will try to place itself before giving up.
  // min_*, max_*  Minimum and maximum width/height for each rect.
  fill_rects(depth=2, tries=2, min_w=5, max_w=10, min_h=5, max_h=10) {
    const __rangeint = (min, max) => min + Math.random() * (max - min) | 0;

    const rects = [];
    const w0 = __rangeint(min_w, max_w);
    const h0 = __rangeint(min_h, max_h);
    const x0 = (this.width - w0) >> 1;
    const y0 = (this.height - h0) >> 1;
    rects.push([x0, y0, w0, h0]);

    for (let i = 0; i < rects.length; ++i) {
      const [x, y, w, h] = rects[i];
      // place_room_in_grid
      const in_foreground = Math.random() < 0.5; // imposition
      for (let _y = 0; _y < h; ++_y)
        for (let _x = 0; _x < w; ++_x)
      {
        const gi = this.I(x + _x, y + _y);
        if (in_foreground || this.grid[gi] === -1) {
          this.grid[gi] = i;
        }
      }
      // creates rect near by parent (kind of blue noise)
      if (i >= depth) continue;
      const ox = x + w / 2;
      const oy = y + h / 2;
      let a = Math.random() * Math.PI * 2;
      const da = Math.PI * 2 / tries;
      for (let k = 0; k < tries; ++k) {
        a += da;
        const nw = __rangeint(min_w, max_w);
        const nh = __rangeint(min_h, max_h);
        const r = (Math.min(w, h) + Math.min(nw, nh)) / 2;
        const nox = ox + r * Math.cos(a);
        const noy = oy + r * Math.sin(a);
        const ni = this.I(nox, noy);
        if (ni < 0 || this.grid[ni] !== -1) continue;
        const nx = nox - nw / 2 | 0;
        const ny = noy - nh / 2 | 0;
        rects.push([nx, ny, nw, nh]);
      }
    }

    return rects;
  }

  // Creates outline for each grid-cell and connects
  // colinear ones into one big line.
  // for_index            Creates outlines for specific index stored in grid-cell.
  //                      "null" if all non-negative indices are allowed.
  // ignore_grid_borders  Allow to create lines which are out of grid range.
  make_outlines(for_index=null, ignore_grid_borders=true) {
    const FCI = for_index != null; // "for certain index" flag (if not then for all non -1)
    const FIV = FCI ? for_index : -1; // "for_index" value
    const lines_l=[], lines_t=[], lines_r=[], lines_b=[];
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const oi = this.I(x, y);
        if (this.grid[oi] < 0) continue; // skip void cells.
        if (FCI && this.grid[oi] !== FIV) continue; // skip for certain index.
        const li = this.I(x-1, y  ),
              ti = this.I(x  , y-1),
              ri = this.I(x+1, y  ),
              bi = this.I(x  , y+1);
        if ((ignore_grid_borders || li >= 0) && (li < 0 || this.grid[li] === FIV ^ FCI)) {
          const line = lines_l.find((line) => x === line[0] && y === line[3]);
          if (line) line[3] = y+1; else lines_l.push([x, y, x, y+1]);
        }
        if ((ignore_grid_borders || ti >= 0) && (ti < 0 || this.grid[ti] === FIV ^ FCI)) {
          const line = lines_t.find((line) => y === line[1] && x === line[2]);
          if (line) line[2] = x+1; else lines_t.push([x, y, x+1, y]);
        }
        if ((ignore_grid_borders || ri >= 0) && (ri < 0 || this.grid[ri] === FIV ^ FCI)) {
          const line = lines_r.find((line) => x+1 === line[0] && y === line[3]);
          if (line) line[3] = y+1; else lines_r.push([x+1, y, x+1, y+1]);
        }
        if ((ignore_grid_borders || bi >= 0) && (bi < 0 || this.grid[bi] === FIV ^ FCI)) {
          const line = lines_b.find((line) => y+1 === line[1] && x === line[2]);
          if (line) line[2] = x+1; else lines_b.push([x, y+1, x+1, y+1]);
        }
      }
    }
    return [lines_l, lines_t, lines_r, lines_b];
  }

  // Draws outlines.
  draw_outlines(ctx, outlines, scaler) {
    ctx.beginPath();
    outlines.forEach((side) =>
      side.forEach((line) => {
        const [p1, p2] = line; // points
        ctx.moveTo(p1[0] * scaler, p1[1] * scaler);
        ctx.lineTo(p2[0] * scaler, p2[1] * scaler);
      })
    );
    ctx.stroke();
  }

  // Collects points from outlines and removes duplicates,
  // so lines can share their points with neighbours.
  // New structure (joined_outlines) will be created.
  make_joined_outlines(outlines) {
    const points = []; // Set.
    const joined = outlines.map((side) => {
      const rlines = [];
      side.forEach((line) => {
        if (line == null) return;
        let p1 = points.find(p => p[0] === line[0] && p[1] === line[1]);
        let p2 = points.find(p => p[0] === line[2] && p[1] === line[3]);
        if (null == p1) points.push(p1 = line.slice(0, 2));
        if (null == p2) points.push(p2 = line.slice(2, 4));
        rlines.push([p1, p2]);
      });
      return rlines;
    });
    return { joined, points };
  }

  // Expands area covered with outlines moving joined points away
  // from center of figure represented w/ that area.
  expand_joined_outlines(joined, scaler) {
    joined[0].forEach((rl) => { rl[0][0] -= scaler; rl[1][0] -= scaler; });
    joined[1].forEach((rl) => { rl[0][1] -= scaler; rl[1][1] -= scaler; });
    joined[2].forEach((rl) => { rl[0][0] += scaler; rl[1][0] += scaler; });
    joined[3].forEach((rl) => { rl[0][1] += scaler; rl[1][1] += scaler; });
  }

  // Draws joined outlines.
  draw_joined_outlines(ctx, joined, scaler) {
    ctx.beginPath();
    joined.forEach((side) => side.forEach((rl) => {
      ctx.moveTo(rl[0][0] * scaler, rl[0][1] * scaler);
      ctx.lineTo(rl[1][0] * scaler, rl[1][1] * scaler);
    }));
    ctx.stroke();
  }
}
