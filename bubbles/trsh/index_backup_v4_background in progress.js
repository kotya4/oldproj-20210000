window.onload = async function onload() {
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  const grid_sz = 26;
  const grid_w = 12;
  const grid_h = 10;
  const grid = Array(grid_w * grid_h).fill(-1);
  const grid_center = [grid_w/2*grid_sz, grid_h/2*grid_sz];
  const I = (x, y) => (x < 0 || x >= grid_w || y < 0 || y >= grid_h)
    ? -1 : x + y * grid_w;

  function draw_grid_outline() {
    ctx.strokeStyle = 'white';
    ctx.strokeRect(-1, -1, grid_w * grid_sz + 2, grid_h * grid_sz + 2);
  }


  const block3d_pb = Array(4).fill().map(_ => [0, 0]);
  const block3d_po = Array(4).fill().map(_ => [0, 0]);
  const block3d_dz = 0.1;

  function draw_block3d(pos, hsl_arr) {
    block3d_pb[0][0] = (pos[0]  )*grid_sz; block3d_pb[0][1] = (pos[1]  )*grid_sz;
    block3d_pb[1][0] = (pos[0]+1)*grid_sz; block3d_pb[1][1] = (pos[1]  )*grid_sz;
    block3d_pb[2][0] = (pos[0]  )*grid_sz; block3d_pb[2][1] = (pos[1]+1)*grid_sz;
    block3d_pb[3][0] = (pos[0]+1)*grid_sz; block3d_pb[3][1] = (pos[1]+1)*grid_sz;

    let dx, dy;

    const c   = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]}%)`;
    const cl1 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]*1.5}%)`;
    const cl2 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]*2.0}%)`;
    const cd1 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]/2.0}%)`;
    const cd2 = `hsl(${hsl_arr[0]}, ${hsl_arr[1]}%, ${hsl_arr[2]/3.0}%)`;

    for (let i = 0; i < block3d_pb.length; ++i) {
      dx = grid_center[0] - block3d_pb[i][0];
      dy = grid_center[1] - block3d_pb[i][1];
      block3d_po[i][0] = block3d_pb[i][0] + dx * block3d_dz;
      block3d_po[i][1] = block3d_pb[i][1] + dy * block3d_dz;
    }

    if (dx > 0) { // right
      ctx.fillStyle = cd1;
      ctx.beginPath();
      ctx.moveTo(...block3d_pb[1]);
      ctx.lineTo(...block3d_pb[3]);
      ctx.lineTo(...block3d_po[3]);
      ctx.lineTo(...block3d_po[1]);
      ctx.fill();
    } else if (dx < 0) { // left
      ctx.fillStyle = cl1;
      ctx.beginPath();
      ctx.moveTo(...block3d_pb[0]);
      ctx.lineTo(...block3d_pb[2]);
      ctx.lineTo(...block3d_po[2]);
      ctx.lineTo(...block3d_po[0]);
      ctx.fill();
    }
    if (dy > 0) { // bttom
      ctx.fillStyle = cd2;
      ctx.beginPath();
      ctx.moveTo(...block3d_pb[2]);
      ctx.lineTo(...block3d_pb[3]);
      ctx.lineTo(...block3d_po[3]);
      ctx.lineTo(...block3d_po[2]);
      ctx.fill();
    } else if (dy < 0) { // top
      ctx.fillStyle = cl2;
      ctx.beginPath();
      ctx.moveTo(...block3d_pb[0]);
      ctx.lineTo(...block3d_pb[1]);
      ctx.lineTo(...block3d_po[1]);
      ctx.lineTo(...block3d_po[0]);
      ctx.fill();
    }
    // front
    ctx.fillStyle = c;
    ctx.fillRect(...block3d_pb[0], grid_sz, grid_sz);
  }

  function draw_bg_sky() {
    const sky_hsl = [189, 95, 75];
    const lw = 30;
    const lh = 6;
    for (let lx = 0; lx < lw; ++lx) {
      for (let ly = 0; ly < lh; ++ly) {
        const oy = Math.random() * 0.2;
        ctx.fillStyle =
          `hsl(${sky_hsl[0]},${sky_hsl[1]/(ly+3)}%,${sky_hsl[2]/(1-ly*0.2+1)}%)`;
        const y = Math.max(0, (ly-oy)*grid_sz);
        const x = (lx) * grid_sz;
        const gw = (grid_w*grid_sz)/(lw);
        ctx.fillRect(gw*lx|0, y, gw+1, grid_h*grid_sz-y);
      }
    }
  }

  const mounts = [];

  function init_mounts() {
    const thres = grid_sz/2|0;
    const offy = grid_sz/4|0;
    const hei = grid_sz/8|0;

    const height = (grid_h + 1) * grid_sz;
    const center = ((grid_h - 2) * grid_sz / 2);
    const w = 15;
    let h = center / (offy) | 0;
    const gw = grid_w * grid_sz / (w - 3);
    let flg = false;
    for (let y = 0; y < h; ++y) {
      mounts.push([]);
      let prev = thres / 1.5 | 0;
      for (let x = 0; x < w; ++x) {
        prev += Math.sign(Math.random()-0.7)*hei;
        prev = Math.max(0, Math.min(thres, prev));
        let my = (y > 0 ? mounts[y-1][x][1] + offy : center) + prev * offy;
        if (flg || x === 0 && my > height) {
          my = height;
          flg = true;
          h = y + 1;
        }
        mounts[y].push([
          (x*gw)+gw/2*(y%2)+Math.random()*gw/4-gw,
          my,
        ]);
      }
    }
  }

  init_mounts();

  function draw_bg_mountain() {
    const bh = Math.random()*256;
    const bs = Math.random()*3+10;
    const bl = Math.random()*2+10;
    const color = () =>
      `hsl(${bh}, ${bs+4*Math.random()}%, ${bl+4*Math.random()}%)`;
    for (let y = 0; y < mounts.length-1; ++y) {
      for (let x = 0; x < mounts[y].length-1; ++x) {
        const m1 = mounts[y][x];
        const m2 = mounts[y][x+1];
        const m3 = mounts[y+1][x];
        const m4 = mounts[y+1][x+1];
        ctx.lineWidth = 1;
        ctx.strokeStyle = ctx.fillStyle = color();
        ctx.beginPath();
        ctx.moveTo(m1[0], m1[1]);
        ctx.lineTo(m2[0], m2[1]);
        ctx.lineTo(m3[0], m3[1]);
        ctx.lineTo(m1[0], m1[1]);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = ctx.fillStyle = color();
        ctx.beginPath();
        ctx.moveTo(m2[0], m2[1]);
        ctx.lineTo(m3[0], m3[1]);
        ctx.lineTo(m4[0], m4[1]);
        ctx.lineTo(m2[0], m2[1]);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function draw_bg_tree() {

  }

  function draw_bg_rain() {

  }

  const pos = [0, 0];
  let sky_offset = 0;

  function redraw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(50, 50);


    draw_bg_sky(sky_offset);
    draw_bg_mountain();
    draw_bg_tree();
    draw_bg_rain();

    draw_grid_outline();

    draw_block3d(pos, [50, 50, 30]);

    ctx.restore();
  }

  function onkeypress(e) {

    if (e.code === 'KeyW') pos[1] -= 1;
    if (e.code === 'KeyS') pos[1] += 1;
    if (e.code === 'KeyA') pos[0] -= 1;
    if (e.code === 'KeyD') pos[0] += 1;

    sky_offset += 1;
    redraw(ctx);
  }

  redraw();
  addEventListener('keypress', onkeypress);

}
