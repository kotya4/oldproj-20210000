var mat4 = glMatrix.mat4;
var vec3 = glMatrix.vec3;

/* gen by new.py at 2020-11-03 22:48:00.031648 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const width = 400;
  const height = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;

  const projection_mat = mat4.create();
  // TIP: projection near value must be less than absolute near value used in clip_plane
  mat4.perspective(projection_mat, 45, width/height, 0.001, 100);

  const axis_obj = get_axis_obj();
  const javidx9_axis_obj = get_javidx9_axis_obj();
  const utah_teapot_obj = get_utah_teapot_obj();

  const directional_light = [0, 0, 1];

  const obj_position = [0, 0, 0];
  const obj_rotation = [0, 0, 0];

  let theta = 0;


  const keyboard = new Keyboard();
  keyboard.listen();
  const keys = keyboard.keys;

  const mouselock = new MouseLock(ctx.canvas);
  mouselock.listen();
  const mouse = mouselock.mouse;

  const fpscamera = new FPSCamera();
  fpscamera.translate(0, 0, 15);


  let prev_time = 0;
  function render() {
    requestAnimationFrame(render);
    const curr_time = Date.now();
    const elapsed = (curr_time - prev_time) / 1000;
    prev_time = curr_time;

    //////////////////////////////////////////////////////
    //
    //                                             PROCESS
    //
    //////////////////////////////////////////////////////

    ctx.save();
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    theta += 0.01 * elapsed;

    obj_rotation[0] += Math.sin(theta) * elapsed;
    obj_rotation[1] += Math.cos(theta) * elapsed;
    obj_rotation[2] += 1 * elapsed;

    // model matrix (rotation/translation)
    const model_mat = mat4.create();
    mat4.rotateX(model_mat, model_mat, obj_rotation[0]);
    mat4.rotateY(model_mat, model_mat, obj_rotation[1]);
    mat4.rotateZ(model_mat, model_mat, obj_rotation[2]);
    mat4.translate(model_mat, model_mat, obj_position);

    // rotate camera (mouse values will be flushed)
    fpscamera.rotate(mouse.movementX, mouse.movementY);

    // move camera
    if (keys['KeyW']) fpscamera.move(-elapsed, 0, 0);
    if (keys['KeyS']) fpscamera.move(+elapsed, 0, 0);
    if (keys['KeyA']) fpscamera.move(0, 0, -elapsed);
    if (keys['KeyD']) fpscamera.move(0, 0, +elapsed);
    if (keys['Space']) fpscamera.move(0, +elapsed, 0);
    if (keys['ShiftLeft']) fpscamera.move(0, -elapsed, 0);

    // view matrix (camera)
    const view_mat = fpscamera.view;

    // const obj = javidx9_axis_obj;
    // const obj = axis_obj;
    // const obj = hedron_obj;
    const obj = utah_teapot_obj;

    let faces = [];

    // transform and clip
    for (let ii = 0, fi = 0; ii < obj.indices.length; ii += 3, ++fi) {

      // vertices
      const v0 = vec3.transformMat4([], obj.vertices[obj.indices[ii + 0] - 1], model_mat);
      const v1 = vec3.transformMat4([], obj.vertices[obj.indices[ii + 1] - 1], model_mat);
      const v2 = vec3.transformMat4([], obj.vertices[obj.indices[ii + 2] - 1], model_mat);

      // face normal
      const n = face_normal(v0, v1, v2);

      // face culling
      const visible = vec3.dot(n, vec3.sub([], v0, fpscamera.pos)) < 0;

      if (visible) {

        // apply view matrix
        vec3.transformMat4(v0, v0, view_mat);
        vec3.transformMat4(v1, v1, view_mat);
        vec3.transformMat4(v2, v2, view_mat);

        // near-clip
        const clipped_faces = clip_plane([0, 0, -0.1], [0, 0, -1], [v0, v1, v2]);

        for (const f of clipped_faces) {

          // projects vertices into display
          const v0pos2 = to_pos2(f[0], projection_mat, width, height);
          const v1pos2 = to_pos2(f[1], projection_mat, width, height);
          const v2pos2 = to_pos2(f[2], projection_mat, width, height);

          // apply directional lighting
          const light = Math.max(0.1, vec3.dot(n, directional_light));

          // debug-colors
          const color = [
            [255, 255, 255],
            [255, 0, 0],
            [0, 255, 0],
            [0, 0, 255],
          ][f[3] || 0];

          // push face information
          faces.push({
            v: [
              v0pos2,
              v1pos2,
              v2pos2,
            ],
            light,
            visible,
            ii,
            fi,
            n,
            color: color.map(e => e * light),
          });
        }
      }
    }

    // depth sort faces
    faces = faces.sort((a,b) => +(b.v[0][2] + b.v[1][2] + b.v[2][2])
                                -(a.v[0][2] + a.v[1][2] + a.v[2][2]));

    // rasterize
    for (let f of faces) {

      // fast far-clip
      if (f.v[0][2] > 1 || f.v[1][2] > 1 || f.v[2][2] > 1) continue;

      // TODO: no display boundaries clipping ?

      // draw face
      ctx.fillStyle = `rgb(${f.color})`;
      ctx.strokeStyle = ctx.fillStyle; // 'blue';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(f.v[0][0], f.v[0][1]);
      ctx.lineTo(f.v[1][0], f.v[1][1]);
      ctx.lineTo(f.v[2][0], f.v[2][1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // debug
      // const font_size = 10;
      // const text_y0 = font_size + 10;
      // ctx.font = `${font_size}px monospace`;
      // ctx.fillStyle = f.visible ? 'lightblue' : 'red';
      // ctx.fillText(`${f.light}`, 10, text_y0 + font_size * (f.fi + 0));
      // ctx.fillText(`${f.n}`, 10, text_y0 + font_size * (f.fi + 1));
      // ctx.fillText(`${n[2]}`, 10, text_y0 + font_size * (f.ii + 2));
    }

    // debug
    const font_size = 10;
    ctx.font = `${font_size}px monospace`;
    ctx.fillStyle = 'white';
    ctx.fillText(`${elapsed} SecPerFrame`, 10, 10);

    ctx.restore();
  }

  render();
}
