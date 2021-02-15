class Map {
  constructor() {

    this.width  = 5;
    this.height = 5;
    this.depth  = 4;

    this.map = [
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1,
      1,1,1,1,1,

      0,0,0,0,0,
      0,3,3,3,0,
      0,0,0,0,0,
      0,0,0,4,0,
      0,0,0,0,0,

      0,0,0,0,0,
      0,0,0,0,0,
      0,0,1,0,0,
      0,0,0,4,0,
      0,0,0,0,0,

      0,0,0,0,0,
      0,0,0,0,0,
      0,0,0,0,0,
      0,0,0,4,0,
      0,0,0,0,0,
    ];

    const geometry = new THREE.BoxGeometry();

    this.cubes = [];

    this.material_colors = [];

    for (let d = 0; d < this.depth; ++d)
      for (let h = 0; h < this.height; ++h)
        for (let w = 0; w < this.width; ++w)
    {
      const v = this.map[d * this.width * this.height + h * this.width + w];
      if (v === 0) {
        this.material_colors.push(null);
        this.cubes.push(null);
        continue;
      }

      const color = new THREE.Color([0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00][v]);

      const material = new THREE.MeshLambertMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = w;
      cube.position.y = d;
      cube.position.z = h;

      this.material_colors.push(color);
      this.cubes.push(cube);
    }

    const group = new THREE.Group();
    group.add(...this.cubes.filter(e => null != e));
    this.group = group;

    this.visibility_map = this.map.map(() => 0b00);
  }


  proc() {
  }


  // must be called once when player rotation starts.
  mark_visible(player) {
    // first bit contain information about visibility before rotation.
    // third bit represents is block was a background before rotation.
    for (let i = 0; i < this.visibility_map.length; ++i) {
      this.visibility_map[i] = this.visibility_map[i] >> 1 & 0b0101;
    }

    // player position in map space
    const pos_x = ~~(player.position.x + 0.5);
    const pos_y = ~~(player.position.z + 0.5);
    // player absolute forward direction
    const mdx = Math.abs(Math.round(Math.sin(player.rotates_to - Math.PI / 2)));
    const mdy = Math.abs(Math.round(Math.cos(player.rotates_to - Math.PI / 2)));
    // player face direction (towards camera)
    const fdx = Math.round(Math.sin(player.rotates_to));
    const fdy = Math.round(Math.cos(player.rotates_to));

    // plane on which laying lays player view is visible
    for (let d = 0; d < this.depth; ++d)
      for (let i = 0; i < mdy * this.height + mdx * this.width; ++i)
    {
      const w = mdx ? i : pos_x;
      const h = mdy ? i : pos_y;
      // second bit represents current visibility
      this.visibility_map[d * this.width * this.height + h * this.width + w] |= 0b0010;

      const fw = w - fdx;
      const fh = h - fdy;
      if (fw < 0 || fw >= this.width || fh < 0 || fh >= this.height) continue;
      // fourth bit represents is block is a background (also visible)
      this.visibility_map[d * this.width * this.height + fh * this.width + fw] |= 0b1010;
    }
  }


  // must be called each frame when player is rotating.
  // "visibility" is normalized absolute rotation degree.
  // 1.0 is fully visible, 0.0 is fully hidden.
  // "force" is to ignore values used on transition.
  apply_visibility(visibility, force=false) {
    for (let i = 0; i < this.cubes.length; ++i) {
      if (null == this.cubes[i]) continue;
      if (1 === this.map[i]) continue;

      const bg          = this.visibility_map[i] >> 3 & 1;
      const was_bg      = this.visibility_map[i] >> 2 & 1;
      const visible     = this.visibility_map[i] >> 1 & 1;
      const was_visible = this.visibility_map[i] >> 0 & 1;

      const { h, s, l } = this.material_colors[i].getHSL({});

      if (force) {
        if (visible) {
          this.cubes[i].scale.x = 1;
          this.cubes[i].scale.y = 1;
          this.cubes[i].scale.z = 1;
        } else {
          this.cubes[i].scale.x = 0;
          this.cubes[i].scale.y = 0;
          this.cubes[i].scale.z = 0;
        }
        if (bg) {
          this.cubes[i].material.color.setHSL(h, s * 0.5, l * 0.5);
        } else {
          this.cubes[i].material.color.setHSL(h, s, l);
        }
        continue;
      }

      if ((!was_bg) && bg) {
        this.cubes[i].material.color.setHSL(h, s * (1 - visibility / 2), l * (1 - visibility / 2));
      } else if (was_bg && !bg) {
        this.cubes[i].material.color.setHSL(h, s * (0.5 + visibility / 2), l * (0.5 + visibility / 2));
      }

      if (!was_visible && visible) {
        this.cubes[i].scale.x = visibility;
        this.cubes[i].scale.y = visibility;
        this.cubes[i].scale.z = visibility;
        continue;
      }

      if (was_visible && !visible) {
        this.cubes[i].scale.x = 1 - visibility;
        this.cubes[i].scale.y = 1 - visibility;
        this.cubes[i].scale.z = 1 - visibility;
        continue;
      }
    }
  }


}


class Player {
  constructor(map) {

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 1, 0);
    cube.scale.set(0.3, 0.3, 0.3);

    this.cube = cube;

    this.rotation = 0;
    this.rotates_from = 0;
    this.rotates_to = 0;
    this.is_rotating = false;

    this.map = map;

  }


  move(dhor=0) {
    // dont move if rotation in progress
    if (this.is_rotating) return;
    const speed = 0.1;
    this.cube.position.x += Math.sin(this.rotation - Math.PI / 2) * dhor * speed;
    // this.cube.position.y += dy * speed;
    this.cube.position.z += Math.cos(this.rotation - Math.PI / 2) * dhor * speed;
  }


  start_rotation(direction) {
    if (this.is_rotating) return;
    this.rotates_to = this.rotation + (Math.PI / 2) * direction;
    this.rotates_from = this.rotation;
    this.is_rotating = true;

    this.map.mark_visible(this);
  }

  // processes rotation and so on
  proc() {
    // rotation
    if (this.is_rotating) {
      const speed = 0.1;
      const rot_dir = Math.sign(this.rotates_to - this.rotates_from);
      this.rotation += rot_dir * speed;

      const vdegree = Math.abs(this.rotates_to - this.rotation) / (Math.PI / 2);
      this.map.apply_visibility(1 - vdegree);

      if (rot_dir < 0 && this.rotation <= this.rotates_to
      ||  rot_dir > 0 && this.rotation >= this.rotates_to
      ||  rot_dir === 0)
      {
        this.rotation = this.rotates_to;
        this.is_rotating = false;
        this.map.apply_visibility(1.0, true);
      }
    }
  }


  get position() {
    return this.cube.position;
  }
}



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


function tostr(v) {
  return JSON.stringify(v);
}
