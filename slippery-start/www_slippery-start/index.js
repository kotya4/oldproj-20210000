/* gen by new.py at 2021-01-08 02:49:12.724026 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const g = new DisplayBuffer({ width: 80, height: 25 });
  const rf = new RasterFont();

  const width = g.width * rf.char_width;
  const height = g.height * rf.char_height;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width * 2;
  ctx.canvas.height = height * 2;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;
  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, width, height);

  await rf.promise;

  ////////////////////////////////////////////////////////////////

  //
  function insect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d12 = x1*y2-y1*x2;
    const d34 = x3*y4-y3*x4;
    const d14 = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    const x = (d12*(x3-x4)-d34*(x1-x2))/d14;
    const y = (d12*(y3-y4)-d34*(y1-y2))/d14;
    return [x, y];
  }

  //
  function init_middle_x_max() {
    // let f = 0;
    // let m = width / 2;
    // for (let i = 0; f < width; ++i) {
    //   f += wall_rot_offset_x_spd * i;
    //   m += wall_rot_middle_x_spd * i;
    // }
    // return m;
    // Each iteration wall_rot_iter increased by wall_rot_iter_spd;
    // wall_rot_iter_num (n) is derived from equation "a * n(n+1)/2 = w/s",
    // where: wall_rot_iter_spd (a), width (w), wall_rot_offset_x_spd (s).
    const wall_rot_iter_num = ((8 * width / wall_rot_offset_x_spd / wall_rot_iter_spd + 1) ** 0.5 - 1) / 2;
    return width / 2 + wall_rot_middle_x_spd * wall_rot_iter_spd * (wall_rot_iter_num * (wall_rot_iter_num + 1) / 2);
  }

  //
  function init_all(middle_x=width/2, middle_y=0, size_offset_i=0, y_off=0, w_dist_enabled=true) {
    for (let i = 0; i < columns.length; ++i) {
      let dw = (middle_x * 2) / (2 << (i + size_offset_i));
      dw = Math.min(width, dw);
      if (!w_dist_enabled) { // HACK: SUPERHACK
        dw = Math.max(columns[3].dw, dw);
      }
      const x = i > 0 ? columns[i-1].x + dw : 0;
      const [, y] = insect(0, y_off, middle_x, height / 2 - middle_y, x, 0, x, height);
      const dh = i > 0 ? (y - columns[i-1].y) : height / 2;
      columns[i] = { x, y, dw, dh };
    }

    for (let i = 0; i < bricks_num; ++i) {
      const bw = columns[i].dw / (bricks_w_num);
      for (let bhi = 0; bhi < bricks_h_num; ++bhi) {
        const bh1 = y_off + (height - y_off * 2) / (bricks_h_num - 1) * bhi;
        const bh2 = height / 2 - middle_y + (middle_y * 2) / (bricks_h_num - 1) * bhi;
        for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
          const x = columns[i].x - columns[i].dw + bw * bwi;
          const [, y] = insect(0, bh1, middle_x, bh2, x, 0, x, height);
          const ob = bricks[((i - 1) * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + bwi];
          const dw = i > 0 ? x - ob.x : 0;
          const dh = i > 0 ? y - ob.y : 0;
          bricks[(i * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + bwi] = { x, y, dw, dh };
        }
      }
    }
  }

  //
  // function get_map_blocks(depth) {
  //   const ox = camera_x;
  //   const oy = camera_y;
  //   // TODO:
  //   map[camera_y * map_w + camera_x];
  // }

  const copied_columns = [];
  const copied_bricks = [];
  function copy_col_and_bricks() {
    copied_columns.length = 0;
    copied_bricks.length = 0;
    for (let i = 0; i < columns.length; ++i) {
      copied_columns.push({
        x: columns[i].x,
        y: columns[i].y,
        dw: columns[i].dw,
        dh: columns[i].dh,
      });
    }
    for (let i = 0; i < bricks.length; ++i) {
      copied_bricks.push({
        x: bricks[i].x,
        y: bricks[i].y,
        dw: bricks[i].dw,
        dh: bricks[i].dh,
      });
    }
  }

  function draw_wallside(flip_mod, offset_x, middle_x, middle_y, opp_middle_x, opp_middle_y) {
    // create master wall and copies it
    // init_all(middle_x, middle_y);
    copy_col_and_bricks();


    // draw on stencil
    // loops from far to near.
    // first column (index 0) ignored.
    for (let i = columns_num - 1; i > 0; --i) {
      // if there is no pass then skip.
      if (i % 2 === 1) continue; // HACK: for testing used only odd columns

      g.stencil_value = 100 + i;

      // fills stencil
      const oy = 8;
      // TIP: y and h can be 0 and height
      // g.rect_stencil_ptc(offset_x + (copied_columns[flip_mod > 0 ? i-1 : i].x) * flip_mod,
      //                    copied_columns[i-1].y - oy,
      //                    copied_columns[i].dw,
      //                    height - (copied_columns[i-1].y - oy) * 2,
      //                    g.stencil_value);
      g.rect_stencil_ptc(offset_x + (copied_columns[flip_mod > 0 ? i-1 : i].x) * flip_mod,
                         0,
                         copied_columns[i].dw,
                         height,
                         g.stencil_value);
      // clear that area
      ctx.fillStyle = 'black';
      ctx.fillRect(offset_x + (copied_columns[flip_mod > 0 ? i-1 : i].x) * flip_mod,
                   0,
                   copied_columns[i].dw,
                   height);
      // ascii
      g.rect_ptc(offset_x + (copied_columns[flip_mod > 0 ? i-1 : i].x) * flip_mod,
                 0,
                 copied_columns[i].dw,
                 height,
                 0);



      // do not draw last column pass
      if (i >= columns_num - 1) continue;

      const old_o = copied_columns[i].x - copied_columns[0].x;

      // create pass wall
      init_all(opp_middle_x + old_o, opp_middle_y, i, copied_columns[i].y, false);

      // draw pass according to stencil
      stroke_all(-flip_mod, offset_x + copied_columns[i].x * flip_mod, opp_middle_x + old_o, opp_middle_y, 1);
    }
  }

  //
  function stroke_all(flip_mod = +1, offset_x=0, middle_x=width/2, middle_y=0, skip_count=1) {
    const i0 = skip_count; // HACK:

    // horisontal brick lines
    ctx.strokeStyle = 'hotpink';
    ctx.beginPath();
    const last_offset = ((bricks_num - 1) * bricks_h_num * bricks_w_num) + 0 + (bricks_w_num - 1);
    for (let bhi = 1; bhi < bricks_h_num-1; ++bhi) {
      if (i0 >= bricks_num - 1) break;
      const { x: x1, y: y1 } = bricks[(i0 * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num)]; // first column's first brick
      const { x: x2, y: y2 } = bricks[bhi * bricks_w_num + last_offset]; // last column's last brick
      ctx.moveTo(offset_x + (x1) * flip_mod, y1);
      ctx.lineTo(offset_x + (x2) * flip_mod, y2);
      // ascii
      g.stroke_ptc(offset_x + (x1) * flip_mod, y1,
                   offset_x + (x2) * flip_mod, y2);
    }
    // ctx.closePath();
    ctx.stroke();
    // horisontal black rects
    const oy = 7;
    ctx.fillStyle = 'black';
    for (let i = i0; i < bricks_num; ++i) {
      for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
        const bi0 = (i * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num);
        const bwi0 = (i * bricks_w_num + bhi) % 2; // rect offset for each column
        for (let bwi = bwi0; bwi < bricks_w_num; bwi += 2) {
          let bi1 = bi0 + bwi;
          let bi2 = bi0 + bwi + 1;
          if (bwi + 1 >= bricks_w_num) {
            bi2 = bi0 + bricks_h_num * bricks_w_num;
            if (bi2 >= bricks.length) break;
          }
          const lower_y = Math.max(bricks[bi1].y, bricks[bi2].y);
          const higher_y = Math.min(bricks[bi1].y, bricks[bi2].y);
          ctx.fillRect(offset_x + (bricks[flip_mod > 0 ? bi1 : bi2].x) * flip_mod,
                       higher_y - oy,
                       bricks[bi2].x - bricks[bi1].x,
                       lower_y - higher_y + 2 * oy);
          // ascii
          g.rect_ptc(offset_x + (bricks[flip_mod > 0 ? bi1 : bi2].x) * flip_mod,
                     higher_y - oy,
                     bricks[bi2].x - bricks[bi1].x,
                     lower_y - higher_y + 2 * oy,
                     0);
        }
      }
    }
    // vertical brick lines
    ctx.strokeStyle = 'hotpink';
    ctx.beginPath();
    for (let i = i0; i < bricks_num; ++i) {
      for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
        const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + bwi];
        ctx.moveTo(offset_x + (x) * flip_mod,          y);
        ctx.lineTo(offset_x + (x) * flip_mod, height - y);
        // ascii
        g.stroke_ptc(offset_x + (x) * flip_mod,          y,
                     offset_x + (x) * flip_mod, height - y);
      }
    }
    // ctx.closePath();
    ctx.stroke();

    // draw_columns
    if (i0 < bricks_num) {

      const left = bricks[(bricks_w_num * bricks_h_num) * i0].x;
      const top = bricks[(bricks_w_num * bricks_h_num) * i0].y;
      const bottom = height - top;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(offset_x + (left    ) * flip_mod, top);
      ctx.lineTo(offset_x + (middle_x) * flip_mod, height / 2 - middle_y);
      ctx.moveTo(offset_x + (left    ) * flip_mod, bottom);
      ctx.lineTo(offset_x + (middle_x) * flip_mod, height / 2 + middle_y);
      ctx.stroke();
      // ascii
      g.stroke_ptc(offset_x + (left    ) * flip_mod, top,
                   offset_x + (middle_x) * flip_mod, height / 2 - middle_y);
      g.stroke_ptc(offset_x + (left    ) * flip_mod, bottom,
                   offset_x + (middle_x) * flip_mod, height / 2 + middle_y);

    }
  }

  //
  // function bricks_get(i, y, x) {
  //   // increase i when x is out of range
  //   i += x / bricks_w_num | 0;
  //   x %= bricks_w_num;
  //   const bi = (i * bricks_h_num * bricks_w_num) + (y * bricks_w_num) + x;
  //   return i < bricks_num && bi < bricks.length ? bricks[bi] : null;
  // }

  //
  // function move_wall() {
  //   for (let i = 0; i < columns.length; ++i) {
  //     const sx = columns[i].dw * wall_speed * wall_move_sgn;
  //     const sy = columns[i].dh * wall_speed * wall_move_sgn;
  //     columns[i].x += sx;
  //     columns[i].y += sy;
  //     if (i >= bricks_num) continue;
  //     for (let k = 0; k < bricks_h_num * bricks_w_num; ++k) {
  //       const b = bricks[(i * bricks_h_num * bricks_w_num) + k];
  //       b.x += b.dw * wall_speed * wall_move_sgn;
  //       b.y += b.dh * wall_speed * wall_move_sgn;
  //     }
  //   }
  //   wall_move_acc += wall_speed;
  //   if (wall_move_acc + wall_speed >= 1) {
  //     wall_move_acc = 0;
  //     return true;
  //   }
  //   return false;
  // }

  //
  function rotate_wall() {
    wall_rot_iter += wall_rot_iter_spd;

    rot_offset_x += wall_rot_offset_x_spd * wall_rot_iter;
    rot_middle_x += wall_rot_middle_x_spd * wall_rot_iter;
    if (rot_middle_x >= width && rot_middle_y < height / 2) {
      rot_middle_y += wall_rot_middle_y_spd * wall_rot_iter;
    }

    let flag = false;
    if (rot_offset_x >= width) {
      wall_rot_iter = 0;
      rot_offset_x = 0;
      rot_middle_x = width / 2;
      rot_middle_y = 0;
      flag = true;
    }

    return flag;
  }

  //
  function calc_opposite_midde_point(middle_x, middle_y) {
    const fov_mod = 8; // HACK: increases fov illution
    const opp_x = width / 2 + Math.max(0, middle_x_max - middle_x) / fov_mod;
    const opp_y = opp_x <= width ? 0 : height / 2 - middle_y;
    return [opp_x, opp_y];
  }

  ///////////////////////////////////////////////////////////////////////

  const wall_rot_offset_x_spd = 1;
  const wall_rot_middle_x_spd = 4;
  const wall_rot_middle_y_spd = 0.3;
  const wall_rot_iter_spd = 0.5;
  let wall_rot_iter = 0;

  let rot_offset_x = 0;
  let rot_middle_x = width / 2;
  // Actually rot_middle_y is the offset of middle point y coordinate used in rotation,
  // when real y coordinate is always the height / 2. Used to prevent rot_middle_x to
  // go to infinity.
  let rot_middle_y = 0;
  // Rotation stops then offset_x reaches width.
  const middle_x_max = init_middle_x_max();

  const columns_num = 6;
  const columns = Array(columns_num).fill();

  const bricks_num = 5;
  const bricks_w_num = 5;
  const bricks_h_num = 7;
  const bricks = Array(bricks_num * bricks_w_num * bricks_h_num).fill();

  // const map_w = 10;
  // const map_h = 10;
  // const map =('0000000000' +
  //             '0   0    0' +
  //             '0 0 0 0 00' +
  //             '0   0    0' +
  //             '0 0 0 0 00' +
  //             '0   0    0' +
  //             '0 0 0 0 00' +
  //             '0      + 0' +
  //             '0 0 0 0 00' +
  //             '0000000000').split('').map(e => ({ ' ':0, '0':1, '+':2 })[e]);
  // let [camera_x, camera_y] = (i => [i % map_w, i / map_w | 0])(map.findIndex(e => e === 2));
  // let camera_dx = 0;
  // let camera_dy = -1;

  // const wall_speed = 0.1;
  // let wall_move_sgn = -1;
  // let wall_move_acc = 0;

  let iid = start_render();
  let render_flag = true;

  window.addEventListener('keypress', () => {
    render_flag = !render_flag;
    if (render_flag) {
      iid = start_render();
    } else {
      clearInterval(iid);
    }
  });

  const colors = Array(10).fill().map(() => `rgba(${Math.random()*256},${Math.random()*256},${Math.random()*256},0.1)`);

  function start_render() {
    return setInterval(() => {
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width * 2, height * 2);
      ctx.translate(width / 2, height / 2);

      g.clear();
      g.flush_stencil(0);

      // flip_x === +1 for turning left,
      // flip_x === -1 for turning right.
      const flip_x = +1;
      let offset_x_1 = rot_offset_x;
      let offset_x_2 = width;
      let offset_x_3 = 0;
      if (flip_x < 0) {
        offset_x_1 = width - rot_offset_x;
        offset_x_2 = 0;
        offset_x_3 = width;
      }
      const [opp_middle_x, opp_middle_y] = calc_opposite_midde_point(rot_middle_x, rot_middle_y);

      // middle master
      init_all(rot_middle_x, rot_middle_y);
      g.stencil_value = 0;
      stroke_all(+flip_x, offset_x_1, rot_middle_x, rot_middle_y);
      draw_wallside(+flip_x, offset_x_1, rot_middle_x, rot_middle_y, opp_middle_x, opp_middle_y);

      // middle slave
      const rmx = width - (rot_offset_x + rot_middle_x);
      const rmy = 0;
      if (rmx >= 0) {
        init_all(rmx, rmy);
        g.stencil_value = 0;
        stroke_all(-flip_x, offset_x_2, rmx, rmy);
        draw_wallside(-flip_x, offset_x_2, rmx, rmy, rot_middle_x, rot_middle_y)
      }

      // opposite master
      init_all(opp_middle_x, opp_middle_y);
      stroke_all(-flip_x, offset_x_1, opp_middle_x, opp_middle_y);

      // opposite slave
      const lmx = rot_offset_x - opp_middle_x;
      const lmy = 0;
      if (lmx >= 0) {
        init_all(lmx, lmy);
        stroke_all(+flip_x, offset_x_3, lmx, lmy);
      }

      rotate_wall();



      // ctx.font = '12px monospace';
      // ctx.fillStyle = 'white';
      // ctx.fillText(`${lmx}`, 20, 20);

      ctx.fillStyle = 'rgba(0,255,0,0.1)';
      ctx.fillRect(0, 0, width, height);

      // ctx.fillStyle = 'black';
      // ctx.fillRect(0, 0, width, height);

      // draw ascii
      for (let y = 0; y < g.height; ++y)
        for (let x = 0; x < g.width; ++x)
      {
        rf.draw(ctx, x, y, g.get_char(x, y), g.get_textcolor(x, y));
      }


      // draw stencil
      for (let y = 0; y < g.height; ++y)
        for (let x = 0; x < g.width; ++x)
      {
        const v = g.stencil_buffer[y * g.width + x];
        ctx.fillStyle = colors[v % colors.length];
        ctx.fillRect(x*8, y*12, 8, 12);
      }



      ctx.restore();


    }, 100);
  }











  /*
  TIP: draw ascii

  for (let y = 0; y < g.height; ++y) {
    for (let x = 0; x < g.width; ++x) {
      rf.draw(ctx, x, y, g.get_char(x, y), g.get_textcolor(x, y));
    }
  }
  */


  /*
  TIP: draw_brickwalls_ascii

  function draw_brickwalls_ascii() {
    // horisontal lines
    for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
      const { x, y } = bricks[((bricks_num - 1) * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + (bricks_w_num - 1)];
      g.stroke(...rf.ptc(0, height / (bricks_h_num - 1) * bhi), ...rf.ptc(x, y));
    }
    // horisontal black rects
    const oy = 10;
    for (let i = 1; i < bricks_num; ++i) {
      for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
        const bi0 = (i * bricks_w_num * bricks_w_num) + (bhi * bricks_w_num);
        for (let bwi = (i * bricks_h_num + bhi) % 2; bwi < bricks_w_num; bwi += 2) {
          let bi1 = bi0 + bwi;
          let bi2 = bi0 + bwi + 1;
          if (bwi + 1 >= bricks_w_num) {
            bi2 = bi0 + bricks_h_num * bricks_w_num;
            if (bi2 >= bricks.length) break;
          }
          const lower_y = Math.max(bricks[bi1].y, bricks[bi2].y);
          const higher_y = Math.min(bricks[bi1].y, bricks[bi2].y);
          g.rect(...rf.ptc(bricks[bi1].x, higher_y-oy), ...rf.ptc(bricks[bi2].x, lower_y+oy));
        }
      }
    }
    // vertical lines
    for (let i = 1; i < bricks_num; ++i) {
      for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
        const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + bwi];
        g.stroke(...rf.ptc(x, y+3), ...rf.ptc(x, height - y), null, false);
      }
    }
    // wall horisontal lines
    g.stroke(...rf.ptc(0, 0), ...rf.ptc(middle_x, height / 2));
    g.stroke(...rf.ptc(0, height-1), ...rf.ptc(middle_x, height / 2));
  }
  */

  /*
  // TIP: ascii

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  draw_brickwalls_ascii();
  for (let y = 0; y < g.height; ++y) {
    for (let x = 0; x < g.width; ++x) {
      rf.draw(ctx, x, y, g.get_char(x, y), g.get_textcolor(x, y));
    }
  }
  */

  /*
  // TIP: move columns

  const columns_speed = 0.1;
  let columns_move_sgn = -1;
  let columns_move_acc = 0;

  function move_columns() {
    for (let i = 0; i < columns.length; ++i) {
      columns[i].x += columns[i].dw * columns_speed * columns_move_sgn;
      columns[i].y += columns[i].dh * columns_speed * columns_move_sgn;
    }
    columns_move_acc += columns_speed;
    if (columns_move_acc + columns_speed >= 1) {
      columns_move_acc = 0;
      init_columns();
      return true;
    }
    return false;
  }

  /*
  // TIP: newish brickwall

  function draw_brickwalls() {

    // ctx.strokeStyle = 'white';
    // ctx.beginPath();
    // ctx.moveTo(columns[0].x, columns[0].y);
    // ctx.lineTo(columns[0].x, height - columns[0].y);
    // ctx.stroke();

    // ctx.strokeStyle = 'white';
    // ctx.beginPath();
    // ctx.moveTo(columns[0].x - columns[0].dw, columns[0].y - columns[0].dh);
    // ctx.lineTo(columns[0].x, columns[0].y);
    // ctx.moveTo(columns[0].x - columns[0].dw, height - (columns[0].y - columns[0].dh));
    // ctx.lineTo(columns[0].x, height - columns[0].y);
    // ctx.stroke();


    for (let i = 0; i < columns_num - 1; ++i) {


      if (i >= bricks_num) {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(columns[i].x, columns[i].y);
        ctx.lineTo(columns[i+1].x, columns[i+1].y);
        ctx.moveTo(columns[i].x, height - columns[i].y);
        ctx.lineTo(columns[i+1].x, height - columns[i+1].y);
        ctx.stroke();
        continue;
      }

      for (let bhi = 0; bhi < bricks_h_num; ++bhi) {
        const { x: ox1, y: oy1 } = bricks_get(i, bhi, 0);
        const { x: ox2, y: oy2 } = bricks_get(i + 1, bhi, 0) || bricks_get(i, bhi, bricks_w_num - 1);
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(ox1, oy1);
        ctx.lineTo(ox2, oy2);
        ctx.stroke();

        if (bhi <= 0 || bhi >= bricks_h_num - 1) continue;

        const bwi0 = (i * bricks_w_num + bhi) % 2; // brick pattern
        for (let bwi = bwi0; bwi < bricks_w_num; bwi += 2) {
          const b = bricks_get(i, bhi, bwi + 1);

          if (b == null) break;

          const { x: x1, y: y1 } = bricks_get(i, bhi, bwi);
          const { x: x2, y: y2 } = b;
          const ly = Math.max(y1, y2); // lower
          const hy = Math.min(y1, y2); // higher
          const oy = 5; // height can't be 0
          ctx.fillStyle = 'black';
          ctx.fillRect(x1, hy - oy, x2 - x1, ly - hy + 2 * oy);
        }

        for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
          const { x: x1, y: y1 } = bricks_get(i, 0, bwi);
          const { x: x2, y: y2 } = bricks_get(i, bricks_h_num - 1, bwi);
          ctx.strokeStyle = 'white';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // ctx.strokeStyle = 'white';
    // ctx.beginPath();
    // ctx.moveTo(columns[columns_num-1].x, columns[columns_num-1].y);
    // ctx.lineTo(middle_x, height / 2 - middle_y);
    // ctx.moveTo(columns[columns_num-1].x, height - columns[columns_num-1].y);
    // ctx.lineTo(middle_x, height / 2 + middle_y);
    // ctx.stroke();

  }
  */

  /*
  // TIP: old brickwall

  function draw_brickwalls() {
    // first column index (draw only when rotate)
    const i0 = 1;
    // horisontal brick lines
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    const last_offset = ((bricks_num - 1) * bricks_h_num * bricks_w_num) + 0 + (bricks_w_num - 1);
    for (let bhi = 1; bhi < bricks_h_num-1; ++bhi) {
      const { x: x1, y: y1 } = bricks[(i0 * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num)]; // first column's first brick
      const { x: x2, y: y2 } = bricks[bhi * bricks_w_num + last_offset]; // last column's last brick
      ctx.moveTo(offset_x + x1, y1);
      ctx.lineTo(offset_x + x2, y2);
    }
    ctx.closePath();
    ctx.stroke();
    // horisontal black rects
    const oy = 5;
    ctx.fillStyle = 'black';
    for (let i = i0; i < bricks_num; ++i) {
      for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
        const bi0 = (i * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num);
        const bwi0 = (i * bricks_w_num + bhi) % 2; // rect offset for each column
        for (let bwi = bwi0; bwi < bricks_w_num; bwi += 2) {
          let bi1 = bi0 + bwi;
          let bi2 = bi0 + bwi + 1;
          if (bwi + 1 >= bricks_w_num) {
            bi2 = bi0 + bricks_h_num * bricks_w_num;
            if (bi2 >= bricks.length) break;
          }
          const lower_y = Math.max(bricks[bi1].y, bricks[bi2].y);
          const higher_y = Math.min(bricks[bi1].y, bricks[bi2].y);
          ctx.fillRect(offset_x + bricks[bi1].x, higher_y-oy, bricks[bi2].x-bricks[bi1].x, lower_y-higher_y+oy*2);
        }
      }
    }
    // vertical brick lines
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    for (let i = i0; i < bricks_num; ++i) {
      for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
        const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + bwi];
        ctx.moveTo(offset_x + x,          y);
        ctx.lineTo(offset_x + x, height - y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    ////////////////////////////////////////////////

    draw_bricks();
    draw_columns();

    // opposite middle point
    const middle_opp_x = width / 2 + middle_x_max - middle_x;
    const middle_opp_y = height / 2 - middle_y;
    ctx.fillStyle = ctx.strokeStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(offset_x + 0, 0);
    ctx.lineTo(offset_x - middle_opp_x, height / 2 - middle_opp_y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillRect(offset_x - middle_opp_x, height / 2 - middle_opp_y, 2, 2);
  }

  */
}
