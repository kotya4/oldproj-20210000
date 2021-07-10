
function notWorkingDOMtoCanvasRenderer ( ctx ) {

  // ctx.fillStyle = 'red';
  // ctx.fillRect ( 0, 0, 50, ctx.canvas.height );

  // lol
  var DOMURL = window.URL || window.webkitURL || window;
  // scary as fuck :)

  var client = '<div>Hello?</div>';

  const iid = setInterval(() => {

    var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      // '<foreignObject width="100%" height="100%">' +

      // 'circle(1)' +

      String ( client.outerHTML ) +

      // '</foreignObject>' +
      '</svg>';

    // console.log(data);


    var svg = new Blob( [ data ] , {
      type: 'image/svg+xml;charset=utf-8'
    });

    var url = DOMURL.createObjectURL(svg);

    var img = new Image();

    img.src = url;

    img.onload = function() {

      ctx.fillStyle = 'cyan';
      ctx.fillRect(0, 0, 100, 100);

      ctx.drawImage(img, 0, 0);

      DOMURL.revokeObjectURL(url);

    }

    // throw Error ('oshipka');

    clearInterval(iid);

  }, 100);

}
