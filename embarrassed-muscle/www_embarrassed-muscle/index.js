/* gen by new.py at 2021-03-14 08:36:47.573375 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
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
  ctx.translate(width/2, height/2);

  let oldn = 2;
  let oldc = 20;
  let nexr = 0 + oldc / oldn;

  for (let i = 0; i < 5; ++i) {
    const n = oldn * 2;
    const r = nexr;
    const c = 2 * Math.PI * r;

    oldn = n;
    oldc = c;
    nexr = r + c / n;

    ctx.fillStyle = 'hotpink';
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(r, 0);
    for (let j = 0; j < n; ++j) {

      const a = 2 * Math.PI / n * j;
      let cos = Math.cos(a);
      let sin = Math.sin(a);

      const x = r * cos;
      const y = r * sin;

      const x1 = nexr * cos;
      const y1 = nexr * sin;

      ctx.lineTo(x, y);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x, y);

    }
    ctx.closePath();
    ctx.stroke();


  }


  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const scaler = 20;
  for (let a = 0; a < Math.PI * 2; a += 0.1) {

    ctx.lineTo(a * scaler, Math.sin(a * Math.random()) * scaler);

  }
  ctx.stroke();


  ctx.restore();
}
