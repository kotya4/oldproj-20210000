
let g;
let width = 80 * 8, height;
let ctx;


const wall_rot_offset_x_spd = 1;
const wall_rot_middle_x_spd = 4;
const wall_rot_middle_y_spd = 0.3;
const wall_rot_iter_spd = 0.5;
let wall_rot_iter = 0;

let rot_offset_x = 0;
let rot_middle_x = width / 2;
// Actually rot_middle_y is the offset of middle point y coordinate used in rotation,
// when real y coordinate is always the height / 2. Used to prevent rot_middle_x to
// go to infinity.
let rot_middle_y = 0;
// Rotation stops then offset_x reaches width.
const middle_x_max = init_middle_x_max();

const columns_num = 6;

const bricks_num = 4;
const bricks_w_num = 4;
const bricks_h_num = 7;

let wall_rot_iter_max = null;
let rot_offset_x_max = null;
let rot_middle_x_max = null;
let o_wall_rot_iter = wall_rot_iter_max;
let o_rot_offset_x  = rot_offset_x_max;
let o_rot_middle_x  = rot_middle_x_max;


window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  g = new DisplayBuffer({ width: 80, height: 25 });
  [width, height] = g.get_display_sizes();
  ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width * 2;
  ctx.canvas.height = height * 2;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;
  await g.rf.promise;



  let wri = 0;
  let rox = 0;
  let rmx = width / 2;
  for ( ; rox < width; ) {
    wri += wall_rot_iter_spd;
    rox += wall_rot_offset_x_spd * wri;
    rmx += wall_rot_middle_x_spd * wri;
  }
  wall_rot_iter_max = wri;
  rot_offset_x_max  = rox;
  rot_middle_x_max  = rmx;
  o_wall_rot_iter   = wall_rot_iter_max;
  o_rot_offset_x    = rot_offset_x_max;
  o_rot_middle_x    = rot_middle_x_max;




  // MAIN
  let iid = start_render();
  let render_flag = true;
  window.addEventListener('keypress', () => {
    render_flag = !render_flag;
    if (render_flag) {
      iid = start_render();
    } else {
      clearInterval(iid);
    }
  });
}
