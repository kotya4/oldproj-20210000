/* gen by new.py at 2021-01-08 02:49:12.724026 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const g = new DisplayBuffer({ width: 80, height: 25 });
  const [width, height] = g.get_display_sizes();
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width * 2;
  ctx.canvas.height = height * 2;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;

  await g.rf.promise;


  // Returns intersection point between two lines.
  function insect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const d12 = x1 * y2 - y1 * x2;
    const d34 = x3 * y4 - y3 * x4;
    const d14 = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const x = (d12 * (x3 - x4) - d34 * (x1 - x2)) / d14;
    const y = (d12 * (y3 - y4) - d34 * (y1 - y2)) / d14;
    return [x, y];
  }


  // Builds wallside stretched to the perspective middle point (mx, my).
  function create_wallside(mx=width/2, my=0, dwi0=0, dwi_max=columns_num, h0=0) {
    const columns = Array(columns_num).fill();
    const bricks = Array(bricks_num * bricks_w_num * bricks_h_num).fill();

    for (let i = 0; i < columns.length; ++i) {
      // dwi is delta width index, used to calc offset between neighbour columns.
      // dwi0 sets initial value of dwi. dwi_max sets maximal value of dwi.
      // both control size and distortion of pass-walls.
      const dwi = Math.min(dwi0 + i, dwi_max);
      const dw = Math.min(2 * mx / (2 << dwi), width);
      const x = i > 0 ? columns[i-1].x + dw : 0;
      // y-coord defined as intersaction between vertical column and horisontal wallside lines.
      // h0 simply initial dh (delta height) of column, controls size of pass-wall.
      const [, y] = insect(0, h0, mx, height / 2 - my, x, 0, x, height);
      const dh = i > 0 ? (y - columns[i-1].y) : height / 2;
      columns[i] = { x, y, dw, dh };
    }

    // TIP: brick index calulation ->
    // (i * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + bwi
    // where:
    // i   -- column index (can be less than columns_num, check bricks_num)
    // bhi -- bricks y index (check bricks_h_num)
    // bwi -- bricks x index (check bricks_w_num)

    for (let i = 0; i < bricks_num; ++i) {
      const bw = columns[i].dw / (bricks_w_num);
      for (let bhi = 0; bhi < bricks_h_num; ++bhi) {
        const bh1 = h0 + (height - h0 * 2) / (bricks_h_num - 1) * bhi;
        const bh2 = height / 2 - my + (my * 2) / (bricks_h_num - 1) * bhi;
        for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
          const x = columns[i].x - columns[i].dw + bw * bwi;
          const [, y] = insect(0, bh1, mx, bh2, x, 0, x, height);
          const ob = bricks[((i - 1) * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + bwi];
          const dw = i > 0 ? x - ob.x : 0;
          const dh = i > 0 ? y - ob.y : 0;
          bricks[(i * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + bwi] = { x, y, dw, dh };
        }
      }
    }

    return { columns, bricks };
  }


  // Iterates rotation values, returns completion flag, flushes values on complete.
  function rotate_wallside() {
    wall_rot_iter += wall_rot_iter_spd;
    rot_offset_x += wall_rot_offset_x_spd * wall_rot_iter;
    rot_middle_x += wall_rot_middle_x_spd * wall_rot_iter;
    if (rot_middle_x >= width && rot_middle_y < height / 2) {
      rot_middle_y += wall_rot_middle_y_spd * wall_rot_iter;
    }
    const is_rotation_over = rot_offset_x >= width;
    if (is_rotation_over) {
      wall_rot_iter = 0;
      rot_offset_x = 0;
      rot_middle_x = width / 2;
      rot_middle_y = 0;
    }
    return is_rotation_over;
  }


  // Calculates value of rot_middle_x after rotation is over.
  function init_middle_x_max() {
    // Each iteration rotation func increases wall_rot_iter by wall_rot_iter_spd,
    // so wall_rot_iter_num (n) is derived from equation "a*n(n+1)/2 = w/s",
    // where is wall_rot_iter_spd (a), width (w), wall_rot_offset_x_spd (s).
    const wall_rot_iter_num = ((8 * width / wall_rot_offset_x_spd / wall_rot_iter_spd + 1) ** 0.5 - 1) / 2;
    return width / 2 + wall_rot_middle_x_spd * wall_rot_iter_spd * (wall_rot_iter_num * (wall_rot_iter_num + 1) / 2);
  }


  //
  function calc_opposite_midde_point(mx, my) {
    const fov_mod = 8; // HACK: increases fov illusion
    const opp_x = width / 2 + Math.max(0, middle_x_max - mx) / fov_mod;
    const opp_y = opp_x <= width ? 0 : height / 2 - my;
    return [opp_x, opp_y];
  }


  // Recoursively draws wallside and all passes (3 layers total).
  // Never run w/ i0==0 if 0th column is pass. Run additional instance of func instead.
  // TIP: rightmost 8 bits [0x00 .. 0xff] of stencil buffer are used to encode
  //      column type (e.g. brick type(s), pass, etc.), next N-bits
  //      store drawing depth. 0-depth is for master wallside, 1-depth
  //      is for pass wallside, 2-depth is for pass's pass wallside and
  //      so on. also we do not need to set individual id for every column in
  //      same wallside because we are drawing from back to forth.
  function backward_fill_stencil__r(flip_mod, x0, mx, my, omx, omy, i0, i_max=columns_num, depth=0, vmin=0, vmax=width, dwi0=0, dwi_max=columns_num, h0=0) {

    // TODO: then i=0 stencil fills incorrectly

    // creates wallside values
    const { columns, bricks } = create_wallside(mx, my, dwi0, dwi_max, h0);

    // HACK: to test types of columns, change with map reading later.
    // TIP: starts from 0 (remember, in init 0th column is outside of display).
    const hack__columns_types = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const hack__i_offset = hack__columns_types[1] === 0 ? (depth > 0 ? 1 : 0) : 0;

    // for each column back to forth
    // TODO: must start before deadend if there is
    for (let i = i_max - 1; i >= i0; --i) {
      // HACK: not tested for depth > 2
      const recoursion_allowed = depth === 0 || i <= 2 && depth < 2;

      // column x position and width mapped to display space.
      const cw = columns[i].dw;
      let cx;
      if (flip_mod < 0) cx = x0 - columns[i].x;
      else if (i > 0)   cx = x0 + columns[i-1].x;
      else              cx = x0 - cw;

      // TODO: DOES NOT WORK, REDO RECOURSION CALL.
      // viewbox cannot be outside of display.
      // vmin = Math.max(vmin, 0);
      // vmax = Math.min(vmax, width);
      // if column is fully outside of draw section, i.e outside of display or
      // provided viewbox, then no need to process it.
      // if (cx < vmin && cx + cw < vmin || cx > vmax && cx + cw > vmax) {
      //   continue;
      // }

      // skip if column outside of display
      if (cx < 0 && cx + cw < 0 || cx > width && cx + cw > width) {
        continue;
      }

      // clear column area
      ctx.fillStyle = 'black';
      ctx.fillRect(cx, 0, cw, height);
      g.rect_ptc(cx, 0, cw, height, 0);

      // -- brick --
      if (1 === hack__columns_types[i + hack__i_offset] || recoursion_allowed === false) {
        // fill stencil buffer w/ default value (also used as even layer for bricks)
        g.fill_stencil_ptc(cx, cw, (depth + 1 << 8) + 0x10);
        // bricks can be created only if column has bricks initialized.
        if (i < bricks_num) {
          // vertical strokes
          ctx.strokeStyle = 'hotpink';
          ctx.beginPath();
          for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
            const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + 0 + bwi];
            ctx.moveTo(x0 + flip_mod * (x),          y);
            ctx.lineTo(x0 + flip_mod * (x), height - y);
            g.stencil_value = (depth + 1 << 8) + 0x10;
            g.stroke_ptc(x0 + flip_mod * (x),          y,
                         x0 + flip_mod * (x), height - y,
                         { force_dx: 0 }); // prevents vertical lines to be breaked
          }
          ctx.stroke();
          // all brick widths located in same column are the same,
          // and we need only the width because stencil buffer is 1-dimentional,
          // so we do not need to loop thru every brick column to fill stencil buffer.
          // TIP: every column has (bricks_w_num * bricks_h_num) bricks total.
          const bw = columns[i].dw / bricks_w_num;
          // run thru all brick columns from back to forth and zebra-fill the stencil
          // TIP: we consider that bricks_w_num is always even
          for (let bwi = bricks_w_num - 1; bwi >= 0; bwi -= 2) {
            g.fill_stencil_ptc(cx + bw * bwi, bw, (depth + 1 << 8) + 0x11);
          }
          // we marked bricked column with stencil values 0x10 and 0x11 for
          // even and odd strokes respectively, but actual drawing will be
          // done only after all columns are processed.
        }
        continue;
      }

      // -- pass --
      if (0 === hack__columns_types[i + hack__i_offset]) {
        // for pass we do not need to fill stencil buffer because we do recoursive drawing.
        if (recoursion_allowed) {
          const mx0 = columns[i].x - columns[0].x;
          backward_fill_stencil__r(-flip_mod,      // reversed flip mode
                          // new offset w/ additional offset
                          x0 + flip_mod * columns[i].x,
                          // new middle coordinates, flipped w/ opposite
                          omx + mx0,
                          omy,
                          // new opposite middle coordinates (tested for depth<=2 only)
                          mx - mx0,
                          my,
                          1,              // for all passes i0 is 1
                          i_max,          // limit of columns
                          depth + 1,      // recoursion depth
                          // (does not work)
                          cx,        // viewbox min value
                          cx + cw,   // viewbox max value
                          // wallside initialization secondary arguments
                          i+depth,        // minimal horisontal distortion (width divisor)
                          i+2,            // maximal horisontal distortion (width divisor)
                          columns[i].y);  // height distortion (delta height)
          // vertical strokes on edges
          const x1 = i > 0 ? columns[i-1].x : 0;
          const y1 = i > 0 ? columns[i-1].y : 0;
          ctx.strokeStyle = 'orange';
          ctx.beginPath();
          ctx.moveTo(x0 + flip_mod * (x1          ),          y1);
          ctx.lineTo(x0 + flip_mod * (x1          ), height - y1);
          ctx.moveTo(x0 + flip_mod * (columns[i].x),          columns[i].y);
          ctx.lineTo(x0 + flip_mod * (columns[i].x), height - columns[i].y);
          ctx.stroke();
          // stencil ignored
          // TODO: sometimes strokes are not drawing because
          //       further column clears it
          g.stroke_ptc(x0 + flip_mod * (x1          ),          y1,
                       x0 + flip_mod * (x1          ), height - y1,
                       { force_dx: 0, stencil_ignore_mask: -1 });
          g.stroke_ptc(x0 + flip_mod * (columns[i].x),          columns[i].y,
                       x0 + flip_mod * (columns[i].x), height - columns[i].y,
                       { force_dx: 0, stencil_ignore_mask: -1 });
        }
        continue;
      }
    }

    // there is some space between last column and middle point, we need to fill it w/ bricks.
    // HACK: only first wallside, others not visible
    // TODO: not working for flip_mod < 0
    if (depth === 0) {
      g.fill_stencil_ptc(x0 + flip_mod * columns[i_max-1].x, mx - columns[i_max-1].x, (depth + 1 << 8) + 0x10);
    }

    // horisontal strokes for all columns with brick type at once
    ctx.strokeStyle = 'hotpink';
    ctx.beginPath();
    for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
      const { x: x1, y: y1 } = bricks[(i0 * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + 0];
      const y2 = (height / 2 - my) + bhi * (2 * my / (bricks_h_num));
      ctx.moveTo(x0 + flip_mod * (x1), y1);
      ctx.lineTo(x0 + flip_mod * (mx), y2);
      g.stencil_value = (depth + 1 << 8) + 0x10 + (bhi % 2);
      g.stroke_ptc(x0 + flip_mod * (x1), y1,
                   x0 + flip_mod * (mx), y2,
                   { overlap: false }); // vertical strokes are on top of horisontal
    }
    ctx.stroke();

    // main horisontal strokes
    {
      const x1 = bricks[(i0 * bricks_h_num * bricks_w_num) + 0 + 0].x;
      const y1 = bricks[(i0 * bricks_h_num * bricks_w_num) + 0 + 0].y;
      const y2 = height - y1;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(x0 + flip_mod * (x1), y1             );
      ctx.lineTo(x0 + flip_mod * (mx), height / 2 - my);
      ctx.moveTo(x0 + flip_mod * (x1), y2             );
      ctx.lineTo(x0 + flip_mod * (mx), height / 2 + my);
      ctx.stroke();
      g.stencil_value = (depth + 1 << 8) + 0x10;
      g.stroke_ptc(x0 + flip_mod * (x1), y1             ,
                   x0 + flip_mod * (mx), height / 2 - my,
                   { stencil_ignore_mask: 0x0f }); // ignores rightmost 4 bits (i.e. brick type)
      g.stroke_ptc(x0 + flip_mod * (x1), y2             ,
                   x0 + flip_mod * (mx), height / 2 + my,
                   { stencil_ignore_mask: 0x0f });
    }
  }


  // переосмысление через обезьяничание
  function fill_stencil__r(flip_mod, x0, mx, my, omx, omy, i0, i_max=columns_num, depth=0, _0=null, _1=null, dwi0=0, dwi_max=columns_num, h0=0) {
    // TODO: must start before deadend if there is

    // creates wallside values
    const { columns, bricks } = create_wallside(mx, my, dwi0, dwi_max, h0);

    // HACK: to test types of columns, change with map reading later.
    const hack__columns_types = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
    const hack__i_offset = hack__columns_types[1] === 0 ? (depth > 0 ? 1 : 0) : 0;

    // for each column back to forth
    for (let i = i_max - 1; i >= i0; --i) {
      const recoursion_allowed = depth === 0 || i <= 2 && depth < 2; // HACK: not tested for depth > 2

      // column x position and width mapped to display space.
      const cw = columns[i].dw;
      let cx;
      if (flip_mod < 0) cx = x0 - columns[i].x;
      else              cx = x0 + columns[i].x - cw;

      // skip if column outside of display
      if (cx < 0 && cx + cw < 0 || cx > width && cx + cw > width) {
        continue;
      }


      // clear column area
      ctx.fillStyle = 'black';
      ctx.fillRect(cx, 0, cw, height);
      g.rect_ptc(cx, 0, cw, height, 0);

      // stencil type (sizeof i can't be bigger then 4 bits)
      // const type = (depth + 1 << 8) | (i << 4) | 0x0;

      // -- brick --
      if (1 === hack__columns_types[i + hack__i_offset] || recoursion_allowed === false) {
        // fill stencil buffer w/ default value (also used as even layer for bricks)
        g.fill_stencil_ptc(cx, cw, (depth + 1 << 8) + 0x10);
        // bricks can be created only if column has bricks initialized.
        if (i < bricks_num) {
          // vertical strokes
          ctx.strokeStyle = 'hotpink';
          ctx.beginPath();
          for (let bwi = 0; bwi < bricks_w_num; ++bwi) {
            const { x, y } = bricks[(i * bricks_h_num * bricks_w_num) + 0 + bwi];
            ctx.moveTo(x0 + flip_mod * (x),          y);
            ctx.lineTo(x0 + flip_mod * (x), height - y);
            g.stencil_value = (depth + 1 << 8) + 0x10;
            g.stroke_ptc(x0 + flip_mod * (x),          y,
                         x0 + flip_mod * (x), height - y,
                         { force_dx: 0 }); // prevents vertical lines to be breaked
          }
          ctx.stroke();
          // all brick widths located in same column are the same,
          // and we need only the width because stencil buffer is 1-dimentional,
          // so we do not need to loop thru every brick column to fill stencil buffer.
          // TIP: every column has (bricks_w_num * bricks_h_num) bricks total.
          const bw = columns[i].dw / bricks_w_num;
          // run thru all brick columns from back to forth and zebra-fill the stencil
          // TIP: we consider that bricks_w_num is always even
          for (let bwi = bricks_w_num - 1; bwi >= 0; bwi -= 2) {
            g.fill_stencil_ptc(cx + bw * bwi, bw, (depth + 1 << 8) + 0x11);
          }
          // we marked bricked column with stencil values 0x10 and 0x11 for
          // even and odd strokes respectively, but actual drawing will be
          // done only after all columns are processed.
        }
        continue;
      }

      // -- pass --
      if (0 === hack__columns_types[i + hack__i_offset]) {
        // for pass we do not need to fill stencil buffer because we do recoursive drawing.
        if (recoursion_allowed) {
          const mx0 = columns[i].x - columns[0].x;
          fill_stencil__r(-flip_mod,      // reversed flip mode
                          // new offset w/ additional offset
                          x0 + flip_mod * columns[i].x,
                          // new middle coordinates, flipped w/ opposite
                          omx + mx0,
                          omy,
                          // new opposite middle coordinates (tested for depth<=2 only)
                          mx - mx0,
                          my,
                          1,              // for all passes i0 is 1
                          i_max,          // limit of columns
                          depth + 1,      // recoursion depth
                          // (does not work)
                          cx, // cx,        // viewbox min value
                          null, // cx + cw,   // viewbox max value
                          // wallside initialization secondary arguments
                          i+depth,        // minimal horisontal distortion (width divisor)
                          i+2,            // maximal horisontal distortion (width divisor)
                          columns[i].y);  // height distortion (delta height)
          // vertical strokes on edges
          const x1 = i > 0 ? columns[i-1].x : 0;
          const y1 = i > 0 ? columns[i-1].y : 0;
          ctx.strokeStyle = 'orange';
          ctx.beginPath();
          ctx.moveTo(x0 + flip_mod * (x1          ),          y1);
          ctx.lineTo(x0 + flip_mod * (x1          ), height - y1);
          ctx.moveTo(x0 + flip_mod * (columns[i].x),          columns[i].y);
          ctx.lineTo(x0 + flip_mod * (columns[i].x), height - columns[i].y);
          ctx.stroke();
          // stencil ignored
          // TODO: sometimes strokes are not drawing because
          //       further column clears it
          g.stroke_ptc(x0 + flip_mod * (x1          ),          y1,
                       x0 + flip_mod * (x1          ), height - y1,
                       { force_dx: 0, stencil_ignore_mask: -1 });
          g.stroke_ptc(x0 + flip_mod * (columns[i].x),          columns[i].y,
                       x0 + flip_mod * (columns[i].x), height - columns[i].y,
                       { force_dx: 0, stencil_ignore_mask: -1 });
        }
        continue;
      }
    }

    // there is some space between last column and middle point, we need to fill it w/ bricks.
    // HACK: only first wallside, others not visible
    // TODO: not working for flip_mod < 0
    if (depth === 0) {
      g.fill_stencil_ptc(x0 + flip_mod * columns[i_max-1].x, mx - columns[i_max-1].x, (depth + 1 << 8) + 0x10);
    }

    // horisontal strokes for all columns with brick type at once
    ctx.strokeStyle = 'hotpink';
    ctx.beginPath();
    for (let bhi = 1; bhi < bricks_h_num - 1; ++bhi) {
      const { x: x1, y: y1 } = bricks[(i0 * bricks_h_num * bricks_w_num) + (bhi * bricks_w_num) + 0];
      const y2 = (height / 2 - my) + bhi * (2 * my / (bricks_h_num));
      ctx.moveTo(x0 + flip_mod * (x1), y1);
      ctx.lineTo(x0 + flip_mod * (mx), y2);
      g.stencil_value = (depth + 1 << 8) + 0x10 + (bhi % 2);
      g.stroke_ptc(x0 + flip_mod * (x1), y1,
                   x0 + flip_mod * (mx), y2,
                   { overlap: false }); // vertical strokes are on top of horisontal
    }
    ctx.stroke();

    // main horisontal strokes
    {
      const x1 = bricks[(i0 * bricks_h_num * bricks_w_num) + 0 + 0].x;
      const y1 = bricks[(i0 * bricks_h_num * bricks_w_num) + 0 + 0].y;
      const y2 = height - y1;
      ctx.strokeStyle = 'blue';
      ctx.beginPath();
      ctx.moveTo(x0 + flip_mod * (x1), y1             );
      ctx.lineTo(x0 + flip_mod * (mx), height / 2 - my);
      ctx.moveTo(x0 + flip_mod * (x1), y2             );
      ctx.lineTo(x0 + flip_mod * (mx), height / 2 + my);
      ctx.stroke();
      g.stencil_value = (depth + 1 << 8) + 0x10;
      g.stroke_ptc(x0 + flip_mod * (x1), y1             ,
                   x0 + flip_mod * (mx), height / 2 - my,
                   { stencil_ignore_mask: 0x0f }); // ignores rightmost 4 bits (i.e. brick type)
      g.stroke_ptc(x0 + flip_mod * (x1), y2             ,
                   x0 + flip_mod * (mx), height / 2 + my,
                   { stencil_ignore_mask: 0x0f });
    }
  }


  //
  function start_render() {
    return setInterval(() => {
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width * 2, height * 2);
      ctx.translate(width / 2, height / 2);


      const flip_x = +1; // positive: left, negative: right
      let x01 = rot_offset_x;
      let x02 = width;
      let x03 = 0;
      if (flip_x < 0) {
        x01 = width - rot_offset_x;
        x02 = 0;
        x03 = width;
      }
      const [mx, my] = [rot_middle_x, rot_middle_y];
      const [omx, omy] = calc_opposite_midde_point(mx, my);


      // clears ascii and stencil
      g.clear();
      g.flush_stencil(0);


      // do rotation
      rotate_wallside();



      fill_stencil__r(+flip_x, x01, mx, my, omx, omy, 0);


      // ctx.fillStyle = 'black';
      // ctx.fillRect(0, 0, width, height);

      g.flush(ctx);
      ctx.restore();
    }, 100);
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

  const bricks_num = 4;
  const bricks_w_num = 4;
  const bricks_h_num = 7;

  // MAIN

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
}
