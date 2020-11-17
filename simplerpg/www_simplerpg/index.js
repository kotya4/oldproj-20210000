// import { EffectComposer } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/ShaderPass.js';
// import { FBXLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/FBXLoader.js';
// import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js';

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://cdn.jsdelivr.net/npm/three@0.114/examples/jsm/controls/DragControls.js'; // do not use version 121

/* gen by new.py at 2020-09-22 08:15:12.085995 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');

  const width = 400, height = 400;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  renderer.setClearColor(0xa0a0a0);

  const canvas = new Utils.DisplayCanvas(width, height, { imageRendering: 'pixelated', imageSmoothingEnabled: false });
  const ctx = canvas.ctx;

  const display = new Utils.DisplayContainer(width, height, [renderer, canvas], { outline: 'none' });


  /////////////////////////////////////////////////
  /////////////////////////////////////////////////


  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;

  const controls = new OrbitControls(camera, display.domElement);
  Utils.localStorage.listenTHREEControls(controls, 'simpleprg_orbit', 1000);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(-0.25, 1, 0.5);
  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0xf0f0f0);
  scene.add(light);

  const material = new THREE.MeshLambertMaterial({ color: 0x005555 });

  const geometry = new THREE.SphereGeometry(2, 10, 10);

  // const geometry = new THREE.BoxGeometry(1, 1, 1);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.set(0, 0, 0);
  // scene.add(mesh);

  // await new Promise(r => {
  //   (new THREE.TextureLoader()).load('www_simplerpg/test.png', (texture) => {
  //     const material = new THREE.MeshBasicMaterial({ map: texture });
  //     mesh.material = material;

  //     // creating CanvasImageData to use in Utils.getRGBAFromCanvasImageDataUV
  //     const canvas = new Utils.DisplayCanvas(texture.image.width, texture.image.height);
  //     canvas.ctx.drawImage(texture.image, 0, 0);
  //     const imageData = canvas.ctx.getImageData(0, 0, texture.image.width, texture.image.height);
  //     mesh.material.textureImageData = imageData;

  //     r();
  //   })
  // });



  const wireframe = new THREE.WireframeGeometry(geometry);
  const line = new THREE.LineSegments(wireframe);
  line.material.depthTest = false;
  line.material.opacity = 0.25;
  line.material.transparent = true;
  scene.add(line);


  const axis = new Utils.THREETransformAxis(DragControls, scene, camera, display.domElement, { controls });
  axis.setObject(line);



  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  const clock = new Utils.Clock();
  (function animate() {
    window.requestAnimationFrame(animate);
    const delta = clock.getDelta();

    renderer.render(scene, camera);
    // composer.render(delta);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    // fps
    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${delta}`, 20, 20);
    ctx.restore();
  })();
}
