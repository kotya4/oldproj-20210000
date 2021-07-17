const wgl = {};

{
  wgl.program_from_sources = program_from_sources;


  function compile_shader ( gl, source, type, debug=null ) {
    const s = gl.createShader ( type );
    gl.shaderSource ( s, source );
    gl.compileShader ( s );
    if ( ! gl.getShaderParameter ( s, gl.COMPILE_STATUS ) ) {
      if ( debug ) {
        debug ( 'Error compiling'
              , type === gl.VERTEX_SHADER ? 'VERTEX_SHADER' : 'FRAGMENT_SHADER'
              , '\n'
              , gl.getShaderInfoLog ( s )
              , '\n'
              , source.split( '\n' ).map( ( l, i ) => `${ i + 1 }: ${ l }` ).join ( '\n' )
              );
      }
      gl.deleteShader ( s );
      return null;
    }
    return s;
  }




  function link_program ( gl, shaders, debug=null ) {
    const p = gl.createProgram ();
    for ( let s of shaders ) {
      gl.attachShader ( p, s );
    }
    gl.linkProgram ( p );
    if ( ! gl.getProgramParameter ( p, gl.LINK_STATUS ) ) {
        if ( debug ) {
          debug ( 'Error in program linking:', gl.getProgramInfoLog ( p ) );
        }
        gl.deleteProgram ( p );
        return null;
    }
    return p;
  }



  function program_from_sources ( gl, sources, debug=null ) {
    const shaders = [];
    for ( let i = 0; i < sources.length; ++i ) {
      const t = sources[ i ][ 0 ];
      const s = sources[ i ][ 1 ];
      shaders.push ( compile_shader ( gl, s, t, debug ) );
    }
    return link_program ( gl, shaders, debug );
  }


}
