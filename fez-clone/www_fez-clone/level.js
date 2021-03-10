import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


class Level {
  constructor(scene) {
    this.scene = scene;
    this.collision_boxes = [];

    this.group = null;
    this.curr_depth_flags = null;
    this.prev_depth_flags = null;
    this.initial_material_colors = null;
    this.bounding_boxes = null;
    this.props_flags = null;

    // TODO: нужны новые флаги для props:
    //       1) grow if become visible (то же, что и !was_visible && is_visible, если false тогда см. 3)
    //       2) ungrow if become invisible (то же, что и was_visible && !is_visible)
    //       3) become visible after rotation ends (то же, что и was_instant_hidden, если true тогда 1 игнорируется)
    //       4) become invisible after rotation starts (то же, что и is_instant_hidden, если true тогда 2 игнорируется)
    //       5) solid
    //       6) transparent (если true тогда 1, 2, 3, 4 игнорируются)
    //       7) always forground ??? ( on x/z ??? in raduis ??? if visible another object ??? )


    // TODO: replace masked flags to other flag container maybe?
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
    this.apply_group(o.scene);
  }


  apply_group(o) {
    this.group = o;

    // finds subgroup by parsing object names
    const subgroups = {};
    for (let e of o.children) {
      // this sequence of characters defines subgroup
      const seq = e.name.indexOf('__');
      if (seq > 0) { // there is subgroup
        const subgroup_name = e.name.slice(0, seq);
        if (!(subgroup_name in subgroups)) { // create new subgroup
          // subgroups is an object, not a group, because adding to the group
          // automaticly removes object from parent group and current cicle fails.
          subgroups[subgroup_name] = [];
        }
        subgroups[subgroup_name].push(e);
      }
    }

    // add to the subgroups objects (autoremoves added objects from the group)
    // and add to the group all subgroups
    for (let key in subgroups) {
      const g = new THREE.Group();
      g.name = key;
      g.add(...subgroups[key]);
      // sorts built-in subgroups
      if ('BGPLANE' === key) {
        // background plane
        // this.bgplanes = g;
      } else {
        // default group of objects
        o.add(g);
      }
    }

    // apply group
    this.scene.add(o);
    console.log('group', o);

    // fill depth flags
    this.curr_depth_flags = o.children.map(() => 0);
    this.prev_depth_flags = o.children.map(() => 0);

    // fill props flags
    this.props_flags = o.children.map(() => 0);

    // find marked objects in rebuilded group
    for (let i = 0; i < o.children.length; ++i) {
      // walls
      // y on blender actually is Z in opengl
      if (o.children[i].name.indexOf('_Xp') > 0) this.props_flags[i] |= this.enums.WALL_XP;
      if (o.children[i].name.indexOf('_Xm') > 0) this.props_flags[i] |= this.enums.WALL_XM;
      if (o.children[i].name.indexOf('_Yp') > 0) this.props_flags[i] |= this.enums.WALL_ZP;
      if (o.children[i].name.indexOf('_Ym') > 0) this.props_flags[i] |= this.enums.WALL_ZM;
    }

    // TODO: need to be redone with vertex colors instead
    // get initial material colors
    this.initial_material_colors = {};
    o.traverse((e) => {
      if ('material' in e) {
        e.material = e.material.clone(); // all main group children materials must be separate to apply colors
        this.initial_material_colors[e.name] = e.material.color.clone(); // create dump of initial material color
      }
    });

    // calculate bounding boxes
    this.bounding_boxes = o.children.map((e) => new THREE.Box3().setFromObject(e));
  }


  recalc_depth(ndx, ndz, position) {

    this.collision_boxes.length = 0;

    for (let i = 0; i < this.group.children.length; ++i) {
      this.prev_depth_flags[i] = this.curr_depth_flags[i]; // dump depth flags
      // flush depth flags but save walls and transparency
      this.curr_depth_flags[i] = 0; //&= this.enums.WALL_MASK | this.enums.TRANSPARENCY_MASK;
      const o = this.group.children[i];    // object shortcut
      const props = this.props_flags[i]; // properties


      // object is outter wall
      if (props & this.enums.WALL_MASK) {

        if (Math.round(ndx) < 0 && this.enums.WALL_XM === (props & this.enums.WALL_MASK)
        ||  Math.round(ndx) > 0 && this.enums.WALL_XP === (props & this.enums.WALL_MASK)
        ||  Math.round(ndz) > 0 && this.enums.WALL_ZM === (props & this.enums.WALL_MASK)
        ||  Math.round(ndz) < 0 && this.enums.WALL_ZP === (props & this.enums.WALL_MASK))
        {

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

      if (props & this.enums.TRANSPARENCY_MASK) {

        if (Math.round(ndx) !== 0 && props & this.enums.TRANSPARENT_X) {
          is_transparent = true;
        }

        if (Math.round(ndz) !== 0 && props & this.enums.TRANSPARENT_Z) {
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

        // this.collision_boxes.push(box); // DEBUG:
        this.curr_depth_flags[i] |= this.enums.FOREGROUND;

      }

    }

  }


  _dim_material_color(o, degree) {
    return; // DEBUG:

    // TIP: cannot handle if "o" is a group of groups
    (o instanceof THREE.Group ? o.children : [o]).forEach(o => {

      const initial_material = this.initial_material_colors[o.name];
      if (null == initial_material) return;

      let { h, s, l } = initial_material.getHSL({});

      // const h_min = Math.min(0.2, h); // minimized to not lighten
      // h = h_min + (h - h_min) * degree;

      const s_min = Math.min(0.2, s); // minimized to not lighten
      s = s_min + (s - s_min) * degree;

      const l_min = Math.min(0.2, l); // minimized to not lighten
      l = l_min + (l - l_min) * degree;

      o.material.color.setHSL(h, s, l);

    });
  }


  _set_object_visibility(o, degree) {
    o.scale.set(degree, degree, degree);
    o.visible = degree > 0;
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
        this._dim_material_color(o, degree);
      }

      // become background
      if (was_foreground && !is_foreground) {
        this._dim_material_color(o, 1 - degree);
      }

      // always been foreground
      if (was_foreground && is_foreground) {
        this._dim_material_color(o, 1);
      }

      // always been background
      if (!was_foreground && !is_foreground) {
        this._dim_material_color(o, 0);
      }

      // was instant hidden
      if (was_instant_hidden) {
        // need to be shown only then rotation is done, i.e. when degree === 1
        this._set_object_visibility(o, ~~degree);
        continue;
      }

      // is instant hidden
      if (is_instant_hidden) {
        this._set_object_visibility(o, 0);
        continue;
      }

      // become hidden
      if (was_visible && !is_visible) {
        this._set_object_visibility(o, 1 - degree);
        continue;
      }

      // become visible
      if (!was_visible && is_visible) {
        this._set_object_visibility(o, degree);
        // o.visible = true;
        continue;
      }

      // always been hidden
      if (!was_visible && !is_visible) {
        this._set_object_visibility(o, 0);
        continue;
      }

      // always been visible
      if (was_visible && is_visible) {
        this._set_object_visibility(o, 1);
        continue;
      }
    }

  }


  detect_collision(player_box, dx, dy, dz, offsets=[0,0,0]) {
    // delta position is array with offsets there must be added
    // to already changed position to remove boundaries overlap.

    // TODO: do not use "box.intersectsBox(b);" because
    //       level can contain non-depth objects, so you
    //       need to check only non-0-speed dementions.

    // DEBUG:
    if (null == this.helpers) this.helpers = [];
    this.scene.remove(...this.helpers);
    this.helpers.length = 0;

    let collided = false;

    for (let mesh_box of this.collision_boxes) {

      if (!player_box.intersectsBox(mesh_box)) continue;

      collided = true;


      // DEBUG:
      const helper = new THREE.Box3Helper(mesh_box, 0xffff00);
      this.scene.add(helper);
      this.helpers.push(helper);

      const xin = player_box.min.x < mesh_box.min.x && mesh_box.max.x < player_box.max.x;
      const yin = player_box.min.y < mesh_box.min.y && mesh_box.max.y < player_box.max.y;
      const zin = player_box.min.z < mesh_box.min.z && mesh_box.max.z < player_box.max.z;

      if      (dx > 0 && (xin || mesh_box.min.x < player_box.max.x && player_box.max.x < mesh_box.max.x)) {
        offsets[0] = mesh_box.min.x - player_box.max.x;
      }

      else if (dx < 0 && (xin || mesh_box.min.x < player_box.min.x && player_box.min.x < mesh_box.max.x)) {
        offsets[0] = mesh_box.max.x - player_box.min.x;
      }

      if      (dy > 0 && (yin || mesh_box.min.y < player_box.max.y && player_box.max.y < mesh_box.max.y)) {
        offsets[1] += mesh_box.min.y - player_box.max.y;
      }

      else if (dy < 0 && (yin || mesh_box.min.y < player_box.min.y && player_box.min.y < mesh_box.max.y)) {
        offsets[1] += mesh_box.max.y - player_box.min.y;
      }

      if      (dz > 0 && (zin || mesh_box.min.z < player_box.max.z && player_box.max.z < mesh_box.max.z)) {
        offsets[2] += mesh_box.min.z - player_box.max.z;
      }

      else if (dz < 0 && (zin || mesh_box.min.z < player_box.min.z && player_box.min.z < mesh_box.max.z)) {
        offsets[2] += mesh_box.max.z - player_box.min.z;
      }



    }

    return collided;
  }

}


export {
  Level
}
