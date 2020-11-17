// import { EffectComposer } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/ShaderPass.js';
// import { FBXLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/FBXLoader.js';
// import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js';

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
  Utils.localStorage.connectTHREEControls(controls, 'simpleprg_orbit', 1000);

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

  await new Promise(r => {
    (new THREE.TextureLoader()).load('www_simplerpg/test.png', (texture) => {
      const material = new THREE.MeshBasicMaterial({ map: texture });
      mesh.material = material;

      // creating CanvasImageData to use in Utils.getRGBAFromCanvasImageDataUV
      const canvas = new Utils.DisplayCanvas(texture.image.width, texture.image.height);
      canvas.ctx.drawImage(texture.image, 0, 0);
      const imageData = canvas.ctx.getImageData(0, 0, texture.image.width, texture.image.height);
      mesh.material.textureImageData = imageData;

      r();
    })
  });



  // const wireframe = new THREE.WireframeGeometry( geometry );

  // const line = new THREE.LineSegments( wireframe );
  // line.material.depthTest = false;
  // line.material.opacity = 0.25;
  // line.material.transparent = true;




  function THREEMeshToBoxes(mesh, grid_max_size) {
    // grid_max_size cant be odd
    // set .material.side = THREE.DoubleSide for raycast all faces

    mesh.updateMatrixWorld(); // https://stackoverflow.com/a/27893328/10562922

    (null === mesh.geometry.boundingBox) && mesh.geometry.computeBoundingBox();

    const box_w = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
    const box_h = mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y;
    const box_d = mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z;

    const step = Math.max(box_w, box_h, box_d) / grid_max_size;

    const direction = new THREE.Vector3(0, 0, +1);

    const intersects = []; // buffer
    const raycaster = new THREE.Raycaster();

    for (let y = 0; y < box_h; y += step) {
      for (let x = 0; x < box_w; x += step) {

        const origin = new THREE.Vector3(mesh.position.x + mesh.geometry.boundingBox.min.x + x + step / 2 - direction.x,
                                         mesh.position.y + mesh.geometry.boundingBox.min.y + y + step / 2 - direction.y,
                                         mesh.position.z + mesh.geometry.boundingBox.min.z                - direction.z);

        raycaster.set(origin, direction);

        intersects.length = 0;
        raycaster.intersectObject(mesh, false, intersects);

        for (let i = 0; i < intersects.length; ++i) {
          const o = intersects[i];

          const rgba = Utils.getRGBAFromCanvasImageDataUV(o.object.material.textureImageData, o.uv.x, o.uv.y);
          const hexcolor = (rgba[0]<<8*2)|(rgba[1]<<8*1)|(rgba[2]<<8*0);
          const m = new THREE.Mesh(new THREE.BoxGeometry(step, step, step),
                                   new THREE.MeshBasicMaterial({ color: hexcolor }));
          m.position.set((o.point.x/step|0)*step,
                         (o.point.y/step|0)*step,
                         (o.point.z/step|0)*step);
          scene.add(m);
        }
      }
    }
  }


  THREEMeshToBoxes(mesh, 24);







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
