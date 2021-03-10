import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


import { OrthoCamera, GLTFAnimation } from './utils.js';


class Player {
  constructor(scene) {
    this.scene = scene;
    this.level = null;
    this.mesh = null;
    this.animation = null;
    this.orthocamera = null; // orthographic camera
    this.axocamera = null;  // axonometric (debug) camera

    // orthocamera rotation variables
    this.orthocamera_rotates_to = 0;
    this.orthocamera_is_rotating = false;

    this.tdx = 0; // tangent vector (pointing towards moving dicrection)
    this.tdz = 0;
    this.ndx = 0; // normal vector (pointing towards camera)
    this.ndz = 0;

    this.moving = false;
    this.moving_speed = 0;
    this.mesh_rotates_to = 0;

    this.apply_mesh(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({ color: 0xf542bf })));
  }


  get position() {
    return this.mesh.position;
  }


  init_orthocamera(...args) {
    this.orthocamera = new OrthoCamera(...args);
    this.orthocamera.set_y(3);
  }


  init_axocamera(...args) {
    this.axocamera = new OrthoCamera(...args);
    this.axocamera.rotation = -Math.PI / 4;
  }


  _update_orthocamera_position() {
    this.orthocamera.origin.x = this.position.x;
    this.orthocamera.origin.z = this.position.z;
    this.orthocamera.camera.position.x = this.orthocamera.origin.x + this.orthocamera.radius * Math.sin(this.orthocamera.rotation);
    this.orthocamera.camera.position.z = this.orthocamera.origin.z + this.orthocamera.radius * Math.cos(this.orthocamera.rotation);
    this.orthocamera.camera.lookAt(this.orthocamera.origin);
  }


  _update_axocamera_position() {
    this.axocamera.camera.position.x = this.position.x + this.axocamera.radius * Math.sin(this.orthocamera.rotation + this.axocamera.rotation);
    this.axocamera.camera.position.y = this.axocamera.radius / 2; // pitch is 45 degrees
    this.axocamera.camera.position.z = this.position.z + this.axocamera.radius * Math.cos(this.orthocamera.rotation + this.axocamera.rotation);
    this.axocamera.camera.lookAt(this.position);
  }


  // USES: level
  apply_level(level) {
    this.level = level;
    this._update_deltas(this.orthocamera_rotates_to);
    this.level.recalc_depth(this.ndx, this.ndz, this.position);
    this.level.apply_depth(1);
  }


  load_gltf(url) {
    return new Promise((res,rej) =>
      (new GLTFLoader()).load(
        url,
        (gltf) => { console.log(`loaded: ${url}`); this.apply_gltf(gltf); res(); },
        (xhr)  => { (`loading: ${url} ${xhr.loaded} of ${xhr.total}`); },
        (err)  => { console.log(`loaderror: ${url}`, err); rej(); },
      )
    );
  }


  apply_gltf(o) {
    this.apply_mesh(o.scene);
    this.animation = new GLTFAnimation(o.scene, o.animations);

    // o.scene.traverse(e => console.log(e.geometry))

    // console.log();

    // const box = new THREE.Box3().setFromObject(o.scene);

    // console.log(box);

    // const box = new THREE.BoxHelper(o.scene, 0xff0000);
    // this.scene.add(box);
  }


  apply_mesh(o) {
    this.scene.remove(this.mesh);
    this.mesh = o;
    this.scene.add(this.mesh);
  }


  _update_deltas(rotation) {
    this.tdx = Math.sin(rotation - Math.PI / 2);
    this.tdz = Math.cos(rotation - Math.PI / 2);
    this.ndx = Math.sin(rotation);
    this.ndz = Math.cos(rotation);
  }


  // USES: level
  move_hor(elapsed) {
    elapsed = Math.sign(elapsed) * 0.02;

    if (this.orthocamera_is_rotating) return; // not moving if rotation in progress

    const speed_acc = 20;
    const speed_max = 5;

    this.moving = true;
    this.mesh_rotates_to = (this.orthocamera_rotates_to - (Math.PI / 2) * Math.sign(elapsed)) % (Math.PI * 2);

    if (this.moving_speed < speed_max) {
      this.moving_speed += speed_acc * Math.abs(elapsed);
    }

    const dx = Math.round(this.tdx) * elapsed * this.moving_speed;
    const dz = Math.round(this.tdz) * elapsed * this.moving_speed;

    this.mesh.position.x += dx;
    this.mesh.position.z += dz;

    const radius = 0.3;
    const boundary_box = new THREE.Box3(new THREE.Vector3(this.mesh.position.x - radius,
                                                          this.mesh.position.y + 0.1,
                                                          this.mesh.position.z - radius),
                                        new THREE.Vector3(this.mesh.position.x + radius,
                                                          this.mesh.position.y + 3,
                                                          this.mesh.position.z + radius));
    const offsets = [0, 0, 0];
    this.level.detect_collision(boundary_box, Math.sign(dx), Math.sign(0), Math.sign(dz), offsets);
    this.mesh.position.x += offsets[0];
    this.mesh.position.y += offsets[1];
    this.mesh.position.z += offsets[2];

    if ('move_rt_camera' in this.level) {

      this.level.move_rt_camera(dx + offsets[0], dz + offsets[2]);

    }
  }


  // USES: level
  start_rotation(direction) {
    if (this.orthocamera_is_rotating) return;
    this.orthocamera_rotates_to = this.orthocamera.rotation + (Math.PI / 2) * direction;
    this.orthocamera_is_rotating = true;
    this._update_deltas(this.orthocamera_rotates_to);
    if (this.level) this.level.recalc_depth(this.ndx, this.ndz, this.position);
  }


  // USES: level
  _update_orthocamera_rotation(elapsed) {
    if (!this.orthocamera_is_rotating) return;
    if (Math.abs(this.orthocamera_rotates_to - this.orthocamera.rotation) > 0.1) {
      const speed = 2;
      const rot_dir = Math.sign(this.orthocamera_rotates_to - this.orthocamera.rotation);
      this.orthocamera.rotation += rot_dir * elapsed * speed;
      const ndr = Math.abs(this.orthocamera_rotates_to - this.orthocamera.rotation) / (Math.PI / 2); // normalized delta rotation
      if (this.level) this.level.apply_depth(1 - ndr);
    } else {
      this.orthocamera.rotation = this.orthocamera_rotates_to % (Math.PI * 2);
      this.orthocamera_is_rotating = false;
      if (this.level) this.level.apply_depth(1);
    }
  }


  _update_mesh_rotation(elapsed) {
    if (Math.abs(this.mesh_rotates_to - this.mesh.rotation.y) > 0.1) {
      const speed = 5;
      const rot_dir = Math.sign(this.mesh_rotates_to - this.mesh.rotation.y);
      this.mesh.rotation.y += rot_dir * elapsed * speed;
      this.mesh_rotates_to = this.mesh.rotation.y;
    }
  }


  update(elapsed) {

    if (this.animation) { // animation is loaded

      if (this.moving) { // move_hor called

        this.moving = false;
        this.animation.change('run', 0.1, 0.1);
        this._update_mesh_rotation(elapsed);

      } else { // player stays still

        this.moving_speed = 0;
        this.animation.change('idle', 0.5, 1);

      }

      this.animation.update(elapsed);

    }

    this._update_orthocamera_rotation(elapsed);
    this._update_orthocamera_position();

    if (this.axocamera) this._update_axocamera_position();

  }
}


export {
  Player
}
