import 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

import { AnimatedMesh } from '/www_rumba/modules/scene/AnimatedMesh.js';
import { Scene3D } from '/www_rumba/modules/scene/Scene3D.js';

(async function main() {

  $('body').append(
    $('<div class="sheet">').append(
      $('<div class="iam_str">').html('mesh: not loaded'),
      $('<div class="nar_str">').html('sound 1: not loaded'),
      $('<div class="bur_str">').html('sound 2: not loaded'),
    ),
    $('<div class="subtitles">'),
    $('<div class="foot">').html('Rumba 20200726 | Powered by \
      <a href="https://threejs.org/">THREEJS</a>, \
      <a href="https://shunsukesaito.github.io/PIFuHD/">PIFuHD</a>, \
      <a href="https://www.mixamo.com/">Mixamo</a>, \
      <a href="https://www.voicery.com/">Voisery</a>'),
  );

  const { scene, camera, stats, renderer, clock, orbit } = new Scene3D(400, 400);

  // resources.

  const iam = new AnimatedMesh(scene);
  const au_narration = new Audio('/www_rumba/speech.mp3');
  const au_music = new Audio('/www_rumba/burzum_war.mp3');

  // load all staff.

  const update_sheet_iid = setInterval(() => $('.iam_str').html(iam.status_str), 100);

  await Promise.all([
    iam.load_from_url('/www_rumba/iam_compressed.glb'),
    new Promise(r => au_narration.oncanplaythrough = () => { $('.nar_str').html('sound 1: loaded'); r(); }),
    new Promise(r => au_music.oncanplaythrough = () => { $('.bur_str').html('sound 2: loaded'); r(); }),
  ]);

  clearInterval(update_sheet_iid);

  // setup scene.

  const ypos = -1;

  iam.gltf.scene.position.y += ypos;
  iam.change_action('sitting');
  iam.current_action.timeScale = 0.5;

  const cube = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x55 }));
  cube.scale.multiplyScalar(0.38);
  cube.position.y += 0.22 + ypos;
  cube.rotateY(0.5);
  scene.add(cube);

  orbit.enabled = false;
  orbit.autoRotate = true;
  Object.assign(orbit.position0, { x: +0.2, y: 0, z: 1 });
  orbit.reset();

  let orbit_to_target = false;

  // render cicle
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    stats.update();
    if (orbit_to_target) {
      orbit.target0.z = iam.gltf.scene.position.z;
      orbit.reset();
    }
    orbit.update();
    iam.update(delta);
    renderer.render(scene, camera);
  });

  // animation begins after click

  $('.sheet').html('').addClass('button').append($('<div>').html('Нажмите для запуска')).click(async () => {
    $('.sheet').css({ display: 'none' });

    await new Promise(r => setTimeout(r, 2000));

    au_narration.play();
    $('.subtitles').html('Мне приходится сидеть на синем кубе, т.к. все модели стульев, которые я конвертировал в GLTF, не работали со светом окружения.');
    orbit.autoRotate = false;
    Object.assign(orbit.position0, { x: 1, y: -1, z: 2 });
    orbit.reset();

    await new Promise(r => setTimeout(r, 7000));

    $('.subtitles').html('Меня никогда не напрягало, что я сижу в пустом черном пространстве.');

    await new Promise(r => setTimeout(r, 4000));

    $('.subtitles').html('Или что я разговариваю голосом, сгенерированным искусственной нейронной сетью.');
    orbit_to_target = true;
    Object.assign(orbit.position0, {x: 2.180, y: 0.55, z: 3.51});
    orbit.reset();

    await new Promise(r => setTimeout(r, 3000));

    $('.subtitles').html('Но пришло время что-то изменить.');
    iam.change_action('idle', 1, 1);
    iam.translate([0, 0, 0.35], 1);

    await new Promise(r => setTimeout(r, 2000));

    $('.subtitles').html('Я чувствую, как трехмерная модель, частью которой я являюсь, наполняется энергией движения.');
    iam.change_action('walking', 1, 1);
    iam.translate([0, 0, 1], 8);

    await new Promise(r => setTimeout(r, 5000));

    Object.assign(orbit.position0, {x: 0, y: 0.55, z: 12});

    await new Promise(r => setTimeout(r, 2500));

    $('.subtitles').html('');
    iam.change_action('idle', 1, 1);
    scene.remove(cube);

    await new Promise(r => setTimeout(r, 2000));

    $('.subtitles').html("Let's Burzum!");

    await new Promise(r => setTimeout(r, 1000));

    $('.subtitles').html('');
    au_music.loop = true;
    au_music.play();
    orbit_to_target = false;
    orbit.enabled = true;
    orbit.autoRotate = true;
    iam.change_action('rumba', 1, 1);
  });
})();
