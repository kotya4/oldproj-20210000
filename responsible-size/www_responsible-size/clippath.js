
const ClipPath = {

  update_element_image_and_generate_clipPath

};


// to apply clip-path ( f.e. from svg ) to the resizable element,
// you need to generate normalized svg clipPath values ( i.e. between 0 and 1 )
// and set up clipPathUnits="objectBoundingBox".
// First of all, i cannot find any options to save svg with normalized values
// in programs such "inkscape" nor "adobe illustrator".
// Thurthermore, browsers such chrome or safari cannot add clip-path attribute
// in css from external svg file ( it is a bug ), so you need to embed all your svgs
// in html body ( you must set opacue and absolute position to that elements, or
// elements will appear on the screen ). not very convinient, huh?
// so i decided to write auto clip-path generator.
// it will generate clip-path according to provided image using square marching algorithm.


// TODO: need refactor.
function update_element_image_and_generate_clipPath(elem, img_src) {

  const img = new Image();
  img.src = img_src;
  img.onload = _ => {

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, img.width, img.height).data;

    const dx = 10;
    const dy = 10;

    const notAlphaMask = [];

    // TODO: if image is collided with its boundary, then
    //       square marching may cut off part of an image.
    //       you need to resize image with some margins,
    //       or you can edit alpha mask logic.
    notAlphaMaskWidth = img.width / dx | 0;
    notAlphaMaskHeight = img.height / dy | 0;


    const polygons = [];


    fill_notAlphaMask();


    // makes clip, but includes all non-alpha pixels as polygon part.
    // can be used to make animation.
    // get_neighbour_rect(...find_first_alpha_pos());

    // but to generate real clipPath use square marching.
    square_marching_polygons();


    let last_merged_i = polygons.length;
    let redundants = polygons.map(_ => false);


    merge_polygons();


    const polynum = redundants.filter(e => !e).length;

    // HACK: if polynum === last_merged_i, then "redundants" is not
    //       nessesary. but i think it is so not in all cases.

//    console.log('polygons number before merging: ' + polygons.length);
//    console.log('polygons number after merging: ' + polynum);

    draw_merged_polygons();

    // elem.append(ctx.canvas);
    elem.append(img);

    if (polynum === 1) {

      // Ok
      const polygons_str = polygons[0].map(to_path_space).map(p => `${p[0]}% ${p[1]}%`).join(', ');
      elem.style.clipPath = `polygon(${polygons_str})`;
//      console.log(polygons_str);

    } else if (polynum > 1) {

//      // console.log('image was raytraced as multipoligonal');
      throw Error('image was raytraced as multipoligonal');

    } else {

      throw Error('image is empty or idk');

    }

    // TODO: you can interpolate polygons to smooth them,
    //       then you can remove points, there angle between
    //       joined lines are less than some epsilon.
    //       it will reduce points number and make clip path
    //       beautyful.


    function fill_notAlphaMask() {

      let ax = 0;
      let ay = 0;

      for (let y = 0; y < img.height; y += dy) {
        ax = 0;

        for (let x = 0; x < img.width; x += dx) {

          const i = ( ( y * img.width + x ) << 2 );

          const k = ( ay * notAlphaMaskWidth + ax );

          notAlphaMask[ k ] = data [ i + 3 ] !== 0;

          if (notAlphaMask[ k ] === true) {

            // ctx.fillStyle = 'cyan';
            // ctx.fillRect(x, y, dx-1, dy-1);

            // const r = alpha_rect (x, y);
            // ctx.strokeStyle = 'cyan';
            // ctx.beginPath();
            // ctx.moveTo(...r[0]);
            // r.forEach(e => ctx.lineTo(...e));
            // ctx.closePath();
            // ctx.stroke();
          }

          ax++;
        }

        ay++;
      }

      draw_notAlphaMask();
    }


    function draw_notAlphaMask() {
      for (let y = 0; y < notAlphaMaskHeight; y += 1)
        for (let x = 0; x < notAlphaMaskWidth; x += 1)
      {
        const i = ( y * notAlphaMaskWidth + x );
        if (notAlphaMask[ i ] === true) {
          const r = alpha_rect (x, y);
          ctx.strokeStyle = 'rgba(100, 100, 0, 0.5)';
          ctx.beginPath();
          ctx.moveTo(r[0][0]*dx, r[0][1]*dy);
          r.forEach(e => ctx.lineTo(e[0]*dx, e[1]*dy));
          ctx.closePath();
          ctx.stroke();
        }
      }
    }


    function alpha_rect (x, y) {

      return [

        // clockwise
        [ x - 1 / 2, y - 1 / 2 ],
        [ x + 1 / 2, y - 1 / 2 ],
        [ x + 1 / 2, y + 1 / 2 ],
        [ x - 1 / 2, y + 1 / 2 ],

      ];

    }


    function find_first_alpha_pos () {

      for (let y = 0; y < notAlphaMaskHeight; y += 1)
        for (let x = 0; x < notAlphaMaskWidth; x += 1)
      {
        const i = ( y * notAlphaMaskWidth + x );

        if ( notAlphaMask [ i ] ) return [ x, y ];
      }

      throw Error('image raytraced as empty (image is empty or ray steps are too big)');

    }


    function push_alpha_rect (rectangle) {


      for (let pi = 0; pi < polygons.length; ++pi) {



        for (let i = 0; i < 4; ++i) {

          const rp = rectangle[i];

          const si = polygons[pi].findIndex(pp => pp[0] === rp[0] && pp[1] === rp[1]);


          if (si >= 0) {

            const shifted = [];

            for (let k = 0; k < 4; ++k) {

              shifted.push( rectangle [ ( i + k ) % 4 ] );

            }

            polygons[pi].splice(si, 0, ...shifted);

            return;

          }


        }



      }

      // rectangle inserted as new polygon

      polygons.push(rectangle);

    }


    function fill_mask_pixel(x, y) {
      const r = Math.random()*256;
      const g = Math.random()*256;
      const b = Math.random()*256;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * dx, y * dy, dx-1, dy-1);
//      console.log(x, y);
    }


    // const unmodyfied_notAlphaMask = [...notAlphaMask];
    // function is_edge(x, y) {
    //   if (x < 0 || x >= notAlphaMaskWidth || y < 0 || y >= notAlphaMaskHeight) return true;
    //   if (unmodyfied_notAlphaMask[y * notAlphaMaskWidth + x] === false) return true;
    //   return false;
    // }


    // modifies "notAlphaMask", recourcive
    function get_neighbour_rect (x, y) {

      if (x > 0) x = x % notAlphaMaskWidth;
      if (y > 0) y = y % notAlphaMaskHeight;
      if (x < 0) x = x + ( x % notAlphaMaskWidth );
      if (y < 0) y = y + ( y % notAlphaMaskHeight );

      const i = ( y * notAlphaMaskWidth + x );

      if ( notAlphaMask [i] ) {

        notAlphaMask [i] = false;

        // if (is_edge(x-1, y)
        // ||  is_edge(x+1, y)
        // ||  is_edge(x  , y-1)
        // ||  is_edge(x  , y+1))
        // {

        const rect = alpha_rect (x, y);

        push_alpha_rect (rect);

        // }

        get_neighbour_rect (x - 1, y    );
        get_neighbour_rect (x + 1, y    );
        get_neighbour_rect (x    , y - 1);
        get_neighbour_rect (x    , y + 1);
        // HACK: can be 8 but not nessesary
        // get_neighbour_rect (x - 1, y - 1);
        // get_neighbour_rect (x - 1, y + 1);
        // get_neighbour_rect (x + 1, y - 1);
        // get_neighbour_rect (x + 1, y + 1);

      }

      // is alpha

    }


    function is_edge_2 (x, y) {
      if ( x < 0 || x >= notAlphaMaskWidth || y < 0 || y >= notAlphaMaskHeight ) return false;
      if ( notAlphaMask [y * notAlphaMaskWidth + x] ) return true;
      return false;
    }


    function draw_points(points) {
      if (points.length === 0) return;
      ctx.strokeStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(...to_img_space(points[0]));
//      // console.log(...to_img_space(points[0]));
      for (let q = 1; q < points.length; ++q) {
        ctx.lineTo(...to_img_space(points[q]));
      }
      ctx.stroke();
    }


    function join_line_to_polygon(chead, ctail) {
      for (let k = 0; k < polygons.length; ++k) {

        const phead = polygons[k][0];
        const ptail = polygons[k][polygons[k].length - 1];

        if ( points_are_equal ( phead, ctail ) ) {

          polygons[k] = [ chead, ...polygons[k] ];
          return true;

        }

        else if ( points_are_equal ( ptail, chead ) ) {

          polygons[k] = [ ...polygons[k], ctail ];
          return true;

        }

      }

      return false; // line is not part of any existing polygon
    }


    // modifies "polygons"
    function square_marching_polygons() {

      // clockwise
      // same table as in https://en.wikipedia.org/wiki/Marching_squares
      const lookup = [

        [],
        [[0.0, 0.5], [0.5, 1.0]],
        [[0.5, 1.0], [1.0, 0.5]],
        [[0.0, 0.5], [1.0, 0.5]],
        [[1.0, 0.5], [0.5, 0.0]],
        [[0.0, 0.5], [0.5, 0.0], [1.0, 0.5], [0.5, 1.0]],
        [[0.5, 1.0], [0.5, 0.0]],
        [[0.0, 0.5], [0.5, 0.0]],
        [[0.5, 0.0], [0.0, 0.5]],
        [[0.5, 0.0], [0.5, 1.0]],
        [[0.5, 0.0], [1.0, 0.5], [0.5, 1.0], [0.0, 0.5]],
        [[0.5, 0.0], [1.0, 0.5]],
        [[1.0, 0.5], [0.0, 0.5]],
        [[1.0, 0.5], [0.5, 1.0]],
        [[0.5, 1.0], [0.0, 0.5]],
        [],

      ];

      for (let y = 0; y < notAlphaMaskHeight; y += 1)
        for (let x = 0; x < notAlphaMaskWidth; x += 1)
      {

        if (notAlphaMask[( y * notAlphaMaskWidth + x )] === false) {

          const ctl = 0b1000;
          const ctr = 0b0100;
          const cbr = 0b0010;
          const cbl = 0b0001;

          const corners = ( is_edge_2 (x-1, y  ) ? (ctl | cbl) : 0 )
                        | ( is_edge_2 (x+1, y  ) ? (ctr | cbr) : 0 )
                        | ( is_edge_2 (x  , y-1) ? (ctl | ctr) : 0 )
                        | ( is_edge_2 (x  , y+1) ? (cbl | cbr) : 0 )
                        | ( is_edge_2 (x-1, y-1) ? (ctl) : 0 )
                        | ( is_edge_2 (x+1, y-1) ? (ctr) : 0 )
                        | ( is_edge_2 (x-1, y+1) ? (cbl) : 0 )
                        | ( is_edge_2 (x+1, y+1) ? (cbr) : 0 )
                        ;


          let points = lookup[corners].map(p => [ p[0] + x - 0.5, p[1] + y - 0.5 ] );
          draw_points(points);

          // some cases have 2 lines (4 points),
          // each line can be connected to some polygon
          for (let t = 0; t < points.length; t += 2) {

            const chead = points[t + 0];
            const ctail = points[t + 1];

            // you can merge points to polygons here        //
            // but you also would need to merge polygons    //
            // with polygons after,                         //
            // BUT you must do this in here                 //
            // AND there,                                   //
            // or idk what happens but number of polygons   //
            // after merging would be as it is merged only  //
            // here. i hope you understand.                 //
            const inserted = join_line_to_polygon(chead, ctail);

            if (!inserted) {

              polygons.push([ chead, ctail ]);

            }

          }

        }

      }

    }


    function points_are_equal(p1, p2) {
      const eps = 0.3;
      return Math.abs(p1[0] - p2[0]) <= eps && Math.abs(p1[1] - p2[1]) <= eps;
    }


    // modyfies "polygons", "redundants", "last_merged_i"
    function merge_polygons() {

      for (let i = polygons.length - 1; i >= 0; --i) {

        const ihead = polygons[i][0];
        const itail = polygons[i][polygons[i].length - 1];

        for (let k = 0; k < last_merged_i; ++k) {

          if (k === i) continue;

          const khead = polygons[k][0];
          const ktail = polygons[k][polygons[k].length - 1];

          if ( points_are_equal ( ktail, ihead ) ) {

            polygons[k] = [ ...polygons[k], ...polygons[i].slice(1) ];
            last_merged_i = i;
            redundants[i] = true;

          }

          else if ( points_are_equal ( itail, khead ) ) {

            polygons[k] = [ ...polygons[i], ...polygons[k].slice(1) ];
            last_merged_i = i;
            redundants[i] = true;

          }

        }

      }

    }


    function draw_merged_polygons() {
      for (let k = 0; k < polygons.length; ++k) {
        if (redundants[k]) continue;
        const polygon = polygons[k];
        ctx.strokeStyle = random_rgb();
        ctx.beginPath();
        ctx.moveTo(...to_img_space(polygon[0]));
        for (let i = 1; i < polygon.length; ++i) {
          ctx.lineTo(...to_img_space(polygon[i]));
        }
        ctx.closePath();
        ctx.stroke();
      }
    }


    function to_img_space(p) {
      return [ p[0] / notAlphaMaskWidth * img.width, p[1] / notAlphaMaskHeight * img.height ];
    }

    function to_path_space(p) {
      return [ p[0] / notAlphaMaskWidth * 100 | 0, p[1] / notAlphaMaskHeight * 100 | 0 ];
    }


    function random_rgb() {
      const r = Math.random() * 156 + 100;
      const g = Math.random() * 156 + 100;
      const b = Math.random() * 156 + 100;
      return `rgb(${r},${g},${b})`;
    }

  };
}
