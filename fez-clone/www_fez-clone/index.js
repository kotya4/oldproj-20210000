import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';

import * as Mapp from './map.js';

import * as Utils from './utils.js';

/* gen by new.py at 2021-02-15 10:56:42.892316 */

window.onload = async function main() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const width = 600;
  const height = 300;
  const aspect = 1; //width / height;
  const fov = 45;

  // threejs

  const camera_width = 10;
  const camera_height = camera_width / aspect;
  const camera = new THREE.OrthographicCamera(-camera_width/2, +camera_width/2, +camera_height/2, -camera_height/2, 1, 1000);


  const camera_radius = 50;
  const camera_origin = new THREE.Vector3(0, 0, 0);

  function set_camera_up(v) {
    camera.position.y = v;
    camera_origin.y  = v;
  }

  set_camera_up(2);

  const second_camera_radius = 50;
  const second_camera_extra_angle = -Math.PI / 4;

  const second_camera_width = 20;
  const second_camera_height = second_camera_width / aspect;
  const second_camera = new THREE.OrthographicCamera(
    -second_camera_width/2,
    +second_camera_width/2,
    +second_camera_height/2,
    -second_camera_height/2,
    1, 1000);
  second_camera.position.z = 5;


  const scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient_light);

  // const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
  // directionalLight1.position.set(1, 1, 1);
  // scene.add(directionalLight1);

  const point_light = new THREE.PointLight(0xffffff, 1, 50);
  point_light.position.set(0, 3, 0);
  scene.add(point_light);






  const kb = new Mapp.Keyboard();
  kb.listen();






  const level = new Utils.Level(scene);
  const player = new Utils.Player(scene);

  await Promise.all([
    level.load_gltf('www_fez-clone/wisdom_interior_1.glb'),
    player.load_gltf('www_fez-clone/wisdom_earle_anim2.glb'),
  ]);

  player.settle_in(level);




  // 2d context

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  // layout

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ctx.canvas);

  // render cicle

  renderer.setScissorTest(true);

  let old_timestamp = null;
  (function render(timestamp) {
    window.requestAnimationFrame(render);
    const elapsed = (timestamp - old_timestamp || 0) / 1000;
    old_timestamp = timestamp;




    if (kb.keys['KeyA'] ^ kb.keys['KeyD']) {
      if (kb.keys['KeyA']) player.move_hor(+elapsed);
      if (kb.keys['KeyD']) player.move_hor(-elapsed);
    }
    if (kb.keys['KeyQ']) player.start_rotation(+1);
    if (kb.keys['KeyE']) player.start_rotation(-1);

    // if (kb.keys['KeyW']) { camera.position.y += -0.01; camera_origin.y  += -0.01; }
    // if (kb.keys['KeyS']) { camera.position.y += +0.01; camera_origin.y  += +0.01; }

    if (kb.keys['Digit1']) { player.animation.change('idle', 1, 1); }
    if (kb.keys['Digit2']) { player.animation.change('run', 1, 1); }
    if (kb.keys['Digit3']) { player.animation.change('jump', 1, 1); }



    camera_origin.x = player.position.x;
    camera_origin.z = player.position.z;
    camera.position.x = camera_origin.x + camera_radius * Math.sin(player.rotation);
    camera.position.z = camera_origin.z + camera_radius * Math.cos(player.rotation);
    camera.lookAt(camera_origin);
    renderer.setViewport(0, 0, width/2, height);
    renderer.setScissor(0, 0, width/2, height);
    renderer.render(scene, camera);

    second_camera.position.x = player.position.x + second_camera_radius * Math.sin(player.rotation + second_camera_extra_angle);
    second_camera.position.y = second_camera_radius / 2; // pitch is 45 degrees
    second_camera.position.z = player.position.z + second_camera_radius * Math.cos(player.rotation + second_camera_extra_angle);
    second_camera.lookAt(player.position);
    renderer.setViewport(width/2, 0, width/2, height);
    renderer.setScissor(width/2, 0, width/2, height);
    renderer.render(scene, second_camera);



    player.update(elapsed);


    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`mesh_rot ${player.mesh.rotation.y}`, 0, 24);
    ctx.fillText(`cam_rot  ${player.rotation}`, 0, 36);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`${elapsed} SPF`, width - 10, 12);
    ctx.fillText(`${renderer.info.render.triangles} tria`, width - 10, 24);
    ctx.fillText(`${renderer.info.render.frame} fram`, width - 10, 36);
    ctx.fillText(`${renderer.info.render.calls} call`, width - 10, 48);
    ctx.fillText(`${renderer.info.memory.geometries} geom`, width - 10, 60);
    ctx.fillText(`${renderer.info.memory.textures} txtr`, width - 10, 72);
    ctx.fillText(`${renderer.info.programs.length} prog`, width - 10, 84);


    ctx.restore();
  })();
}
