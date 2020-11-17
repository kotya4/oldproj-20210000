/* gen by new.py at 2020-09-09 22:39:50.465419 */
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';

window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const height = 400;
  const width = 400;

  // Render container.

  const container = document.createElement('div');
  container.classList.add('render-container');
  container.style.height = `${height}px`;
  container.style.width = `${width}px`;
  document.body.appendChild(container);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  ctx.imageSmoothingEnabled = false;
  container.appendChild(ctx.canvas);

  for (let node of container.children) {
    node.style.position = 'absolute';
  }

  // Slider container.

  const slider_container = document.createElement('div');
  slider_container.classList.add('slider-container');
  document.body.appendChild(slider_container);

  // System.
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const controls = new OrbitControls(camera, container);
  const keys = {};
  // Other.
  const material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
  const material_white = new THREE.MeshLambertMaterial( { color: 0xffffff } );
  const geometry_sphere = new THREE.SphereGeometry(1, 4, 4);
  const mesh_sphere = new THREE.Mesh(geometry_sphere, material_white);
  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  const light = new THREE.AmbientLight( 0x404040 ); // soft white light
  const basic_material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  const terrain_values = JSON.parse(localStorage.getItem('terrain_values')) || [[0.1, 1], [0, 0]];
  const terrain_mesh = new THREE.Mesh(create_chunk_geometry(terrain_values), material);

  // console.log(terrain_values)



  // Keyboard.
  addEventListener('keydown', (e) => keys[e.code] = true);
  addEventListener('keyup', (e) => keys[e.code] = false);

  // Mesh with lambert material can be flat-shaded only that way.
  mesh_sphere.geometry.computeFlatVertexNormals();

  // Sets directional light.
  directionalLight.position.set(-0.25, 1, 0.5);

  // Loads from localStorage if can.
  load_player_pos();
  load_orbit_controls(controls);

  // player_pos.y = 10;

  // Sets initial position to the mesh.
  mesh_sphere.position.copy(player_pos);

  // (called in 'animate')
  function proc_keyboard_for_player(keys, delta) {
    const player_speed = 10.2 * delta;
    let pos_changed = false;

    if (keys['KeyW']) {
      player_pos.x += player_speed;
      pos_changed = true;
    }

    if (keys['KeyS']) {
      player_pos.x -= player_speed;
      pos_changed = true;
    }

    if (keys['KeyD']) {
      player_pos.z += player_speed;
      pos_changed = true;
    }

    if (keys['KeyA']) {
      player_pos.z -= player_speed;
      pos_changed = true;
    }

    if (pos_changed) {
      update_chunks(player_pos, scene);
      // TODO: тени в чанки ложатся неправильно
      // TODO: player_fall_on_mesh не работает
      // TODO: иногда чанки удаляются и генерируются неправильно
      // player_fall_on_mesh(chunks[chunks_num>>1][chunks_num>>1].mesh);     // modify player_pos.y
      // player_fall_on_mesh(terrain_mesh);     // modify player_pos.y
      mesh_sphere.position.copy(player_pos); // set up mesh position
      controls.target.copy(player_pos);      // set up controls target
      controls.update(delta);                // update contols
      save_player_pos();                     // save player position
      save_orbit_controls(controls);         // save controls
    }
  }

  // Adding things into scene.
  scene.add(light);
  scene.add(directionalLight);
  scene.add(mesh_sphere);
  // scene.add(terrain_mesh);

  ////////////////////////
  //////// RENDER ////////
  ////////////////////////

  (function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    mesh_sphere.rotation.x += 1 * delta;
    mesh_sphere.rotation.y += 1 * delta;



    proc_keyboard_for_player(keys, delta);

    renderer.render(scene, camera);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${(mesh_sphere.position.x*100|0)/100}, ${(mesh_sphere.position.y*100|0)/100}, ${(mesh_sphere.position.z*100|0)/100}`, 30, 30);
    ctx.restore();
  })();


  // const chunk_size = 30;
  // for (let y = 0; y < chunks_num; ++y)
  //   for (let x = 0; x < chunks_num; ++x)
  // {
  //   chunks[y][x] = {
  //     value: x + y * chunks_num,
  //     copied: false,
  //   };
  // }

  // const chunk_local_origin = [0, 0];


  // function draw_chunks(px, py) {
  //   ctx.clearRect(0, 0, width, height);

  //   const current_origin = [
  //     px / chunk_size | 0,
  //     py / chunk_size | 0,
  //   ];
  //   // how far player from local origin.
  //   const origin_offsets = [
  //     current_origin[0] - chunk_local_origin[0],
  //     current_origin[1] - chunk_local_origin[1],
  //   ];


  //   if (origin_offsets[0] !== 0 || origin_offsets[1] !== 0) {

  //     for (let y = 0; y < chunks_num; ++y)
  //       for (let x = 0; x < chunks_num; ++x)
  //     {
  //       chunks[y][x].copied = false;
  //     }

  //     const adx = Math.abs(origin_offsets[0]);
  //     const ady = Math.abs(origin_offsets[1]);
  //     if (adx <= 1 && ady <= 1) {
  //       const dx = origin_offsets[0];
  //       const dy = origin_offsets[1];
  //       const x0 = dx < 0 ? chunks_num - 1 : 0;
  //       const y0 = dy < 0 ? chunks_num - 1 : 0;
  //       const dx0 = dx < 0 ? -1 : +1;
  //       const dy0 = dy < 0 ? -1 : +1;
  //       for (let y = 0; y < chunks_num - ady; ++y) {
  //         for (let x = 0; x < chunks_num - adx; ++x) {
  //           const _x_ = x0 + x * dx0;
  //           const _y_ = y0 + y * dy0;
  //           chunks[_y_][_x_].value = chunks[_y_+dy][_x_+dx].value;
  //           chunks[_y_][_x_].copied = true;
  //         }
  //       }
  //     }



  //     // if (origin_offsets[0] !== 0) {
  //     //   if (origin_offsets[0] === -1) {
  //     //     for (let y = 0; y < chunks_num; ++y) {
  //     //       // for (let x = chunks_num - 1; x > 0; --x) {
  //     //       for (let x = 0; x < chunks_num - 1; ++x) {
  //     //         chunks[y][chunks_num - 1 - x].value = chunks[y][chunks_num - 1 - x - 1].value;
  //     //         chunks[y][chunks_num - 1 - x].copied = true;
  //     //       }
  //     //     }
  //     //   } else {
  //     //     for (let y = 0; y < chunks_num; ++y) {
  //     //       for (let x = 0; x < chunks_num - 1; ++x) {
  //     //         chunks[y][x].value = chunks[y][x + 1].value;
  //     //         chunks[y][x].copied = true;
  //     //       }
  //     //     }
  //     //   }
  //     // }

  //     // if (origin_offsets[1] !== 0) {
  //     //   if (origin_offsets[1] === -1) {
  //     //     for (let y = chunks_num - 1; y > 0; --y) {
  //     //       for (let x = 0; x < chunks_num; ++x) {
  //     //         chunks[y][x].value = chunks[y - 1][x].value;
  //     //         chunks[y][x].copied = true;
  //     //       }
  //     //     }
  //     //   } else {
  //     //     for (let y = 0; y < chunks_num - 1; ++y) {
  //     //       for (let x = 0; x < chunks_num; ++x) {
  //     //         chunks[y][x].value = chunks[y + 1][x].value;
  //     //         chunks[y][x].copied = true;
  //     //       }
  //     //     }
  //     //   }
  //     // }

  //   }

  //   chunk_local_origin[0] = current_origin[0];
  //   chunk_local_origin[1] = current_origin[1];

  //   for (let y = 0; y < chunks_num; ++y)
  //     for (let x = 0; x < chunks_num; ++x)
  //   {
  //     const chunk_x = (x - (chunks_num >> 1) + chunk_local_origin[0]) * chunk_size;
  //     const chunk_y = (y - (chunks_num >> 1) + chunk_local_origin[1]) * chunk_size;

  //     ctx.strokeStyle = chunks[y][x].copied ? 'blue' : 'red';
  //     ctx.strokeRect(chunk_x, chunk_y, chunk_size, chunk_size);
  //     ctx.fillStyle = 'white';
  //     ctx.fillText(`${chunks[y][x].value}`, chunk_x+2, chunk_y+20);
  //   }
  // }



  // container.addEventListener('mousemove', (e) => {
  //   const rect = container.getBoundingClientRect();
  //   const mouse_x = e.clientX - rect.x | 0;
  //   const mouse_y = e.clientY - rect.y | 0;

  //   draw_chunks(mouse_x, mouse_y);



  // });
}
