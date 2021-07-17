 function vertex_shader () {
  return `
    precision highp float;

    attribute vec2 a_pos;

    void main () {
      gl_Position = vec4 ( a_pos, 0, 1 );
    }
  `;
}



function fragment_shader () {
  return `
    precision highp float;

    uniform float u_time;
    uniform vec2 u_res;

    void main () {
      float f = abs ( sin ( u_time / 1000.0 ) ) ;
      gl_FragColor = vec4 ( gl_FragCoord.xy / u_res, f, 1 );

    }
  `;
}




function debug ( ...args ) {
  console.log ( args.join ( ' ' ) );
}



main();



function main () {

  const canvas = document.querySelector ( '#canvas' );
  const gl = canvas.getContext ( 'webgl2' );
  if ( ! gl ) {
    debug ( 'no webgl context' );
    return -1;
  }

  const canvas_size = 128;
  gl.canvas.width = canvas_size;
  gl.canvas.height = canvas_size;

  const program = wgl.program_from_sources ( gl,
    [ [ gl.VERTEX_SHADER, vertex_shader () ]
    , [ gl.FRAGMENT_SHADER, fragment_shader () ]
    ], debug );

  if ( ! program ) {
    degug ( 'no program' );
    return -2;
  }

  gl.useProgram ( program );

  const u_time = gl.getUniformLocation ( program, 'u_time' );
  const u_res = gl.getUniformLocation ( program, 'u_res' );
  const a_pos = gl.getAttribLocation ( program, 'a_pos' );

  gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
  gl.uniform2f ( u_res, gl.canvas.width, gl.canvas.height );

  const tri_data = new Float32Array ( [ -1, -1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1, ] );
  const tri_buffer = gl.createBuffer ();
  gl.bindBuffer ( gl.ARRAY_BUFFER, tri_buffer );
  gl.bufferData ( gl.ARRAY_BUFFER, tri_data, gl.STATIC_DRAW );

  gl.enableVertexAttribArray ( a_pos );
  gl.vertexAttribPointer ( a_pos, 2, gl.FLOAT, false, 0, 0 );

  gl.clearColor ( 1.0, 1.0, 1.0, 1.0 );

  render ( 1 );

  function render ( ts ) {

    gl.uniform1f ( u_time, ts );
    gl.clear ( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.drawArrays ( gl.TRIANGLES, 0, 6 );
    requestAnimationFrame( render );
  }

  return 0;
}
