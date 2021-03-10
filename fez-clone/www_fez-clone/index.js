import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


import { Keyboard } from './utils.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { Town } from './town.js';


/* gen by new.py at 2021-02-15 10:56:42.892316 */
window.onload = async function main() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const width = 600;
  const height = 300;

  // threejs
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  renderer.setScissorTest(true);

  // 2d context
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  // layout
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ctx.canvas);

  // ===============
  // initializations
  // ===============

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfb395);

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient_light);

  // const directional_light = new THREE.DirectionalLight(0xffffff, 1.0);
  // directional_light.position.set(1, 1, 1);
  // scene.add(directional_light);

  const point_light = new THREE.PointLight(0xffffff, 1, 50);
  point_light.position.set(0, 3, 0);
  scene.add(point_light);






  const kb = new Keyboard();
  kb.listen();


  const player = new Player(scene);
  player.init_orthocamera(10, 1, 50);
  player.init_axocamera(120, 1, 50);


  const level = new Town(scene);


  await Promise.all([
    // level.load_gltf('www_fez-clone/wisdom_interior1.glb'),
    level.load_gltf('www_fez-clone/wisdom_town1_3.glb'),
    player.load_gltf('www_fez-clone/wisdom_earle_anim2.glb'),
  ]);


  player.apply_level(level);

  level.init_rt(player.orthocamera);



  // ============
  // render cicle
  // ============

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

    if (kb.keys['Digit1']) { player.animation.change('idle', 1, 1); }
    if (kb.keys['Digit2']) { player.animation.change('run',  1, 1); }
    if (kb.keys['Digit3']) { player.animation.change('jump', 1, 1); }


    player.update(elapsed);






    level.update_rt(renderer, player.orthocamera);








    renderer.setViewport(0, 0, width/2, height);
    renderer.setScissor(0, 0, width/2, height);
    renderer.render(scene, player.orthocamera.camera);


    renderer.setViewport(width/2, 0, width/2, height);
    renderer.setScissor(width/2, 0, width/2, height);
    renderer.render(scene, player.axocamera.camera);


    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`mesh_rot ${player.mesh.rotation.y}`, 10, 24);
    ctx.fillText(`cam_rot  ${player.orthocamera.rotation}`, 10, 36);

    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`${elapsed}  SPF`, width - 10, 12);
    ctx.fillText(`${renderer.info.render.triangles} tria`, width - 10, 24);
    ctx.fillText(`${renderer.info.render.frame} fram`, width - 10, 36);
    ctx.fillText(`${renderer.info.render.calls} call`, width - 10, 48);
    ctx.fillText(`${renderer.info.memory.geometries} geom`, width - 10, 60);
    ctx.fillText(`${renderer.info.memory.textures} txtr`, width - 10, 72);
    ctx.fillText(`${renderer.info.programs.length} prog`, width - 10, 84);

    ctx.fillStyle = 'black';
    ctx.fillRect(width/2, 0, 2, height);

    ctx.restore();
  })();
}
