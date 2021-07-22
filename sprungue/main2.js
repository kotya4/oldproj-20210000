



function print ( ...args ) {
  console.log ( args.join ( ' ' ) );
}



main();



function main () {

  const canvas = document.querySelector ( '#canvas' );
  const ctx = canvas.getContext ( '2d' );
  if ( ! ctx ) {
    debug ( 'no 2d context' );
    return -1;
  }


  ctx.canvas.width = 64;
  ctx.canvas.height = 64;


  ctx.fillStyle = 'red';
  ctx.fillRect ( 0, 0, ctx.canvas.width, ctx.canvas.height );
  ctx.fillStyle = 'yellow';
  ctx.beginPath ();
  ctx.ellipse( ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width / 2, ctx.canvas.height / 2, 0, 0, Math.PI * 2 );
  ctx.fill ();



  const S = sprungue;


  const program = `

    ( initial stack = (x,y,time) ),


    (.x~y0^^),

    (1~1)

  `;


  const vectors = S.drop ( S.split ( S.clear ( program ) ) );


  // console.log ( S.clear ( program ) );
  // console.log ( S.split ( S.clear ( program ) ) );
  // console.log ( S.validify ( 3, [ 0, 0.1, 1.5 ] ) );

  console.log ( 'program:', JSON.stringify ( vectors ) );



  const idata = ctx.getImageData( 0, 0, ctx.canvas.width, ctx.canvas.height );
  const data = idata.data;
  for ( let i = 0; i < data.length; i += 4 ) {
    // const r = data[ i + 0 ];
    // const g = data[ i + 1 ];
    // const b = data[ i + 2 ];

    const x = ( i / 4 % ctx.canvas.width | 0 ) / ctx.canvas.width;
    const y = ( i / 4 / ctx.canvas.width | 0 ) / ctx.canvas.height;

    let rgb;
    if ( 1 ) {
      const sstack = S.interpret ( vectors, [ [ x, y, 0 ] ] );
      if ( sstack == null ) break;
      rgb = S.validify ( 3, sstack );
    }
    else {
      rgb = [ x, y, 0 ];
    }

    data[ i + 0 ] = rgb[ 0 ] * 256 | 0;
    data[ i + 1 ] = rgb[ 1 ] * 256 | 0;
    data[ i + 2 ] = rgb[ 2 ] * 256 | 0;

  }

  ctx.putImageData ( idata, 0, 0 );


  ctx.canvas.addEventListener ( 'click', ( e ) => {

    const rect = ctx.canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = rect.right - rect.left;
    const h = rect.bottom - rect.top;

    let sstack = [ [ x / w, y / h, 0 ] ];
    console.log ( 'stack before:', copy ( sstack ) );
    sstack = S.interpret ( vectors, sstack );
    console.log ( 'stack after:', copy ( sstack ) );
    const rgb = S.validify ( 3, sstack );
    console.log ( 'values:', copy ( rgb ) );
  } );

}
