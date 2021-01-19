/* gen by new.py at 2021-01-08 02:49:12.724026 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const db = new DisplayBuffer({ width: 80, height: 25 });
  const rf = new RasterFont();

  const width = db.width * rf.char_width;
  const height = db.height * rf.char_height;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width * 2;
  ctx.canvas.height = height * 2;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;
  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, width, height);

  await rf.promise;












  /*
  for (let y = 0; y < db.height; ++y) {
    for (let x = 0; x < db.width; ++x) {
      rf.draw(ctx, x, y, db.get_char(x, y), db.get_textcolor(x, y));
    }
  }
  */












  function insect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d12 = x1*y2-y1*x2;
    const d34 = x3*y4-y3*x4;
    const d14 = (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    const x = (d12*(x3-x4)-d34*(x1-x2))/d14;
    const y = (d12*(y3-y4)-d34*(y1-y2))/d14;
    return [x, y];
  }



  const wall_rot_offset_x_spd = 1;
  const wall_rot_middle_x_spd = 4;
  const wall_rot_middle_y_spd = 0.3;
  const wall_rot_iter_spd = 0.5;
  let wall_rot_iter = 0;

  let offset_x = 0;
  let middle_x = width / 2;
  // Actually middle_y is the offset of middle point y coordinate used in rotation,
  // when real y coordinate is always the height / 2.
  let middle_y = 0;

  // Rotation stops then offset_x reaches width.
  // Each iteration wall_rot_iter increased by wall_rot_iter_spd;
  // wall_rot_iter_num (n) is derived from equation "a * n(n+1)/2 = w/s",
  // where: wall_rot_iter_spd (a), width (w), wall_rot_offset_x_spd (s).
  const wall_rot_iter_num = ((8 * width / wall_rot_offset_x_spd / wall_rot_iter_spd + 1) ** 0.5 - 1) / 2;
  const middle_x_max = width / 2 + wall_rot_middle_x_spd * wall_rot_iter_spd * (wall_rot_iter_num * (wall_rot_iter_num + 1) / 2);
  // const middle_x_max = (function init_middle_x_max() {
  //   let f = offset_x;
  //   let m = middle_x;
  //   for (let i = 0; f < width; ++i) {
  //     f += wall_rot_offset_x_spd * i;
  //     m += wall_rot_middle_x_spd * i;
  //   }
  //   return m;
  // })();

  const columns_num = 6;
  const columns = Array(columns_num).fill();

  function init_columns() {
    for (let i = 0; i < columns.length; ++i) {

      const dw = Math.min(width, (middle_x * 2 - offset_x) / (2 << i));

      const x = i > 0 ? columns[i-1].x + dw : 0;
      const [, y] = insect(0, 0, middle_x, height / 2 - middle_y, x, 0, x, height);

      const dh = i > 0 ? (y - columns[i-1].y) : height / 2;

      columns[i] = { x, y, dw, dh };
    }
  }

  function draw_columns() {
    const left = bricks[0].x;
    const top = bricks[0].y;
    const bottom = bricks[(bricks_h_num - 1) * bricks_w_num].y;
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    ctx.moveTo(left + offset_x, top);
    ctx.lineTo(offset_x + middle_x, height / 2 - middle_y);
    ctx.moveTo(left + offset_x, bottom);
    ctx.lineTo(offset_x + middle_x, height / 2 + middle_y);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < columns.length; ++i) {
      ctx.moveTo(offset_x + columns[i].x,          columns[i].y);
      ctx.lineTo(offset_x + columns[i].x, height - columns[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  init_columns();

  const bricks_num = 5;
  const bricks_w_num = 4;
  const bricks_h_num = 5;
  const bricks = Array(bricks_num * bricks_w_num * bricks_h_num).fill();

  function init_bricks() {
    for (let i = 0; i < bricks_num; ++i) {
      const bw = columns[i].dw / (bricks_w_num);
      for (let bhi = 0; bhi < bricks_h_num; ++bhi) {
        const bh1 = height / (bricks_h_num - 1) * bhi;
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

  function draw_bricks() {
    for (let i = 0; i < bricks.length; ++i) {
      ctx.fillStyle = ['red', 'green', 'lightblue', 'yellow'][(i / bricks_w_num / bricks_h_num | 0) % 4];
      ctx.fillRect(offset_x + bricks[i].x, bricks[i].y, 2, 2);
    }
  }

  const map_w = 10;
  const map_h = 10;
  const map =('0000000000' +
              '0   0    0' +
              '0 0 0 0 00' +
              '0   0    0' +
              '0 0 0 0 00' +
              '0   0    0' +
              '0 0 0 0 00' +
              '0      + 0' +
              '0 0 0 0 00' +
              '0000000000').split('').map(e => ({ ' ':0, '0':1, '+':2 })[e]);
  let [camera_x, camera_y] = (i => [i % map_w, i / map_w | 0])(map.findIndex(e => e === 2));
  let camera_dx = 0;
  let camera_dy = -1;

  function get_map_blocks(depth) {
    const ox = camera_x;
    const oy = camera_y;
    // TODO:
    map[camera_y * map_w + camera_x];
  }


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



  function bricks_get(i, y, x) {
    // increase i when x is out of range
    i += x / bricks_w_num | 0;
    x %= bricks_w_num;
    const bi = (i * bricks_h_num * bricks_w_num) + (y * bricks_w_num) + x;
    return i < bricks_num && bi < bricks.length ? bricks[bi] : null;
  }

  /*
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


  init_bricks();

  const wall_speed = 0.1;
  let wall_move_sgn = -1;
  let wall_move_acc = 0;

  function move_wall() {
    for (let i = 0; i < columns.length; ++i) {
      const sx = columns[i].dw * wall_speed * wall_move_sgn;
      const sy = columns[i].dh * wall_speed * wall_move_sgn;
      columns[i].x += sx;
      columns[i].y += sy;
      if (i >= bricks_num) continue;
      for (let k = 0; k < bricks_h_num * bricks_w_num; ++k) {
        const b = bricks[(i * bricks_h_num * bricks_w_num) + k];
        b.x += b.dw * wall_speed * wall_move_sgn;
        b.y += b.dh * wall_speed * wall_move_sgn;
      }
    }
    wall_move_acc += wall_speed;
    if (wall_move_acc + wall_speed >= 1) {
      wall_move_acc = 0;
      return true;
    }
    return false;
  }

  function rotate_wall() {
    wall_rot_iter += wall_rot_iter_spd;

    offset_x += wall_rot_offset_x_spd * wall_rot_iter;
    middle_x += wall_rot_middle_x_spd * wall_rot_iter;
    if (middle_x >= width && middle_y < height / 2) {
      middle_y += wall_rot_middle_y_spd * wall_rot_iter;
    }

    let flag = false;
    if (offset_x >= width) {
      wall_rot_iter = 0;
      offset_x = 0;
      middle_x = width / 2;
      middle_y = 0;
      flag = true;
    }

    init_columns();
    init_bricks();
    return flag;
  }








  setInterval(() => {
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width * 2, height * 2);
    ctx.translate(width / 2, height / 2);

    draw_brickwalls();

    rotate_wall();

    /*
    if (move_wall()) {
      init_columns();
      init_bricks();
    }
    */

    ctx.fillStyle = 'rgba(0,255,0,0.1)';
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }, 100);

















  // const wall_rot_offset_spd = width * 0.15;
  // const wall_rot_middle_spd = 1000;
  // const wall_rot_column_0_dw_spd = (width - columns[0].dw) * 0.15;
  // let wall_rot_iter = 0;

  // function rotate_wall() {
  //   offset_x += wall_rot_offset_spd * wall_rot_iter;
  //   middle_x += wall_rot_middle_spd * wall_rot_iter;
  //   column_0_dw_acc += wall_rot_column_0_dw_spd * wall_rot_iter;
  //   wall_rot_iter += 0.001;

  //   let flag = false;
  //   if (offset_x >= width) {
  //     wall_rot_iter = 0;
  //     offset_x = 0;
  //     middle_x = width / 2;
  //     column_0_dw_acc = 0;
  //     flag = true;
  //   }

  //   init_columns();
  //   init_bricks();
  //   return flag;
  // }


  /*
  function init_offsets_inverse() {
    wall_rot_iter = 0.116;
    offset_x = width;
    middle_x = 6990;
    column_0_dw_acc = 320;
  }


  function rotate_wall_inverse() {
    offset_x -= wall_rot_offset_spd * wall_rot_iter;
    middle_x -= wall_rot_middle_spd * wall_rot_iter;
    column_0_dw_acc -= wall_rot_column_0_dw_spd * wall_rot_iter;
    wall_rot_iter -= 0.001;

    let flag = false;
    if (offset_x <= 0) {
      init_offsets_inverse();
      flag = true;
    }

    init_columns();
    init_bricks();
    return flag;
  }
  */






  // function draw_brickwalls_ascii() {
  //   // horisontal lines
  //   for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
  //     const { x, y } = bricks[((bricks_num - 1) * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + (bricks_w_num - 1)];
  //     db.stroke(...rf.ptc(0, height / (bricks_h_num - 1) * bhi), ...rf.ptc(x, y));
  //   }
  //   // horisontal black rects
  //   const oy = 10;
  //   for (let i = 1; i < bricks_num; ++i) {
  //     for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
  //       const bi0 = (i * bricks_w_num * bricks_w_num) + (bhi * bricks_w_num);
  //       for (let bwi = (i * bricks_h_num + bhi) % 2; bwi < bricks_w_num; bwi += 2) {
  //         let bi1 = bi0 + bwi;
  //         let bi2 = bi0 + bwi + 1;
  //         if (bwi + 1 >= bricks_w_num) {
  //           bi2 = bi0 + bricks_h_num * bricks_w_num;
  //           if (bi2 >= bricks.length) break;
  //         }
  //         const lower_y = Math.max(bricks[bi1].y, bricks[bi2].y);
  //         const higher_y = Math.min(bricks[bi1].y, bricks[bi2].y);
  //         db.rect(...rf.ptc(bricks[bi1].x, higher_y-oy), ...rf.ptc(bricks[bi2].x, lower_y+oy));
  //       }
  //     }
  //   }
  //   // vertical lines
  //   for (let i = 1; i < bricks_num; ++i) {
  //     for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
  //       const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + bwi];
  //       db.stroke(...rf.ptc(x, y+3/*hack const*/), ...rf.ptc(x, height - y), null, false);
  //     }
  //   }
  //   // wall horisontal lines
  //   db.stroke(...rf.ptc(0, 0), ...rf.ptc(middle_x, height / 2));
  //   db.stroke(...rf.ptc(0, height-1/*hack const*/), ...rf.ptc(middle_x, height / 2));
  // }




  // ctx.save();
  // ctx.fillStyle = 'black';
  // ctx.fillRect(0, 0, width, height);

  // // draw_columns();
  // // draw_bricks();
  // // draw_brickwalls();


  // draw_brickwalls_ascii();
  // for (let y = 0; y < db.height; ++y) {
  //   for (let x = 0; x < db.width; ++x) {
  //     rf.draw(ctx, x, y, db.get_char(x, y), db.get_textcolor(x, y));
  //   }
  // }


  // ctx.restore();

  /*
  setInterval(() => {

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    draw_columns();
    draw_bricks();
    draw_brickwalls();

    ctx.restore();

  }, 100);
  */

  /*
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
  */


}
