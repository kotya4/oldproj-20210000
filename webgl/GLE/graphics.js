//
function Graphics(screen_width, screen_height, parent) {
  parent = parent || document.body;

  if (!WebGL) throw Error('Graphics:: WebGL undefined');
  const { gl, webgl, ctx } = WebGL(screen_width, screen_height, parent);

  // TIP: Call 'load_textures' as fast as you can, images loades asyncronously.
  const textures = WebGLu.access(webgl.load_textures(DATA, [
    'normal',
    'wall',
  ], 'data/', '.png'));

  const shader_program = webgl.create_shader_program(
    webgl.compile_shader(gl.VERTEX_SHADER, VERTEX_SHADER),
    webgl.compile_shader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER),
  );

  const u_loc = WebGLu.access(webgl.locations('UNIFORM', shader_program, {
    u_texture:      null,
    u_normalmap:    null,
    u_modelview:    null,
    u_projection:   null,
    u_normalmatrix: null,
    u_camera_pos:   null,
    u_pointlights: {
      _array_: POINTLIGHTS_NUM,
      position:  null,
      constant:  null,
      linear:    null,
      quadratic: null,
      ambient:   null,
      diffuse:   null,
      specular:  null,
    },
  }));

  const a_loc = WebGLu.access(webgl.locations('ATTRIBUTE', shader_program, {
    a_color:   null,
    a_texuv:   null,
    a_coord:   null,
    a_normal:  null,
    a_tangent: null,
  }));

  // Cube model.

  const cube_vao = webgl.bind_vao();
  webgl.bind_array_buffer(a_loc('a_color'),   new Float32Array(WebGLu.CUBE.colors),      4, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_texuv'),   new Float32Array(WebGLu.CUBE.texcoords),   2, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_coord'),   new Float32Array(WebGLu.CUBE.coordinates), 3, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_normal'),  new Float32Array(WebGLu.CUBE.normals),     3, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_tangent'), new Float32Array(WebGLu.CUBE.tangents),    3, gl.FLOAT);
  webgl.bind_element_buffer(new Uint16Array(WebGLu.CUBE.indices));

  function render_cube(modelview) {
    gl.bindVertexArray(cube_vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures('cat'));
    gl.uniform1i(u_loc('u_texture'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures('normalmap'));
    gl.uniform1i(u_loc('u_normalmap'), 1);

    modelview = modelview || mat4.create();
    const normalmatrix = mat3.transpose([], mat3.invert([], WebGLu.to_mat3([], modelview)));

    gl.uniformMatrix4fv(u_loc('u_modelview'), false, modelview);
    gl.uniformMatrix4fv(u_loc('u_projection'), false, projection);
    gl.uniformMatrix3fv(u_loc('u_normalmatrix'), false, normalmatrix);

    gl.drawElements(gl.TRIANGLES, WebGLu.CUBE.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  // Lamp model.

  const lamp_size = 0.3;
  const lamp_translation = Array(3).fill(-lamp_size / 2);
  const lamp_scaler = Array(3).fill(lamp_size);
  const lamp_normals = WebGLu.CUBE.normals.map(e => -e);
  const lamp_vao = webgl.bind_vao();
  webgl.bind_array_buffer(a_loc('a_color'),   new Float32Array(WebGLu.CUBE.colors),      4, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_texuv'),   new Float32Array(WebGLu.CUBE.texcoords),   2, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_coord'),   new Float32Array(WebGLu.CUBE.coordinates), 3, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_normal'),  new Float32Array(lamp_normals),            3, gl.FLOAT);
  webgl.bind_array_buffer(a_loc('a_tangent'), new Float32Array(WebGLu.CUBE.tangents),    3, gl.FLOAT);
  webgl.bind_element_buffer(new Uint16Array(WebGLu.CUBE.indices));

  function render_lamp(position, index = 0) {
    position = position || [1.2, 0.2, 1.5];

    gl.uniform3fv(u_loc('u_pointlights')[index].position,  position);
    gl.uniform1f (u_loc('u_pointlights')[index].constant,  +1.0);
    gl.uniform1f (u_loc('u_pointlights')[index].linear,    +0.09);
    gl.uniform1f (u_loc('u_pointlights')[index].quadratic, +0.032);
    gl.uniform3fv(u_loc('u_pointlights')[index].ambient,   [1.0, 0.3, 0.1]);
    gl.uniform3fv(u_loc('u_pointlights')[index].diffuse,   [0.0, 0.3, 1.0]);
    gl.uniform3fv(u_loc('u_pointlights')[index].specular,  [0.1, 0.7, 1.0]);

    gl.bindVertexArray(lamp_vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, webgl.EMPTY_TEXTURE);
    gl.uniform1i(u_loc('u_texture'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, webgl.EMPTY_NORMALMAP);
    gl.uniform1i(u_loc('u_normalmap'), 1);

    const modelview = mat4.create();
    mat4.translate(modelview, modelview, position);
    mat4.translate(modelview, modelview, lamp_translation);
    mat4.scale(modelview, modelview, lamp_scaler);
    const normalmatrix = mat3.transpose([], mat3.invert([], WebGLu.to_mat3([], modelview)));

    gl.uniformMatrix4fv(u_loc('u_modelview'), false, modelview);
    gl.uniformMatrix4fv(u_loc('u_projection'), false, projection);
    gl.uniformMatrix3fv(u_loc('u_normalmatrix'), false, normalmatrix);

    gl.drawElements(gl.TRIANGLES, WebGLu.CUBE.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  // Some definitions here...
  const fps = WebGLu.FPS();
  const stack = WebGLu.Stack();
  const mouse = WebGLu.Mouse();
  const camera = WebGLu.Camera(JSON.parse(localStorage.getItem('camera')));
  const keyboard = WebGLu.Keyboard();
  const projection = mat4.perspective([], Math.PI / 4, screen_width / screen_height, 0.1, 100.0);

  // Changes 2D-context states globally.
  const font_size = 14;
  ctx.font = `${font_size}px "Roboto Mono"`;
  ctx.fillStyle = 'white';
  ctx.lineWidth = 2;

  // Public members.
  const out = {
    gl,
    ctx,
    webgl,
    u_loc,
    a_loc,
    stack,
    mouse,
    camera,
    keyboard,
    textures,
    projection,
    render_cube,
    render_lamp,
    // Outter render function, can be redefined, calling in '_render' every frame.
    render(timestamp, elapsed) { },
  };

  var lamp_position = [1.2, 0.2, 1.5];

  // Inner render function, calls 'out.render', that can be modified outside of 'Graphics'.
  function _render(timestamp = 0) {
    // Calculates elapsed time and makes some other FPS calculations.
    const elapsed = fps.get_elapsed_time(timestamp);

    // Saves 2D-context state and clears both 2D and 3D screens.
    ctx.save();
    ctx.clearRect(...webgl.viewport);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Saves projection matrix state.
    stack.push(projection);

    // Some keyboard manipulations.
    if (keyboard.keys['KeyW']) camera.d_forward += 0.01 * elapsed;
    if (keyboard.keys['KeyS']) camera.d_forward -= 0.01 * elapsed;
    if (keyboard.keys['KeyA']) camera.d_strafe  -= 0.01 * elapsed;
    if (keyboard.keys['KeyD']) camera.d_strafe  += 0.01 * elapsed;
    if (keyboard.keys['KeyE']) camera.d_up      += 0.01 * elapsed;
    if (keyboard.keys['KeyQ']) camera.d_up      -= 0.01 * elapsed;

    // Udates camera matrices, changes projection applying camera position and rotation,
    // and saves camera information into localstorage if elapsed time as second argument provided.
    camera.apply(projection, elapsed);

    // Sends camera position into shader.
    gl.uniform3fv(u_loc('u_camera_pos'), camera.position);

    // 3D-rendering happens here...
    render_lamp(lamp_position); // lamp_position[0] += Math.sin(timestamp * 0.001) * 0.03;
    out.render(timestamp, elapsed);

    // Calculates scene center vector to draw as fourth (white) axis.
    const zp = WebGLu.project([], [0, 0, 0], webgl.viewport, projection);
    let zpx = zp[0] - screen_width  / 2;
    let zpy = zp[1] - screen_height / 2;
    const zpmag = Math.hypot(zpx, zpy);
    zpx = screen_width  / 2 + zpx / zpmag * 10;
    zpy = screen_height / 2 + zpy / zpmag * 10;

    // Restores projection matrix state.
    stack.pop(projection);

    ////////////////// DEBUG INFO //////////////////

    ctx.fillStyle = 'white';

    // Prints fps.
    ctx.fillText(fps.flush(1000), 0, font_size * 1);

    // Prints camera information.
    ctx.fillText('pos: ' + camera.position.map(e => WebGLu.prec(e, 2)), 0, font_size * 2);
    ctx.fillText('rot: ' + [camera.pitch, camera.yaw].map(e => WebGLu.prec(e, 2)), 0, font_size * 3);

    // Prints pressed keyboard buttons.
    let keyboad_offset = 0;
    for (let key in keyboard.keys)
      if (keyboard.keys[key])
        ctx.fillText(key, 0, font_size * (4 + (++keyboad_offset)));

    // Draws axis into left bottom corner of screen.
    stack.push(projection);
    mat4.translate(projection, projection, [0, 0, -20]);
    mat4.rotateX(projection, projection, camera.pitch);
    mat4.rotateY(projection, projection, camera.yaw);
    mat4.rotateZ(projection, projection, camera.roll);
    ctx.translate(35 - screen_width / 2, screen_height / 2 - 35);
    WebGLu.draw_axis(ctx, webgl.viewport, projection);
    stack.pop(projection);

    // Draws additional scene center vector.
    ctx.strokeStyle = ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(screen_width / 2, screen_height / 2);
    ctx.lineTo(zpx, zpy);
    ctx.stroke();

    // Restores 2D-context state and requests next frame.
    ctx.restore();
    requestAnimationFrame(_render);
  }

  // Immideately run render function.
  _render();

  // Returns public members.
  return out;
}
