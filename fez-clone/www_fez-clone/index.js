/* gen by new.py at 2021-02-15 10:56:42.892316 */
window.onload = async function onload() {
  if ('seedrandom' in Math) Math.seedrandom('0');
  const width = 600;
  const height = 300;
  const aspect = 1; //width / height;
  const fov = 45;

  // threejs


  const camera_width = 5;
  const camera_height = camera_width / aspect;
  const camera = new THREE.OrthographicCamera(-camera_width/2, +camera_width/2, +camera_height/2, -camera_height/2, 1, 1000);
  camera.position.z = 5;

  const camera_radius = 10;
  const camera_origin = new THREE.Vector3(0, 0, 0);

  const second_camera_radius = 10;
  const second_camera_extra_angle =  -Math.PI / 4;

  const second_camera_width = 10;
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


  // const geometry = new THREE.BoxGeometry();
  // const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  const map = new Map();
  scene.add(map.group);

  const player = new Player(map);
  scene.add(player.cube);

  map.mark_visible(player);
  map.apply_visibility(1.0, true);

  const kb = new Keyboard();
  kb.listen();

  const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient_light);

  /*
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight1.position.set(1, 1, 1);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight2.position.set(-1, -1, -1);
  scene.add(directionalLight2);
  */

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
    const elapsed = timestamp - old_timestamp || 0;
    old_timestamp = timestamp;

    if (kb.keys['KeyA']) player.move(+1);
    if (kb.keys['KeyD']) player.move(-1);
    if (kb.keys['KeyQ']) player.start_rotation(+1);
    if (kb.keys['KeyE']) player.start_rotation(-1);
    if (kb.keys['KeyW']) { camera.position.y += -0.01; camera_origin.y  += -0.01; }
    if (kb.keys['KeyS']) { camera.position.y += +0.01; camera_origin.y  += +0.01; }

    player.proc();
    map.proc(player);

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














    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.font = '12px monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(`SPF ${elapsed}`, 0, 12);
    ctx.fillText(`    ${tostr(player.position)}`, 0, 24);
    ctx.restore();
  })();
}
