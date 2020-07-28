import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/DRACOLoader.js';

export class AnimatedMesh {
  constructor(scene) {
    this.status_str = 'constructor called';
    this.scene = scene;
    this.gltf = null;
    this.mixer = null;
    this.skeleton_helper = null;
    this.actions = null;
    this.current_action = null;
    this.translate_pos = null;
  }

  add_to_scene(scene) {
    this.scene = scene;
    scene.add(this.gltf.scene);
    // scene.add(this.skeleton_helper);
  }

  change_action(name, fadeout_secs, fadein_secs) {
    if (!(name in this.actions)) {
      this.current_action.stop();
      return false;
    }
    const ca = this.current_action.fadeOut(fadeout_secs);
    setTimeout(() => ca.stop(), fadeout_secs * 1000);
    this.current_action = this.actions[name];
    this.current_action.fadeIn(fadein_secs);
    this.current_action.play();
    return true;
  }

  load_from_url(url) {
    return new Promise((res,rej) =>
      (new GLTFLoader()).setDRACOLoader((new DRACOLoader()).setDecoderPath('/www_rumba/draco1.3.6/')).load(
        url,
        (gltf) => { this.status_str = `loaded: ${url}`; this._onload(gltf); res(this); },
        (xhr)  => { this.status_str = `loading: ${url} [ ${(xhr.loaded / xhr.total * 100 | 0)}% ]`; },
        (err)  => { this.status_str = `load error: ${url}`; console.log(`load error: ${url}`, err); rej(this); },
      )
    );
  }

  translate(pos, secs) {
    this.translate_pos = pos;
    setTimeout(() => { this.translate_pos = null; }, secs * 1000);
  }

  _onload(gltf) {
    this.gltf = gltf;
    this.mixer = new THREE.AnimationMixer(this.gltf.scene);
    // animations
    this.actions = {};
    for (let a of this.gltf.animations) {
      this.actions[a.name] = this.mixer.clipAction(a);
    }
    this.current_action = this.actions['idle'] || this.actions[Object.keys(this.actions)[0]];
    // skeleton helper
    this.skeleton_helper = new THREE.SkeletonHelper(this.gltf.scene);
    // adds object3d to scene if provided
    if (this.scene) {
      this.add_to_scene(this.scene);
    }
  }

  _translate(delta) {
    if (this.translate_pos) {
      this.gltf.scene.translateX(this.translate_pos[0] * delta);
      this.gltf.scene.translateY(this.translate_pos[1] * delta);
      this.gltf.scene.translateZ(this.translate_pos[2] * delta);
    }
  }

  update(delta) {
    this.mixer.update(delta);
    this._translate(delta);
  }
}
