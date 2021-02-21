import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


function test() {
  console.log('test');
}


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


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


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


class Player {
  constructor(scene) {
    this.scene = scene;
    this.level = null;
    this.mesh = null;
    this.animation = null;

    this.rotation = 0;
    this.rotates_from = 0;
    this.rotates_to = 0;
    this.is_rotating = false;

    this.tdx = 0; // tangent vector (pointing towards moving dicrection)
    this.tdz = 0;
    this.ndx = 0; // normal vector (pointing towards camera)
    this.ndz = 0;

    this.moving = false;
    this.moving_speed = 0;
    this.mesh_rotates_to = 0;

    this.radius = 0.3;

    this.apply_mesh(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({ color: 0xf542bf })));
  }


  get position() {
    return this.mesh.position;
  }


  settle_in(level) {
    this.level = level;
    this._update_deltas(this.rotates_to);
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


  apply_mesh(o) {
    this.scene.remove(this.mesh);
    this.mesh = o;
    this.scene.add(this.mesh);
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


  _update_deltas(rotation) {
    this.tdx = Math.sin(rotation - Math.PI / 2);
    this.tdz = Math.cos(rotation - Math.PI / 2);
    this.ndx = Math.sin(rotation);
    this.ndz = Math.cos(rotation);
  }


  move_hor(elapsed) {
    elapsed = Math.sign(elapsed) * 0.02;

    if (this.is_rotating) return; // not moving if rotation in progress

    const speed_acc = 20;
    const speed_max = 5;

    this.moving = true;
    this.mesh_rotates_to = this.rotates_to - (Math.PI / 2) * Math.sign(elapsed);
    this.mesh_rotates_to %= Math.PI * 2;

    if (this.moving_speed < speed_max) {
      this.moving_speed += speed_acc * Math.abs(elapsed);
    } else {
      this.moving_speed = speed_max;
    }

    const dx = Math.round(this.tdx) * elapsed * this.moving_speed;
    const dz = Math.round(this.tdz) * elapsed * this.moving_speed;

    this.mesh.position.x += dx;
    this.mesh.position.z += dz;

    const radius = this.radius;
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
  }


  start_rotation(direction) {
    if (this.is_rotating) return;

    this.rotates_to = this.rotation + (Math.PI / 2) * direction;
    this.rotates_from = this.rotation;
    this.is_rotating = true;

    this._update_deltas(this.rotates_to);
    if (this.level) this.level.recalc_depth(this.ndx, this.ndz, this.position);
  }


  _update_rotation(elapsed) {
    const speed = 2;
    const rot_dir = Math.sign(this.rotates_to - this.rotates_from);
    this.rotation += rot_dir * elapsed * speed;

    if (this.level) this.level.apply_depth(1 - Math.abs(this.rotates_to - this.rotation) / (Math.PI / 2));

    if (rot_dir < 0 && this.rotation <= this.rotates_to
    ||  rot_dir > 0 && this.rotation >= this.rotates_to
    ||  rot_dir === 0)
    {
      this.rotation = this.rotates_to;
      this.is_rotating = false;
      if (this.level) this.level.apply_depth(1);
    }
  }


  _update_mesh_rotation(elapsed) {
    const speed = 5;
    const rot_dir = Math.sign(this.mesh_rotates_to - this.mesh.rotation.y);
    if (Math.abs(this.mesh_rotates_to - this.mesh.rotation.y) > 0.1) {
      this.mesh.rotation.y += rot_dir * elapsed * speed;
      this.mesh_rotates_to = this.mesh.rotation.y;
    }
  }


  update(elapsed) {
    if (this.animation) {

      // const anim_speed = 0.5;

      if (this.moving) {

        this.moving = false;

        this.animation.change('run', 0.1, 0.1);

        this._update_mesh_rotation(elapsed);

      } else {

        this.moving_speed = 0;
        this.animation.change('idle', 0.5, 1);

      }

      this.animation.update(elapsed);

    }

    if (this.is_rotating) {

      this._update_rotation(elapsed);

    }
  }
}


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


class Level {
  constructor(scene) {
    this.scene = scene;
    this.collision_boxes = [];

    // defined in "apply_gltf"
    this.group = null;
    this.curr_depth_flags = null;
    this.prev_depth_flags = null;
    this.initial_material_colors = null;
    this.bounding_boxes = null;

    this.enums = {
      VISIBLE:           0b00000001,
      INSTANT_HIDDEN:    0b00000010,

      TRANSPARENCY_MASK: 0b00001100,
      TRANSPARENT_X:     0b00000100,
      TRANSPARENT_Z:     0b00001000,

      FOREGROUND:        0b00010000,

      WALL_MASK:         0b11100000,
      WALL_XM:           0b10000000,
      WALL_XP:           0b10100000,
      WALL_ZM:           0b11000000,
      WALL_ZP:           0b11100000,

    };


  }


  dim_material_color(o, degree) {
    // TIP: cannot handle if "o" is a group of groups
    (o instanceof THREE.Group ? o.children : [o]).forEach(o => {

      let { h, s, l } = this.initial_material_colors[o.name].getHSL({});

      // const h_min = Math.min(0.2, h); // minimized to not lighten
      // h = h_min + (h - h_min) * degree;

      const s_min = Math.min(0.2, s); // minimized to not lighten
      s = s_min + (s - s_min) * degree;

      const l_min = Math.min(0.2, l); // minimized to not lighten
      l = l_min + (l - l_min) * degree;

      o.material.color.setHSL(h, s, l);

    });
  }


  set_object_visibility(o, degree) {
    o.scale.set(degree, degree, degree);
    o.visible = degree > 0;
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
    this.group = o.scene;

    // rebuild gltf (join some objects in groups)

    const shelf = this.group.children.filter(e => e.name.indexOf('shelf') === 0 && e.name.indexOf('shelftable') < 0);
    const shelf_group = new THREE.Group();
    shelf_group.add(...shelf);
    shelf_group.name = 'shelf';
    this.group.remove(...shelf);
    this.group.add(shelf_group);

    // apply gltf

    this.scene.add(this.group);

    console.log(this.group);

    // some defines

    this.curr_depth_flags = this.group.children.map(() => 0);
    this.prev_depth_flags = this.group.children.map(() => 0);

    this.initial_material_colors = {};
    this.group.traverse((e) => {
      if ('material' in e) {
        // all main group children materials must be separate to apply colors
        e.material = e.material.clone();
        // create dump of initial material color
        this.initial_material_colors[e.name] = e.material.color.clone();
      }
    });

    this.bounding_boxes = this.group.children.map((e) => new THREE.Box3().setFromObject(e));

    // metainformation

    for (let i = 0; i < this.group.children.length; ++i) {

      // outter wall check

      if (0 <= this.group.children[i].name.indexOf('exterwall')) {

        if      (0 <= this.group.children[i].name.indexOf('Xm')) {
          this.curr_depth_flags[i] |= this.enums.WALL_XM;
        }

        else if (0 <= this.group.children[i].name.indexOf('Xp')) {
          this.curr_depth_flags[i] |= this.enums.WALL_XP;
        }

        else if (0 <= this.group.children[i].name.indexOf('Ym')) {
          this.curr_depth_flags[i] |= this.enums.WALL_ZM;
        }

        else if (0 <= this.group.children[i].name.indexOf('Yp')) {
          this.curr_depth_flags[i] |= this.enums.WALL_ZP;
        }

      }

      // transparents check

      if (0 <= this.group.children[i].name.indexOf('shelf')) {

        this.curr_depth_flags[i] |= this.enums.TRANSPARENT_X;

      }

      if (0 <= this.group.children[i].name.indexOf('chair')) {

        this.curr_depth_flags[i] |= this.enums.TRANSPARENT_X;

      }

    }
  }


  recalc_depth(ndx, ndz, position) {

    this.collision_boxes.length = 0;

    for (let i = 0; i < this.group.children.length; ++i) {
      this.prev_depth_flags[i] = this.curr_depth_flags[i]; // dump depth flags
      // flush depth flags but save walls and transparency
      this.curr_depth_flags[i] &= this.enums.WALL_MASK | this.enums.TRANSPARENCY_MASK;
      const f = this.prev_depth_flags[i]; // previous depth flag shortcut
      const o = this.group.children[i];    // object shortcut


      // object is outter wall
      if (f & this.enums.WALL_MASK) {

        if (Math.round(ndx) < 0 && this.enums.WALL_XM === (f & this.enums.WALL_MASK)
        ||  Math.round(ndx) > 0 && this.enums.WALL_XP === (f & this.enums.WALL_MASK)
        ||  Math.round(ndz) > 0 && this.enums.WALL_ZM === (f & this.enums.WALL_MASK)
        ||  Math.round(ndz) < 0 && this.enums.WALL_ZP === (f & this.enums.WALL_MASK))
        {

          // overwrites all flags.
          this.curr_depth_flags[i] |= this.enums.INSTANT_HIDDEN;

        } else {

          this.curr_depth_flags[i] |= this.enums.VISIBLE;

        }

      }

      // TODO: transparency must depend on visibility of other objects.
      //       f.e. if cumod is visible then cathouse is x-transparent
      //       or if player x-position is greater than 5 then cathouse is
      //       x-transparent and so on.

      let is_transparent = false;

      if (f & this.enums.TRANSPARENCY_MASK) {

        if (Math.round(ndx) !== 0 && f & this.enums.TRANSPARENT_X) {
          is_transparent = true;
        }

        if (Math.round(ndz) !== 0 && f & this.enums.TRANSPARENT_Z) {
          is_transparent = true;
        }

      }

      // ------

      const box = this.bounding_boxes[i];


      // TODO: to remove bug with collision that telepots player all other
      //       the mesh boundary need to apply "player.radius" to the
      //       position calculations.


      // not intersecting near plane
      const is_visible = Math.round(ndx) > 0 && box.min.x <= position.x
                      || Math.round(ndx) < 0 && box.max.x >= position.x
                      || Math.round(ndz) > 0 && box.min.z <= position.z
                      || Math.round(ndz) < 0 && box.max.z >= position.z;

      // can be collided with player
      const is_foreground = Math.round(ndx) !== 0 && box.min.x <= position.x && position.x <= box.max.x
                         || Math.round(ndz) !== 0 && box.min.z <= position.z && position.z <= box.max.z;

      // ----

      if (is_visible || is_transparent) {

        this.curr_depth_flags[i] |= this.enums.VISIBLE;

      }

      if (is_foreground) {

        this.collision_boxes.push(box);
        this.curr_depth_flags[i] |= this.enums.FOREGROUND;

      }

    }

  }


  apply_depth(degree) {

    for (let i = 0; i < this.group.children.length; ++i) {
      const o = this.group.children[i];

      const pf = this.prev_depth_flags[i];
      const was_visible        = pf & this.enums.VISIBLE;
      const was_instant_hidden = pf & this.enums.INSTANT_HIDDEN;
      const was_foreground     = pf & this.enums.FOREGROUND;

      const cf = this.curr_depth_flags[i];
      const is_visible         = cf & this.enums.VISIBLE;
      const is_instant_hidden  = cf & this.enums.INSTANT_HIDDEN;
      const is_foreground      = cf & this.enums.FOREGROUND;

      // become foreground
      if (!was_foreground && is_foreground) {
        this.dim_material_color(o, degree);
      }

      // become background
      if (was_foreground && !is_foreground) {
        this.dim_material_color(o, 1 - degree);
      }

      // always been foreground
      if (was_foreground && is_foreground) {
        this.dim_material_color(o, 1);
      }

      // always been background
      if (!was_foreground && !is_foreground) {
        this.dim_material_color(o, 0);
      }

      // was instant hidden
      if (was_instant_hidden) {
        // need to be shown only then rotation is done, i.e. when degree === 1
        this.set_object_visibility(o, ~~degree);
        continue;
      }

      // is instant hidden
      if (is_instant_hidden) {
        this.set_object_visibility(o, 0);
        continue;
      }

      // become hidden
      if (was_visible && !is_visible) {
        this.set_object_visibility(o, 1 - degree);
        continue;
      }

      // become visible
      if (!was_visible && is_visible) {
        this.set_object_visibility(o, degree);
        // o.visible = true;
        continue;
      }

      // always been hidden
      if (!was_visible && !is_visible) {
        this.set_object_visibility(o, 0);
        continue;
      }

      // always been visible
      if (was_visible && is_visible) {
        this.set_object_visibility(o, 1);
        continue;
      }
    }

  }


  detect_collision(box, dx, dy, dz, dp=[0,0,0]) {
    // delta position is array with offsets there must be added
    // to already changed position to remove boundaries overlap.

    // TODO: do not use "box.intersectsBox(b);" because
    //       level can contain non-depth objects, so you
    //       need to check only non-0-speed dementions.

    // DEBUG:
    if (null == this.helpers) this.helpers = [];
    this.scene.remove(...this.helpers);
    this.helpers.length = 0;

    for (let b of this.collision_boxes) {

      if (box.intersectsBox(b)) {

        // DEBUG:
        const helper = new THREE.Box3Helper(b, 0xffff00);
        this.scene.add(helper);
        this.helpers.push(helper);

        if      (dx > 0) dp[0] = b.min.x - box.max.x;
        else if (dx < 0) dp[0] = b.max.x - box.min.x;

        if      (dy > 0) dp[1] = b.min.y - box.max.y;
        else if (dy < 0) dp[1] = b.max.y - box.min.y;

        if      (dz > 0) dp[2] = b.min.z - box.max.z;
        else if (dz < 0) dp[2] = b.max.z - box.min.z;

      }

    }

    return dp;
  }


}


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


export {

  test,
  Player,
  Level,

};
