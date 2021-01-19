/* gen by new.py at 2020-12-04 06:22:44.528024

  Генератор пола

*/
window.onload = async function onload() {
  // if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;


  const floor_w = 100;
  const floor_h = 100;

  ctx.save();

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  ctx.translate(100, 100);

  ctx.scale(2, 2);

  ////////////////////////////////////////////////////

  const pattern_type = Math.random()*3|0;

  const offset_scaler = (pattern_type === 2) ? 1.75 : 1+Math.random()*4|0;
  const offset_x = 6*offset_scaler|0;
  const offset_y = 6*offset_scaler|0;

  const x0 = (Math.random() - 0.5) * offset_x | 0;
  const y0 = (Math.random() - 0.5) * offset_y | 0;

  const pattern_mod_x = Math.random()*10;
  const pattern_mod_y = Math.random()*10;
  const pattern_colors_num = 1+Math.random()*3|0;
  const pattern_colors = Array(pattern_colors_num).fill().map(() => Array(3).fill().map(() => 50+Math.random()*50));
  // multicolor/monocolor
  if (Math.random() > 0.6) {
    const mag = 1.5 - Math.random();
    for (let i = 1; i < pattern_colors.length; ++i) {
      pattern_colors[i][0] = pattern_colors[0][0]*mag;
      pattern_colors[i][1] = pattern_colors[0][1]*mag;
      pattern_colors[i][2] = pattern_colors[0][2]*mag;
    }
  }
  const pattern_offset_color = pattern_colors[Math.random()*pattern_colors_num|0].map(e => e * 1.5);
  const pattern_dirt_color = pattern_colors[Math.random()*pattern_colors_num|0].map(e => e / 1.5);
  const pattern_dirt_num = Math.random()*20;
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
        ctx.fillStyle = `rgb(${pattern_colors[patt%pattern_colors_num|0]})`;
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
    const row_colors_indices = Array(floor_w / offset_x | 0).fill().map(() => Math.random()*pattern_colors_num|0);

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
          let newi = Math.random()*pattern_colors_num|0;
          if (newi === oldi) newi = (newi + 1) % pattern_colors_num;
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

  ////////////////////////////////////////////////////

  // ctx.strokeStyle = 'red';
  // ctx.strokeRect(0, 0, floor_w, floor_h);

  ctx.restore();
}
