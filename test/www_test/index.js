var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;

/* gen by new.py at 2020-11-03 22:48:00.031648 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 800;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;


  const wall_width = 3;
  const wall_height = 1;
  const corridor_width = 1;
  const corridor_max_len = 5;
  let corridor_angle = 0;
  let corridor_depth = 0;
  const distortion_scaler = 2;

  const mesh_wall_pattern = [
    [-wall_width/2, -wall_height/2, 0], // 0
    [-wall_width/2, +wall_height/2, 0], // 1
    [+wall_width/2, +wall_height/2, 0], // 2
    [-wall_width/2, -wall_height/2, 0], // 0
    [+wall_width/2, -wall_height/2, 0], // 3
    [+wall_width/2, +wall_height/2, 0], // 2
  ];

  let moving = false;

  window.addEventListener('keydown', e => {
    // if (e.code === 'KeyA') corridor_angle -= 0.01;
    // if (e.code === 'KeyD') corridor_angle += 0.01;
    if (e.code === 'KeyA') mat4.rotateY(pmat, pmat, -0.04);
    if (e.code === 'KeyD') mat4.rotateY(pmat, pmat, +0.04);

    if (e.code === 'KeyW') corridor_depth = (corridor_depth - 0.04);
    if (e.code === 'KeyS') corridor_depth = (corridor_depth + 0.04);

    if (e.code === 'KeyQ') moving = !moving;
    if (!moving) corridor_depth = 0;

    corridor_depth = (wall_width + corridor_depth) % wall_width;
  });

  const pmat = mat4.create();
  mat4.perspective(pmat, 200, width/height, 0.001, 1000);
  const vmat = mat4.create();



  function draw_corridor(corridor_angle, moving=false) {
    let distortion = 1; // perspective destortion (wall scaler)
    let z = corridor_width + corridor_depth;
    // if (moving) distortion = distortion / 2 + corridor_depth / wall_width * (distortion_scaler - 1);
    // if (moving) z = corridor_depth;
    for (let i = 0; i < corridor_max_len; ++i) {
      z += wall_width;

      // left wall
      mat4.identity(vmat);
      mat4.rotateY(vmat, vmat, corridor_angle);
      mat4.translate(vmat, vmat, [-corridor_width, 0, -z]);
      mat4.rotateY(vmat, vmat, +Math.PI/2);
      mat4.scale(vmat, vmat, [distortion, 1, 1]);
      draw_convex(ctx, mesh_wall_pattern, vmat, pmat, width, height, true);
      // right wall
      mat4.identity(vmat);
      mat4.rotateY(vmat, vmat, corridor_angle);
      mat4.translate(vmat, vmat, [+corridor_width, 0, -z]);
      mat4.rotateY(vmat, vmat, +Math.PI/2);
      mat4.scale(vmat, vmat, [distortion, 1, 1]);
      draw_convex(ctx, mesh_wall_pattern, vmat, pmat, width, height, true);

      // z += wall_width * distortion / 2;
      // if (i >= 0) distortion *= distortion_scaler;
    }
  }

  // function draw_corridor(corridor_angle, moving=false) {
  //   let distortion = 1; // perspective destortion (wall scaler)
  //   let z = corridor_depth + corridor_width;
  //   if (moving) distortion = distortion + corridor_depth / wall_width * (distortion_scaler - 1);
  //   // if (moving) z -= corridor_width + wall_width;
  //   for (let i = 0; i < corridor_max_len; ++i) {
  //     z += wall_width * distortion / 2;

  //     // left wall
  //     mat4.identity(vmat);
  //     mat4.rotateY(vmat, vmat, corridor_angle);
  //     mat4.translate(vmat, vmat, [-corridor_width, 0, -z]);
  //     mat4.rotateY(vmat, vmat, +Math.PI/2);
  //     mat4.scale(vmat, vmat, [distortion, 1, 1]);
  //     draw_convex(ctx, mesh_wall_pattern, vmat, pmat, width, height, false);
  //     // right wall
  //     mat4.identity(vmat);
  //     mat4.rotateY(vmat, vmat, corridor_angle);
  //     mat4.translate(vmat, vmat, [+corridor_width, 0, -z]);
  //     mat4.rotateY(vmat, vmat, +Math.PI/2);
  //     mat4.scale(vmat, vmat, [distortion, 1, 1]);
  //     draw_convex(ctx, mesh_wall_pattern, vmat, pmat, width, height, false);

  //     z += wall_width * distortion / 2;
  //     distortion *= distortion_scaler;
  //   }
  // }



  function render() {
    requestAnimationFrame(render);

    ctx.save();

    ctx.scale(0.5, 0.5);
    ctx.translate(width/2, height/2);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    draw_corridor(corridor_angle, moving);
    if (!moving) draw_corridor(corridor_angle-Math.PI/2);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'lightblue';
    ctx.fillText(`${corridor_depth}`, 20, 20);

    ctx.restore();
  }

  render();
}

function to_pos2(pos3, vmat, pmat, w, h) {
  const out = vec3.create();
  vec3.transformMat4(out, pos3, vmat);
  vec3.transformMat4(out, out, pmat);
  out[0] = (+out[0] / out[2] + 1) * w / 2; // x in display space
  out[1] = (-out[1] / out[2] + 1) * h / 2; // y in display space
  // out[2] is the distance from the camera (exiting of near\far plane if > 1)
  // also can be used to sort by distance
  return out;
}

function draw_convex(ctx, mesh, vmat, pmat, w, h, ignore_depth_test=true) {
  const pos2arr = [];
  for (let i = 0; i < mesh.length; ++i) {
    const pos2_0 = to_pos2(mesh[ i+0             ], vmat, pmat, w, h);
    const pos2_1 = to_pos2(mesh[(i+1)%mesh.length], vmat, pmat, w, h);
    if (!ignore_depth_test
    && ((pos2_0[2] >= 1 || pos2_1[2] >= 1)
    || ((pos2_0[0] >= w || pos2_0[0] < 0) && (pos2_1[0] >= w || pos2_1[0] < 0))
    || ((pos2_0[1] >= h || pos2_0[1] < 0) && (pos2_1[1] >= h || pos2_1[1] < 0))))
    {
      continue;
    }
    pos2arr.push(pos2_0, pos2_1);
  }
  ctx.beginPath();
  if (pos2arr.length > 0) ctx.moveTo(...pos2arr[0]);
  for (let i = 1; i < pos2arr.length; ++i) ctx.lineTo(...pos2arr[i]);
  ctx.closePath();
  ctx.strokeStyle = 'white';
  ctx.stroke();
}
