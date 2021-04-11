

  function fill_stencil__r(flip_mod, x0, mx, my, omx, omy, i0, i_max=columns_num, depth=0, _0=null, _1=null, dwi0=0, dwi_max=columns_num, h0=0) {
    flip_mod=+1;
    i0=0;
    i_max=columns_num;
    depth=0;
    _0=null;
    _1=null;
    dwi0=0;
    dwi_max=columns_num;
    h0=0;

    // creates wallside values
    const { columns, bricks } = create_wallside(mx, my, dwi0, dwi_max, h0);


    const { columns: columns2, bricks: bricks2 } = create_wallside(width - mx, my, dwi0, dwi_max, 0);



    // console.log(columns);
    // console.log(bricks);
    // debugger;





    // ctx.fillStyle = 'green';
    // ctx.fillRect(mx, my, 4, 4);


    // ctx.fillStyle = 'yellow';
    // ctx.fillRect(omx, omy, 4, 4);







    for (let i = 0; i < columns_num; ++i) {

      const x1 = columns[i].x;
      const y1 = columns[i].y;

      const x2 = columns2[i].x;
      const y2 = columns2[i].y;

      const yellow_x = x0 + (x1);
      const green_x  = x0 + width - (x2);

      ctx.strokeStyle = 'yellow';
      ctx.beginPath();
      ctx.moveTo(yellow_x,          y1);
      ctx.lineTo(yellow_x, height - y1);
      ctx.stroke();

      ctx.strokeStyle = 'green';
      ctx.beginPath();
      ctx.moveTo(green_x,          y2);
      ctx.lineTo(green_x, height - y2);
      ctx.stroke();

      ctx.strokeStyle = 'hotpink';
      ctx.beginPath();
      ctx.moveTo(yellow_x,          y1);
      ctx.lineTo(green_x,           y2);
      ctx.moveTo(yellow_x, height - y1);
      ctx.lineTo(green_x,  height - y2);
      ctx.stroke();


      ctx.strokeStyle = `rgba(${100},${100},${100},${ 1 - (i / columns_num) })`;
      ctx.beginPath();
      ctx.moveTo(yellow_x, y1);
      ctx.lineTo(omx, height / 2 - omy);
      ctx.stroke();

    }

    // for (let i = 0; i < columns_num; ++i) {

    //   const x = columns2[i].x;
    //   const y = columns2[i].y;


    //   ctx.strokeStyle = 'green';
    //   ctx.beginPath();
    //   ctx.moveTo(width - flip_mod * (x),          y);
    //   ctx.lineTo(width - flip_mod * (x), height - y);
    //   ctx.stroke();




    // }



    return;














































    // HACK: to test types of columns, change with map reading later.
    const hack__columns_types = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
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

