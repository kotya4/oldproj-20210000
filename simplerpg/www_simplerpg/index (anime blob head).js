import { FBXLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/three.js/102/three.js';

/* gen by new.py at 2020-09-22 08:15:12.085995 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const width = 200, height = 200;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  const canvas = new Utils.DisplayCanvas(width, height, { imageRendering: 'pixelated', imageSmoothingEnabled: false });
  const ctx = canvas.ctx;

  const display = new Utils.DisplayContainer(width, height, [renderer, canvas], { outline: 'none' });

  /////////////////////////////////////////////////
  /////////////////////////////////////////////////

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  const controls = new OrbitControls(camera, display.domElement);

  const keys = {};
  addEventListener('keydown', (e) => keys[e.code] = true);
  addEventListener('keyup', (e) => keys[e.code] = false);

  const material = new THREE.MeshLambertMaterial( { color: 0x005555 } );
  const geometry = new THREE.SphereGeometry(2, 10, 10);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = -Math.PI / 2;

  (new THREE.TextureLoader()).load('www_simplerpg/test.png', (texture) => {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    mesh.material = material;
  });

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set(-0.25, 1, 0.5);
  const light = new THREE.AmbientLight( 0xf0f0f0 ); // soft white light

  scene.add(light);
  scene.add(directionalLight);
  scene.add(mesh);

  renderer.setClearColor(0xa0a0a0);


  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  const clock = new Utils.Clock();
  (function animate() {
    window.requestAnimationFrame(animate);
    const delta = clock.getDelta();

    renderer.render(scene, camera);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    // fps
    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${delta}`, 20, 20);
    ctx.restore();
  })();
}
