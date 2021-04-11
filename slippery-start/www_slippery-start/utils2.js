
  function start_render() {
    return setInterval(() => {
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width * 2, height * 2);
      ctx.translate(width / 2, height / 2);
      g.clear();
      g.flush_stencil(0);


      const x0 = rot_offset_x;
      const [mx, my] = [rot_middle_x, rot_middle_y];
      // const [omx, omy] = calc_opposite_midde_point(mx, my);
      // const omx = -(middle_x_max - mx) + width / 2;
      // const omy = 0;

      const omx = x0 - o_rot_middle_x;
      const omy = 0;


      rotate_wallside();



      const { columns, bricks } = create_wallside(mx, my, 0, columns_num, 0);
      const { columns: columns2, bricks: bricks2 } = create_wallside(width - mx, my, 0, columns_num, 0);



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



      // console.log(middle_x_max);





      g.flush(ctx);
      ctx.restore();
    }, 100);
  }

