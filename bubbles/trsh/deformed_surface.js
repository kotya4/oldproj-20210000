
  const mounts = [];

  function init_mounts() {
    const thres = 3;
    const offy = 10;

    const center = (grid_h * grid_sz / 2);
    const w = 10;
    const h = center / (offy) | 0;
    const gw = grid_w * grid_sz / (w - 2);

    for (let y = 0; y < h; ++y) {
      // const mrandom = Array(1000).fill();
      // mrandom.forEach((_,i,a) =>
      //   a[i] = (Math.min(thres, Math.max(0,
      //     (i>0 ? a[i-1] : 0))) + Math.sign(Math.random()-0.5)));
      // // mrandom.forEach((_,i,a) => a[i] /= thres);
      // mrandom.forEach((_,i,a) => a[i] *= offy);

      // console.log(Math.max(...mrandom));

      mounts.push([]);

      let prev = thres / 2 | 0;

      for (let x = 0; x < w; ++x) {
        prev += Math.sign(Math.random()-0.5);
        prev = Math.max(-thres, Math.min(thres, prev));
        mounts[y].push([
          (x*gw)+gw/2*(y%2)+Math.random()*gw/4-gw,
          (y > 0 ? mounts[y-1][x][1] + offy : center) + prev * offy
        ]);



        // const py = (y > 0 ? mounts[y-1][x][1] : center) + mrandom[x % mrandom.length | 0];
        // const px = (x*gw)+gw/2*(y%2)+Math.random()*gw/4;
        // mounts[y].push([px, py]);
      }
    }
  }

  init_mounts();

  function draw_bg_mountain() {

    for (let y = 0; y < mounts.length-1; ++y) {
      for (let x = 0; x < mounts[y].length-1; ++x) {
        const m1 = mounts[y][x];
        const m2 = mounts[y][x+1];
        const m3 = mounts[y+1][x];
        const m4 = mounts[y+1][x+1];
        // ctx.fillStyle = y === 0 ? 'red' : 'blue';
        // ctx.fillRect(...m1, 3, 3);
        ctx.fillStyle = `hsl(${50}, ${50}%, ${10+10*Math.random()}%)`;
        ctx.beginPath();
        ctx.moveTo(...m1); ctx.lineTo(...m2); ctx.lineTo(...m3);
        ctx.fill();
        ctx.fillStyle = `hsl(${50}, ${50}%, ${10+10*Math.random()}%)`;
        ctx.beginPath();
        ctx.moveTo(...m2); ctx.lineTo(...m3); ctx.lineTo(...m4);
        ctx.fill();
      }
    }
  }
