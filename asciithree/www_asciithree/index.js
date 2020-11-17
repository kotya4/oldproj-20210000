/* gen by new.py at 2020-09-20 12:46:57.098531 */

var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;

window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;


  const tri = [
    // back
    [-1, -1, -1], // 0
    [-1, +1, -1], // 1
    [+1, +1, -1], // 2
    [+1, +1, -1], // 2
    [+1, -1, -1], // 5
    [-1, -1, -1], // 0

    // front
    [-1, -1, +1], // 0
    [-1, +1, +1], // 1
    [+1, +1, +1], // 2
    [+1, +1, +1], // 2
    [+1, -1, +1], // 5
    [-1, -1, +1], // 0
  ];

/*
  1----2
  |   /
  |  /
  | /
  |/
  0
*/

  const lines3d = [
    // back
    [-1, -1, -1], // 0
    [-1, +1, -1], // 1

    [-1, +1, -1], // 1
    [+1, +1, -1], // 2

    [+1, +1, -1], // 2
    [+1, -1, -1], // 5

    [+1, -1, -1], // 5
    [-1, -1, -1], // 0

    // front
    [-1, -1, +1], // 0
    [-1, +1, +1], // 1

    [-1, +1, +1], // 1
    [+1, +1, +1], // 2

    [+1, +1, +1], // 2
    [+1, -1, +1], // 5

    [+1, -1, +1], // 5
    [-1, -1, +1], // 0
  ];

  const pmat = mat4.create();
  mat4.perspective(pmat, Math.PI / 4, ctx.canvas.width / ctx.canvas.height, 0.1, 100);
  // all camera translations are inverted, because projection
  // matrix moves scene, not a camera (camera position always in 0,0,0)
  mat4.translate(pmat, pmat, [0, 0, -10]);

  const vmat = mat4.create();

  mat4.rotateZ(vmat, vmat, -0.01 * 50);
  mat4.rotateY(vmat, vmat, +0.02 * 50);
  mat4.rotateX(vmat, vmat, -0.05 * 50);

  const pattern = create_pattern();

  function render() {
    requestAnimationFrame(render);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    for (let i = 0; i < lines3d.length; i += 2) {

      const pos2_0 = to_pos2(lines3d[i+0], vmat, pmat, width, height);
      const pos2_1 = to_pos2(lines3d[i+1], vmat, pmat, width, height);

      ctx.fillStyle = 'white';
      ctx.font = '8px monospace';
      // ctx.fillText(`${pos2_0[0]|0} ${pos2_0[1]|0}`, pos2_0[0], pos2_0[1]);
      ctx.fillText(`${pos2_0[2]}`, pos2_0[0], pos2_0[1]);

      const is_clip = true; // LiangBarsky([pos2_0, pos2_1], 0, 0, width, height);

      if (is_clip) {
        // console.log(1);
        ctx.moveTo(...pos2_0);
        ctx.lineTo(...pos2_1);

      }

    }
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }

  // ne rabotaet
  function LiangBarsky(line, edgeLeft, edgeTop, edgeRight, edgeBottom) {

    let x0src = line[0][0],
          y0src = line[0][1],
          x1src = line[1][0],
          y1src = line[1][1];


    // if (x0 < 0 && x1 < 0 || x0 >= rw && x1 >= rw
    // ||  y0 < 0 && y1 < 0 || y0 >= rh && y1 >= rh)
    // {
    //   // line out of rect
    //   return false;
    // }



    const xdelta = x1src - x0src;
    const ydelta = y1src - y0src;
    let t0 = 0.0, t1 = 1.0;

    for(let edge = 0; edge < 4; ++edge) { // Traverse through left, right, bottom, top edges.
      let p, q;
      if      (edge === 0) { p = -xdelta; q = -(edgeLeft - x0src); }
      else if (edge === 1) { p = +xdelta; q = +(edgeRight - x0src); }
      else if (edge === 2) { p = -ydelta; q = -(edgeBottom - y0src); }
      else if (edge === 3) { p = +ydelta; q = +(edgeTop - y0src); }

      const r = q / p;

      // console.log(r);


      if(p === 0 && q < 0) { /*console.log('1');*/ return false; }   // Don't draw line at all. (parallel line outside)

      // console.log(p > 0 && (r < t1));

      if (p < 0) {
        if      (r > t1) { /*console.log('1');*/ return false; }         // Don't draw line at all.
        else if (r > t0) t0 = r;            // Line is clipped!
      } else if (p > 0) {
        if      (r < t0) { /*console.log('2');*/ return false; }      // Don't draw line at all.
        else if (r < t1) t1 = r;         // Line is clipped!
      }
    }

    line[0][0] = x0src + t0 * xdelta;
    line[0][1] = y0src + t0 * ydelta;
    line[1][0] = x0src + t1 * xdelta;
    line[1][1] = y0src + t1 * ydelta;



    return true;        // (clipped) line is drawn
  }

































  render();












  addEventListener('keydown', e => {
    if (e.code === 'KeyA') mat4.translate(pmat, pmat, [-0.5, +0.0, +0.0]); // <-
    if (e.code === 'KeyD') mat4.translate(pmat, pmat, [+0.5, +0.0, +0.0]); // ->

    if (e.code === 'KeyQ') mat4.translate(pmat, pmat, [+0.0, +0.0, +0.5]); // to the camera
    if (e.code === 'KeyE') mat4.translate(pmat, pmat, [+0.0, +0.0, -0.5]); // from the camera

    if (e.code === 'KeyW') mat4.translate(pmat, pmat, [+0.0, +0.5, +0.0]); // ^
    if (e.code === 'KeyS') mat4.translate(pmat, pmat, [-0.0, -0.5, -0.0]); // v
  });



  function to_pos2(pos3, vmat, pmat, w, h) {
    const tpos3 = vec3.create(); // ndc space
    vec3.transformMat4(tpos3, pos3, vmat);
    vec3.transformMat4(tpos3, tpos3, pmat);
    return [
      (+tpos3[0] / tpos3[2] + 1) * w / 2, // display space x
      (-tpos3[1] / tpos3[2] + 1) * h / 2, // display space y
      tpos3[2] // distance from the camera in scene space
    ];
  }

  function create_pattern() {
    // source: https://stackoverflow.com/questions/32201479/continuous-hatch-line-needed-in-canvas-with-repeated-pattern
    var p = document.createElement("canvas")
    p.width=32;
    p.height=16;
    var pctx=p.getContext('2d');

    var x0=36;
    var x1=-4;
    var y0=-2;
    var y1=18;
    var offset=32;

    pctx.strokeStyle = "#aa5500";
    pctx.lineWidth=2;
    pctx.beginPath();
    pctx.moveTo(x0,y0);
    pctx.lineTo(x1,y1);
    pctx.moveTo(x0-offset,y0);
    pctx.lineTo(x1-offset,y1);
    pctx.moveTo(x0+offset,y0);
    pctx.lineTo(x1+offset,y1);
    pctx.stroke();

    return ctx.createPattern(p,'repeat');
  }











  // https://youtu.be/HXSuNxpCzdM?t=2013



}



