/* gen by new.py at 2021-04-13 07:08:40.893168 */
window.onload = async function onload () {

  // DOM

  const element = document.createElement('div');
  element.className = 'element';

  const text = document.createElement('div');
  text.className = 'text';

  const something = document.createElement('div');
  something.className = 'something';
  something.innerText = 'something';

  const client = document.createElement('div');
  client.className = 'client';
  client.append ( element );
  client.append ( text );
  client.append ( something );


  // drawable canvas

  const ctx = document.createElement( 'canvas' ).getContext ( '2d' );
  ctx.canvas.width = 30;
  ctx.canvas.height = 50;
  // ctx.canvas.style.height = "300px";

  const paletteColor = document.createElement ( 'input' );
  paletteColor.type = 'range';
  paletteColor.min = '0';
  paletteColor.max = '360';
  paletteColor.value = String ( Math.random () * 360 | 0 );

  const paletteSize = document.createElement ( 'input' );
  paletteSize.type = 'range';
  paletteSize.min = '1';
  paletteSize.max = '10';
  paletteSize.value = '5';

  const palette = document.createElement ( 'div' );
  palette.className = 'palette';
  palette.append ( paletteColor );
  palette.append ( paletteSize );


  client.append ( ctx.canvas );
  client.append ( palette );


  let paletteSizeValue = ~~paletteSize.value;
  let userPaints = false;
  let canvasRect = null;
  let paletteRGB = paletteColorToRGB ( ~~paletteColor.value );


  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.canvas.addEventListener( 'mousedown', onCanvasMouseDown );
  ctx.canvas.addEventListener( 'mousemove', onCanvasMouseMove );
  ctx.canvas.addEventListener( 'mouseup', onCanvasMouseUp );
  ctx.canvas.addEventListener( 'mouseleave', onCanvasMouseLeave );

  paletteColor.addEventListener( 'input', onPaletteColorInput );
  paletteSize.addEventListener( 'input', onPaletteSizeInput );


  function onCanvasMouseDown ( event ) {

    userPaints = true;

    canvasRect = ctx.canvas.getBoundingClientRect ();

    const { clientX, clientY } = event;

    // ... reverse mouse if you need ...

    paint ( clientX, clientY );

  }


  function onCanvasMouseMove ( event ) {

    if ( userPaints ) {

      const { clientX, clientY } = event;

      // ... reverse mouse if you need ...

      paint ( clientX, clientY );

    }

  }


  function onCanvasMouseUp ( event ) {

    userPaints = false;

  }


  function onCanvasMouseLeave ( event ) {

    userPaints = false;

  }


  function onPaletteColorInput ( _ ) {

    paletteRGB = paletteColorToRGB ( ~~paletteColor.value );

  }


  function onPaletteSizeInput ( _ ) {

    paletteSizeValue = ~~paletteSize.value;

  }


  function paletteColorToRGB ( v ) {

    v = v / 360 * 256 | 0;

    return `rgb(${v},${v},${v})`;

  }


  function paint ( clientX, clientY ) {

    const [ spacedX, spacedY ] = [ clientX - canvasRect.x, clientY - canvasRect.y ];

    ctx.fillStyle = paletteRGB;
    ctx.beginPath ();
    ctx.arc ( spacedX, spacedY, paletteSizeValue, 0, 2 * Math.PI, false );
    ctx.closePath ();
    ctx.fill ();

  }




  // init page

  document.body.append(client);

  ResizablePage.init ( client, [ element, ctx.canvas ], text );

  ClipPath.update_element_image_and_generate_clipPath(element, './www_responsible-size/figure.png');

}

