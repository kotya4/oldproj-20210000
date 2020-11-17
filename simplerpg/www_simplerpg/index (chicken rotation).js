import { FBXLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

/* gen by new.py at 2020-09-22 08:15:12.085995 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const height = 400;
  const width = 400;

  const container = document.createElement('div');
  container.classList.add('render-container');
  container.style.outline = 'none';
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

  let img_loaded = false;
  let img_i = 0;
  const img = new Image();
  img.src = sprite;
  img.onload = () => {
    img_loaded = true;
  };
  function img_draw(ctx, delta) {
    const sw = 48;
    const sh = 78;

    const sx = sw * (img_i | 0);
    const sy = sh * 2;

    const dx = 0;
    const dy = 100;
    const dw = sw;
    const dh = sh;

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    img_i = (img_i + delta * 10) % 8;
  }




  // System.
  const clock = new THREE.Clock();
  const scene = new THREE.Scene();
  // const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  const camera = new THREE.OrthographicCamera(-1, +1, +1, -1, 0.001, 1000);
  camera.position.z = 500;
  // const controls = new OrbitControls(camera, container);
  const keys = {};
  // Other.
  const material = new THREE.MeshLambertMaterial( { color: 0x005555 } );
  const geometry = new THREE.SphereGeometry(1, 4, 4);
  const mesh = new THREE.Mesh(geometry, material);
  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  // const light = new THREE.AmbientLight( 0x404040 ); // soft white light
  const light = new THREE.AmbientLight( 0xffffff ); // soft white light
  // Keyboard.
  addEventListener('keydown', (e) => keys[e.code] = true);
  addEventListener('keyup', (e) => keys[e.code] = false);
  // Sets directional light.
  directionalLight.position.set(-0.25, 1, 0.5);
  // Adding things into scene.
  scene.add(light);
  scene.add(directionalLight);
  // scene.add(mesh);
  // mesh.position.set(+0, +0, -2);

  renderer.setClearColor(0xa0a0a0, 1);


  function chiken_onload(fbx) {
    const mesh = fbx.scene || fbx;
    scene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    const origin = box.max.add(box.min).multiplyScalar(0.5);
    const scaler = Math.max(origin.x, origin.y, origin.z) + 1;

    console.log(origin);
    console.log(scaler);

    mesh.scale.multiplyScalar(1 / scaler);
    mesh.position.x = -origin.x / scaler;
    mesh.position.y = -origin.y / scaler;
    mesh.position.z = -origin.z / scaler;

    const boxhelper = new THREE.BoxHelper( mesh, 0xffff00 );
    scene.add( boxhelper );
  }
  const chiken_promise = new Promise((res,rej) =>
    (new FBXLoader()).load(
      '/www_simplerpg/Chicken/Chicken.FBX',
      (fbx) => { console.log('loaded'); chiken_onload(fbx); },
      (xhr)  => { },
      (err)  => { console.log('error', err); },
    )
  );
  // const chiken_promise = new Promise((res,rej) =>
  //   (new GLTFLoader()).load(
  //     '/www_simplerpg/walking_monitor.glb',
  //     (fbx) => { console.log('loaded'); chiken_onload(fbx); },
  //     (xhr)  => { },
  //     (err)  => { console.log('error', err); },
  //   )
  // );

  let i=0;

  function rotate_spherical(vec3, radius, theta, phi) {
    const cos_phi = Math.cos(phi);
    vec3.x = radius * Math.sin(theta) * cos_phi;
    vec3.y = radius * Math.sin(phi);
    vec3.z = radius * Math.cos(theta) * cos_phi;
    return vec3;
  }

  (function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // mesh.rotation.x += 1 * delta;
    // mesh.rotation.y += 1 * delta;

    i += 1 * delta;
    rotate_spherical(camera.position, 500, -i, Math.PI / 8);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    img_draw(ctx, delta);
    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${(camera.position.x*100|0)/100}, ${(camera.position.y*100|0)/100}, ${(camera.position.z*100|0)/100}`, 30, 30);
    // ctx.fillText(`${controls.getAzimuthalAngle()}`, 30, 50);
    ctx.restore();
  })();
}
