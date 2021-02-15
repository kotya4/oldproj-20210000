/* gen by new.py at 2021-02-15 10:56:42.892316 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const width = 400;
  const height = 400;
  const aspect = width / height;
  const fov = 45;

  // threejs

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  // 2d context

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.imageSmoothingEnabled = false;

  // layout

  document.body.appendChild(renderer.domElement);
  document.body.appendChild(ctx.canvas);

  // render cicle

  let old_timestamp = null;
  (function render(timestamp) {
    window.requestAnimationFrame( render );
    const elapsed = timestamp - old_timestamp || 0;
    old_timestamp = timestamp;

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render( scene, camera );

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`SPF ${elapsed}`, 0, 12);
    ctx.restore();
  })();
}
