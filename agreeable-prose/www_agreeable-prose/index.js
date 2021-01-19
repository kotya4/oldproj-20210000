/* gen by new.py at 2020-11-27 06:28:59.914875

Генерация обоев.

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

  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  const scaler = 2;
  ctx.scale(scaler, scaler);

  // wallpapers

  const wall_width = 200;
  const wall_height = 200;

  const base_value = Math.random()*200;
  ctx.fillStyle = `rgb(${base_value},${base_value},${base_value})`;
  ctx.fillRect(0, 0, wall_width, wall_height);

  const base_opacity = 0.1;
  const base_color = Array(3).fill().map(() => Math.random() * 256);
  ctx.fillStyle = `rgba(${base_color},${base_opacity})`;
  ctx.fillRect(0, 0, wall_width, wall_height);

  const is_pattern = Math.random()>0.4;
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

  const is_line = Math.random()>0.3;
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
    dirt_radius_y > dirt_radius_x ? (dirt_dist_x = (Math.random()>0.5|0)) : (dirt_dist_y = (Math.random()>0.5|0));
    const dirt_x = dirt_dist_x*wall_width | 0;
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


  ctx.restore();
}
