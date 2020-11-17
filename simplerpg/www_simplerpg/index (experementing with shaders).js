import { FBXLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.20/lodash.min.js';
import 'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js';
import { EffectComposer } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/postprocessing/ShaderPass.js';

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

  const keys = {};
  window.addEventListener('keydown', (e) => keys[e.code] = true);
  window.addEventListener('keyup', (e) => keys[e.code] = false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  const controls = new OrbitControls(camera, display.domElement);
  const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  directionalLight.position.set(-0.25, 1, 0.5);
  scene.add(directionalLight);
  const light = new THREE.AmbientLight( 0xf0f0f0 );
  scene.add(light);

  const material = new THREE.MeshLambertMaterial( { color: 0x005555 } );
  const geometry = new THREE.SphereGeometry(2, 10, 10);
  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  Utils.localStorage.connectTHREEControls(controls, 'simpleprg_orbit', 1000);

  // const grid3 = new Utils.Grid3(40, 40, 40);
  // grid3.fillEllipsoid(20, 20, 20, 8, 9, 8, 1, 1);
  // grid3.fillEllipsoid(20, 16, 21, 6, 5, 7.5, 1, 1);
  // grid3.fillEllipsoid(17, 21, 26, 2, 2.5, 2, 1, 0);
  // grid3.fillEllipsoid(23, 21, 26, 2, 2.5, 2, 1, 0);
  // const g = grid3.createTHREEGeometry();
  // mesh.geometry = g;

  mesh.rotation.y = -Math.PI / 2;

  (new THREE.TextureLoader()).load('www_simplerpg/test.png', (texture) => {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    mesh.material = material;
  });




  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const colorShader = {
    uniforms: {
      tDiffuse: { value: null },
      color:    { value: new THREE.Color(0x88CCFF) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      varying vec2 vUv;
      void main() {
        vec4 previousPassColor = texture2D(tDiffuse, vUv);
        gl_FragColor = vec4(
            previousPassColor.rgb * color,
            previousPassColor.a);
      }
    `,
  };

  // const colorPass = new ShaderPass(colorShader);
  // colorPass.renderToScreen = true;
  // composer.addPass(colorPass);


  var PixelShader = {

    uniforms: {

        "tDiffuse": { value: null },
        "resolution": { value: null },
        "pixelSize": { value: 1. },

    },

    vertexShader: [

        "varying highp vec2 vUv;",

        "void main() {",

        "vUv = uv;",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

        "}"

    ].join( "\n" ),

    fragmentShader: [

        "uniform sampler2D tDiffuse;",
        "uniform float pixelSize;",
        "uniform vec2 resolution;",

        "varying highp vec2 vUv;",

        "void main(){",

        "vec2 dxy = pixelSize / resolution;",
        "vec2 coord = dxy * floor( vUv / dxy );",
        "gl_FragColor = texture2D(tDiffuse, coord);",

        "}"

      ].join( "\n" )
    };

    const pixelPass = new ShaderPass( PixelShader );
    pixelPass.uniforms.resolution.value = new THREE.Vector2( width, height );
    // pixelPass.uniforms.resolution.value.multiplyScalar( window.devicePixelRatio );
    pixelPass.uniforms.pixelSize.value = 4;
    pixelPass.renderToScreen = true;
    composer.addPass( pixelPass );



  ///////////////////////////////////////////////
  ///////////////////////////////////////////////
  const clock = new Utils.Clock();
  (function animate() {
    window.requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // renderer.render(scene, camera);
    composer.render(delta);

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    // fps
    ctx.fillStyle = 'red';
    ctx.font = '16px monospace';
    ctx.fillText(`${delta}`, 20, 20);
    ctx.restore();
  })();
}
