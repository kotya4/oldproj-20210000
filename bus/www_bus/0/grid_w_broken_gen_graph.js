// Класс описывает двумерную матрицу и разные странные штуки,
// позволяющие вытянуть разную странную информацию из данной
// структуры.
// Оригинал в @js/liminal/
class Grid {
  constructor(width, height) {
    this.height = height;
    this.width = width;
    this.grid = Array(width * height).fill(-1);
  }

  // Converts coordinates into grid index.
  I(x, y) {
    return (x < 0 || x >= this.width || y < 0 || y >= this.height) ? -1 : ~~x + ~~y * this.width;
  }

  // Draws grid into canvas.
  draw_grid(ctx, cell_size=5, colors=[]) {
    // colors on grid
    for (let y = 0; y < this.height; ++y)
      for (let x = 0; x < this.width; ++x)
    {
      const i = this.I(x, y);
      if (this.grid[i] < 0) continue;
      if (colors.length) ctx.fillStyle = colors[this.grid[i] % colors.length];
      ctx.fillRect(x * cell_size, y * cell_size, cell_size, cell_size);
    }
    // grid itself
    ctx.beginPath();
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

  gen_cage() {
    for (let y = 0; y < this.height; y += 2)
      for (let x = 0; x < this.width; ++x)
        this.grid[this.I(x, y)] = 1;
    for (let x = 0; x < this.width; x += 2)
      for (let y = 0; y < this.height; ++y)
        this.grid[this.I(x, y)] = 1;
  }


  // Before running this method you need call "gen_cage".
  // "grid" HAVE TO have odd width and height.
  gen_graph(ctx) {
    const LEFT   = 0b0001;
    const TOP    = 0b0010;
    const RIGHT  = 0b0100;
    const BOTTOM = 0b1000;
    // Must be floor(S/2), S%2==1
    const w = this.width >> 1;
    const h = this.height >> 1;
    const m = Array(w * h).fill(0b0000);
    // Changes m if can.
    m.set_possible_direction = function (i) {
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
      mi = m.set_possible_direction(mi);
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
        // If no free-naighbour points exist, then algorith is done.
        if (mi < 0) {
          break;
        }
      }
    }

    // Connect starting point with something.
    m.set_possible_direction(perm_i[0]);

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

  // Before running this method you need call "gen_cage".
  // "grid" HAVE TO have odd width and height.
  gen_pretty_symbols() {
    const LEFT   = 0b0001;
    const TOP    = 0b0010;
    const RIGHT  = 0b0100;
    const BOTTOM = 0b1000;
    // Must be floor(S/2), S%2==1
    const w = this.width >> 1;
    const h = this.height >> 1;
    const m = Array(w * h).fill(0b0000);
    // Changes m if can.
    m.set_possible_direction = function (i) {
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
      if (possible_dirs.length) {
        const dir = possible_dirs[Math.random() * possible_dirs.length | 0];
        m[i] |= dir;
        if      (dir ===    TOP) m[i = (x  )+(y-1)*w] = BOTTOM;
        else if (dir ===   LEFT) m[i = (x-1)+(y  )*w] =  RIGHT;
        else if (dir ===  RIGHT) m[i = (x+1)+(y  )*w] =   LEFT;
        else if (dir === BOTTOM) m[i = (x  )+(y+1)*w] =    TOP;
        return i;
      }
      return -1;
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
    for (let _ = 0; _ < m.length; ++_) {
      // Changes mi and m if can.
      mi = m.set_possible_direction(mi);
      if (mi < 0) {
        // No directions to move, so pick one of free-neighbour non-zero point.
        for (let i = 0; i < perm_i.length; ++i) {
          if (m[perm_i[i]] !== 0b0000 && m[perm_i[i]] !== 0b1111) {
            mi = perm_i[i];
            break;
          }
        }
        // If no free-naighbour points exist, then algorith is done.
        if (mi < 0) break;
      }
    }

    // Connect starting point with something.
    m.set_possible_direction(perm_i[0]);

    // Done. Now we need to modify grid itself. Draw only right and bottom edges.
    for (let y = 0; y < h; ++y)
      for (let x = 0; x < w; ++x)
    {
      const gx = (x << 1) + 1;
      const gy = (y << 1) + 1;
      const mv = m[x + y * w];
      if (mv & RIGHT)  this.grid[this.I(gx+1, gy  )] = -1;
      if (mv & BOTTOM) this.grid[this.I(gx  , gy+1)] = -1;
    }
  }

  calc_outlines() {
    // Собираем куски линий и соединяем колинеарные.
    // Соединение выполняется только в случае, если следующая линия находится
    // ниже или правее коллинеарной ей линии из lines_* ровно на один блок, т.е.:
    //   для вертикальных: Px* == Lx*, Py1 == Ly2 ;
    //   для горизонтальных: Py* == Ly*, Px1 == Lx2 .
    const lines_l = [];
    const lines_t = [];
    const lines_r = [];
    const lines_b = [];
    for (let y = 0; y < this.height; ++y) {
      for (let x = 0; x < this.width; ++x) {
        const oi = this.I(x  , y  );
        if (this.grid[oi] === -1) continue;
        const li = this.I(x-1, y  );
        const ti = this.I(x  , y-1);
        const ri = this.I(x+1, y  );
        const bi = this.I(x  , y+1);
        // Мы проверяем индексы на выход за границы, потому что
        // нам не нужно обводить линиями внешний каркас.
        if (li >= 0 && this.grid[li] === -1) {
          const line = lines_l.find((line) => x === line[0] && y === line[3]);
          if (line) line[3] = y+1; else lines_l.push([x, y, x, y+1]);
        }
        if (ti >= 0 && this.grid[ti] === -1) {
          const line = lines_t.find((line) => y === line[1] && x === line[2]);
          if (line) line[2] = x+1; else lines_t.push([x, y, x+1, y]);
        }
        if (ri >= 0 && this.grid[ri] === -1) {
          const line = lines_r.find((line) => x+1 === line[0] && y === line[3]);
          if (line) line[3] = y+1; else lines_r.push([x+1, y, x+1, y+1]);
        }
        if (bi >= 0 && this.grid[bi] === -1) {
          const line = lines_b.find((line) => y+1 === line[1] && x === line[2]);
          if (line) line[2] = x+1; else lines_b.push([x, y+1, x+1, y+1]);
        }
      }
    }
    return [lines_l, lines_t, lines_r, lines_b];
  }

  join_outlines(outlines) {
    const points = []; // Set.
    const joined = outlines.map((side) => {
      const rlines = [];
      side.forEach((line) => {
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

  expand_joined_outlines(joined, scaler) {
    joined[0].forEach((rl) => { rl[0][0] -= scaler; rl[1][0] -= scaler; });
    joined[1].forEach((rl) => { rl[0][1] -= scaler; rl[1][1] -= scaler; });
    joined[2].forEach((rl) => { rl[0][0] += scaler; rl[1][0] += scaler; });
    joined[3].forEach((rl) => { rl[0][1] += scaler; rl[1][1] += scaler; });
  }

  draw_joined_outlines(ctx, joined, scaler) {
    ctx.beginPath();
    joined.forEach((side) => side.forEach((rl) => {
      ctx.moveTo(rl[0][0] * scaler, rl[0][1] * scaler);
      ctx.lineTo(rl[1][0] * scaler, rl[1][1] * scaler);
    }));
    ctx.stroke();
  }
}
