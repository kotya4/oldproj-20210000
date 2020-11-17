//
function WebGL(screen_width, screen_height, parent, webgl_class, canvas_class) {
  screen_width  = screen_width  || 300;
  screen_height = screen_height || 300;
  parent        = parent        || document.body;
  webgl_class   = webgl_class   || 'webgl';
  canvas_class  = webgl_class   || 'canvas';

  // creating webgl context

  const gl = document.createElement('canvas').getContext('webgl2', { preserveDrawingBuffer: true });
  gl.canvas.width = screen_width;
  gl.canvas.height = screen_height;
  gl.canvas.classList.add(webgl_class);
  parent.appendChild(gl.canvas);

  // creating 2d context

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = screen_width;
  ctx.canvas.height = screen_height;
  ctx.canvas.classList.add(canvas_class);
  ctx.canvas.imageSmoothingEnabled = false;
  parent.appendChild(ctx.canvas);

  // viewport

  const viewport = [0, 0, screen_width, screen_height];

  // preparing scene

  gl.viewport(...viewport);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clearDepth(1.0);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // enabling alpha-blending (you must sort transparent models by yourself)

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // blank textures

  const EMPTY_TEXTURE   = create_texture();
  const EMPTY_NORMALMAP = create_texture(new Uint8Array([128, 128, 255, 255]));

  // version info

  console.log(`%c${gl.getParameter(gl.VERSION)}`, 'color: blue;');
  console.log(`%c${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`, 'color: blue;');


  ///////////////////////////////////////////////////////////////////////

  function compile_shader(type, data) {
    if (type !== gl.VERTEX_SHADER
    &&  type !== gl.FRAGMENT_SHADER)
    {
      throw Error(`compile_shader:: '${type}' is not type of shader`);
    }
    const type_str = type === gl.VERTEX_SHADER ? 'VERTEX_SHADER' : 'FRAGMENT_SHADER';
    const shader = gl.createShader(type);
    gl.shaderSource(shader, data);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw Error(`'compile_shader:: ${type_str}:: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  }


  function create_shader_program(...shaders) {
    const program = gl.createProgram();
    for (let shader of shaders) {
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    gl.useProgram(program);
    return program;
  }


  function locations(type, shader_program, dict, prefix = '') {
    // Type must be 'UNIFORM' or 'ATTRIBUTE' only.
    if (type !== 'UNIFORM' && type !== 'ATTRIBUTE')
      throw Error(`locations:: Incorect type '${type}', must be UNIFORM or ATTRIBUTE`);
    // All locations will be stored in 'dict' (values will be rewrited), returns 'dict'.
    for (let key in dict) {
      // Value can be Object, String or neither.
      if (dict[key] instanceof Object) {
        if ('_array_' in dict[key]) {
          // If value is Object and has pseudokey '_array_',
          // then all keys in this object maps into array with
          // length === '_array_'.
          const arrlen = dict[key]['_array_'];
          delete dict[key]['_array_'];
          dict[key] = Array(arrlen).fill().map((_, i) => {
            let name = `${key}[${i}]`;
            if (prefix.length) name = `${prefix}.${name}`;
            return locations(type, shader_program, {...dict[key]}, name);
          });
        } else {
          // If value is Object, then value recoursively parses into key.
          let name = key;
          if (prefix.length) name = `${prefix}.${name}`;
          locations(type, shader_program, dict[key], name);
        }
      } else {
        // If value is String, then getting location with name stored as value.
        // Else, gentting location with name stored as key.
        let name = typeof dict[key] === 'string' ? dict[key] : key;
        if (prefix.length) name = `${prefix}.${name}`;
        dict[key] = type === 'UNIFORM'
          ? gl.getUniformLocation(shader_program, name)
          : gl.getAttribLocation(shader_program, name);
        if (dict[key] < 0) {
          console.log(`locations:: unused ${type} ${name}`);
        }
      }
    }
    return dict;
  }


  function create_texture(image, width, height) {
    width  = width  || 1;
    height = height || 1;
    let pixels;
    // Empty texture
    if (image == null) {
      width  = 1;
      height = 1;
      pixels = new Uint8Array([255, 255, 255, 255]);
    }
    // Texure from Image
    else if (image instanceof Image) {
      width  = image.width;
      height = image.height;
      pixels = image;
    }
    // Texture from Uint8Array
    else if (image instanceof Uint8Array) {
      pixels = image;
    }
    // Error
    else {
      throw Error(`create_texture:: 'image' has incorrect type`);
    }
    // Creating texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,    // target
      0,                // level
      gl.RGBA,          // internalformat
      width,            // width
      height,           // height
      0,                // border
      gl.RGBA,          // format
      gl.UNSIGNED_BYTE, // type
      pixels,           // pixels
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }


  function bind_array_buffer(index, srcData, size, type, buffer = null) {
    if (index < 0) return null; // unused attribute
    buffer = buffer || gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, srcData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(index, size, type, false, 0, 0);
    gl.enableVertexAttribArray(index); // always after binding vao
    return buffer;
  }


  function bind_element_buffer(srcData, buffer = null) {
    buffer = buffer || gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, srcData, gl.STATIC_DRAW);
    return buffer;
  }


  function bind_vao(vao = null) {
    vao = vao || gl.createVertexArray();
    gl.bindVertexArray(vao);
    return vao;
  }


  function get_bounding_rect() {
    // bounding rect changes in runtime
    return gl.canvas.getBoundingClientRect();
  }


  function load_textures(from, paths, prefix = '', postfix = '') {
    const textures = {};
    for (let path of paths) {
      textures[path] = EMPTY_TEXTURE;
      const img = new Image();
      img.src = from[prefix + path + postfix];
      (new Promise(r => img.onload = r)).then(_ => textures[path] = create_texture(img));
    }
    return textures;
  }


  //////////////////////////////////////////////////////////////////
  return {
    // context itself
    gl,
    // 2d layout
    ctx,
    // object with context and methods
    webgl: {
      gl,
      viewport,
      EMPTY_TEXTURE,
      EMPTY_NORMALMAP,
      //////////////////////////
      compile_shader,
      create_shader_program,
      locations,
      create_texture,
      bind_array_buffer,
      bind_element_buffer,
      bind_vao,
      get_bounding_rect,
      load_textures,
    },
  };
}
