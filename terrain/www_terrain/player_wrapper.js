/*
  This is code wrapper for player logic and testing.
*/

const player_pos = new THREE.Vector3(1, 1, 1); // Default player position.
const player_rc = new THREE.Raycaster( // Player raycaster.
  new THREE.Vector3(1, 1000, 1), // Default position. "y" has to be higher than any terrain vertex.
  new THREE.Vector3(0, -1, 0),   // Default derection. Looks straight down.
);

function load_player_pos() {
  const str = localStorage.getItem('player_pos');
  if (str) {
    const raw = JSON.parse(str);
    player_pos.x = parseFloat(raw[0]);
    player_pos.y = parseFloat(raw[1]);
    player_pos.z = parseFloat(raw[2]);
    // console.log('Loaded ', player_pos, raw);
  }
}

function save_player_pos() {
  const str = JSON.stringify([player_pos.x, player_pos.y, player_pos.z]);
  localStorage.setItem('player_pos', str);
}

function player_fall_on_mesh(mesh) {
  player_rc.ray.origin.x = player_pos.x;
  player_rc.ray.origin.z = player_pos.z;
  const intersects = player_rc.intersectObject(mesh);
  for (let i = 0; i < intersects.length; ++i) {
    const o = intersects[i];
    player_pos.y = o.point.y + 1.0;
    console.log(o);
    break; // need only nearest object.
  }
}

//////////////////////

function load_orbit_controls(controls) {
  const str = window.localStorage.getItem('orbit_controls');
  if (str) {
    const raw = JSON.parse(str);
    // console.log(raw);
    controls.zoom0 = parseFloat(raw[0]);
    controls.position0.x = parseFloat(raw[1]);
    controls.position0.y = parseFloat(raw[2]);
    controls.position0.z = parseFloat(raw[3]);
    controls.target0.x = parseFloat(raw[4]);
    controls.target0.y = parseFloat(raw[5]);
    controls.target0.z = parseFloat(raw[6]);
    controls.reset();
  }
}

function save_orbit_controls(controls) {
  controls.saveState();
  const str = JSON.stringify([
    controls.zoom0,
    controls.position0.x,
    controls.position0.y,
    controls.position0.z,
    controls.target0.x,
    controls.target0.y,
    controls.target0.z,
  ]);
  // console.log(str);
  localStorage.setItem('orbit_controls', str);
}

//////////////////////

// Creates terrain geometry.
function create_chunk_geometry(values) {
  const chunk_size = 10, chunk_x = 0, chunk_y = 0;
  const geometry = new THREE.Geometry();
  const I = (x, y) => x + y * chunk_size;

  for (let y = 0; y < chunk_size; ++y)
    for (let x = 0; x < chunk_size; ++x)
  {
    let z = 0;
    for (let i = 0; i < values.length; ++i) {
      const factor = values[i][0] * 4;
      const scaler = values[i][1] * 10;
      z += noise.simplex2((chunk_x + x) * factor, (chunk_y + y) * factor) * scaler;
    }

    geometry.vertices.push(new THREE.Vector3(x, z, y));
    if (x < chunk_size-1 && y < chunk_size-1) {
      geometry.faces.push(new THREE.Face3(I(x+0, y+0), I(x+0, y+1), I(x+1, y+0)));
      geometry.faces.push(new THREE.Face3(I(x+0, y+1), I(x+1, y+1), I(x+1, y+0)));
    }
  }

  geometry.computeFaceNormals(); // flat shading
  // geometry.computeVertexNormals(); // smooth shading

  return geometry;
}

//////////////////////

class Slider {
  constructor(parent) {
    this.node = document.createElement('input');
    this.node.type = 'range';
    this.node.step = 'any';
    this.node.max = 1.0;
    this.node.min = 0.0;
    this.node.value = 0;
    this.value_node = document.createElement('div');
    this.update_value();
    parent.appendChild(this.node);
    parent.appendChild(this.value_node);
  }
  update_value(value=null) {
    if (null != value) this.node.value = value;
    this.value_node.innerText = this.node.value;
  }
  onchange(cb) {
    this.node.addEventListener('change', () => {
      this.update_value();
      cb(this.node.value);
    });
  }
}

function create_sliders() {
  /*
  // Setting up sliders.
  terrain_values.forEach((e,i) => e.forEach((e,k) => {
    const s = new Slider(slider_container);
    s.update_value(e);
    s.onchange((v) => {
      terrain_values[i][k] = v;
      terrain_mesh.geometry = create_chunk_geometry(terrain_values);
      localStorage.setItem('terrain_values', JSON.stringify(terrain_values));
    });
  }));
  */
}

function setup_terrain_mesh() {
  /*
  // Setting up mesh.
  // terrain_mesh.material.side = THREE.DoubleSide;
  // terrain_mesh.rotation.x = Math.PI / 2;
  // terrain_mesh.position.set(-5, 0, -5);
  // terrain_mesh.scale.set(0.1, 0.1, 0.1);
  */
}

//////////////////////

const chunks_num = 3; // Number of rows/columns to be buffered in 'chunks'. Must be odd.
// 3 by 3 array of raw geometry of local chunks.
const chunks = Array(chunks_num).fill().map(() => Array(chunks_num).fill().map(() => (
  {
    mesh: null,
    need_update: true,
  }
)));
const chunk_size = 10; // Size of chunk in world-space.
const chunks_origin = [-1000, -1000];
const chunk_faces = predefine_chunk_geomerty_faces(); // chunks share geometry faces.
const default_chunk_material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );

function predefine_chunk_geomerty_faces() {
  const faces = [];
  const I = (x, y) => x + y * (chunk_size+1);
  for (let y = 0; y < chunk_size; ++y)
    for (let x = 0; x < chunk_size; ++x)
  {
    faces.push(new THREE.Face3(I(x+0, y+0), I(x+0, y+1), I(x+1, y+0)));
    faces.push(new THREE.Face3(I(x+0, y+1), I(x+1, y+1), I(x+1, y+0)));
  }
  return faces;
}

// player_pos  THREE.Vector3  World-space position.
// scene       THREE.Scene    To remove deleted meshes and adding new ones.
function update_chunks(player_pos, scene) {
  // mapping player position from world-space to chunk-space.
  const new_origin_x = player_pos.x / (chunk_size) | 0;
  const new_origin_y = player_pos.z / (chunk_size) | 0;
  // how far player from local origin.
  const origin_dx = chunks_origin[0] - new_origin_x;
  const origin_dy = chunks_origin[0] - new_origin_y;
  // do not update chunks if player did not move.
  if (origin_dx === 0 && origin_dy === 0) return;
  // copying existing vertices to new chunks if
  // player did move ONE chunk in any direction.
  const adx = Math.abs(origin_dx);
  const ady = Math.abs(origin_dy);
  if (adx === 1 || ady === 1) {
    const x0 = origin_dx < 0 ? chunks_num - 1 : 0;
    const y0 = origin_dy < 0 ? chunks_num - 1 : 0;
    const dx = origin_dx < 0 ? -1 : +1;
    const dy = origin_dy < 0 ? -1 : +1;
    for (let y = 0; y < chunks_num-ady; ++y)
      for (let x = 0; x < chunks_num-adx; ++x)
    {
      const x_ = x0 + x * dx;
      const y_ = y0 + y * dy;
      if (null !== chunks[y_ + origin_dy][x_ + origin_dx].mesh) {
        chunks[y_][x_].mesh = chunks[y_ + origin_dy][x_ + origin_dx].mesh;
        chunks[y_][x_].need_update = false;
      }
    }
  }
  // apply new origin.
  chunks_origin[0] = new_origin_x;
  chunks_origin[1] = new_origin_y;
  // generate chunks.
  for (let y = 0; y < chunks_num; ++y)
    for (let x = 0; x < chunks_num; ++x)
  {
    // mapping iterators from array-space to world-space.
    const chunk_x = (x - (chunks_num >> 1) + chunks_origin[0]) * (chunk_size);
    const chunk_y = (y - (chunks_num >> 1) + chunks_origin[1]) * (chunk_size);
    if (true === chunks[y][x].need_update) {
      // remove old mesh from scene
      scene.remove(chunks[y][x].mesh);
      // create mesh.
      chunks[y][x].mesh = new THREE.Mesh(
        generate_chunk_geometry(chunk_x, chunk_y),
        default_chunk_material,
      );
      // add new mesh to scene
      scene.add(chunks[y][x].mesh);
    }
    // set up mesh position
    chunks[y][x].mesh.position.x = chunk_x;
    chunks[y][x].mesh.position.y = 0;
    chunks[y][x].mesh.position.z = chunk_y;
    // set all chunks to update.
    chunks[y][x].need_update = true;
  }
}

// HACK: faces always the same. only need vertices to update.
function generate_chunk_geometry(offset_x, offset_y) {
  const geometry = new THREE.Geometry();
  const values = [[0.02, 1], [0.08, 0.09]];
  // vertices number in row or column === chunk_size + 1
  for (let y = 0; y < chunk_size+1; ++y)
    for (let x = 0; x < chunk_size+1; ++x)
  {
    let height = 0;
    for (let i = 0; i < values.length; ++i) {
      const factor = values[i][0] * 1;
      const scaler = values[i][1] * 10;
      height += noise.simplex2((offset_x + x) * factor, (offset_y + y) * factor) * scaler;
    }
    geometry.vertices.push(new THREE.Vector3(x, height, y));
  }
  geometry.faces = chunk_faces;
  geometry.computeFaceNormals(); // flat shading
  // geometry.computeVertexNormals(); // smooth shading
  return geometry;
}
