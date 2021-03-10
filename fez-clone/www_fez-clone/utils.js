import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


class Keyboard {
  constructor(parent=document) {
    this.keys = {};
    this.onkeydown = (e) => this.keys[e.code] = true;
    this.onkeyup = (e) => this.keys[e.code] = false;
    this.parent = parent;
  }

  listen() {
    this.parent.addEventListener('keydown', this.onkeydown);
    this.parent.addEventListener('keyup', this.onkeyup);
  }

  forget() {
    this.parent.removeEventListener('keydown', this.onkeydown);
    this.parent.removeEventListener('keyup', this.onkeyup);
  }
}


class OrthoCamera {
  constructor(width, aspect, radius) {
    // "width" is the actual size of mesh wich will be fitten on screen,
    // no matter of z coordinate of mesh or camera. BTW z-buffering works anyway.
    const height = width / aspect;
    this.camera = new THREE.OrthographicCamera(-width/2, +width/2, +height/2, -height/2, 1, 1000);
    this.width  = width;
    this.height = height;
    this.aspect = aspect;
    this.radius = radius;
    this.origin = new THREE.Vector3(0, 0, 0);
    this.rotation = 0;
  }


  set_y(y) {
    this.camera.position.y = this.origin.y = y;
  }
}


class GLTFAnimation {
  constructor(mesh, animations) {
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    for (let a of animations) this.actions[a.name] = this.mixer.clipAction(a);
    this.current_action = this.actions[Object.keys(this.actions)[0]];
    this.current_action.play();
    this.tid = null;
  }


  change(name, fadeout_secs, fadein_secs) {
    if (this.actions[name] === this.current_action) return; // prevent multi-call

    if (null != this.tid) {
      clearTimeout(this.tid);
      this.tid = null;
    }

    if (!(name in this.actions)) {
      this.current_action.stop();
      return false;
    }

    const prev_action = this.current_action.fadeOut(fadeout_secs);
    this.tid = setTimeout(() => {
      prev_action.stop();
      this.tid = null;
    }, fadeout_secs * 1000);
    this.current_action = this.actions[name];
    this.current_action.fadeIn(fadein_secs);
    this.current_action.play();
    return true;
  }


  update(elapsed) {
    this.mixer.update(elapsed);
  }
}


export {
  Keyboard,
  OrthoCamera,
  GLTFAnimation,
}
