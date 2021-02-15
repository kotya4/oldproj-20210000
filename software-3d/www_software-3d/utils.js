class FPSCamera {
  constructor() {
    this.rotation_speed = 0.005;
    this.moving_speed = 5;
    this.pointat_mat = mat4.create();
    this.lookat_mat  = mat4.create();
    this.pitch = 0;
    this.yaw   = Math.PI;
    this.pos     = [0, 0, 0];
    this.forward = [0, 0, 1];
    this.right   = [1, 0, 0];
    this.up      = [0, 1, 0];
    this.rotate(0, 0); // apply initial rotation to the vectors
  }

  get view() {
    // remember: forward points backward
    mat4.set(this.pointat_mat,
      ...this.right,   0,
      ...this.up,      0,
      ...this.forward, 0,
      ...this.pos,     1,
    );
    mat4.invert(this.lookat_mat, this.pointat_mat);
    return this.lookat_mat;
  }

  rotate(dx, dy) {
    this.yaw   -= this.rotation_speed * dx;
    this.pitch -= this.rotation_speed * dy;
    // clamp.
    this.pitch = Math.min(+0.5 * Math.PI, this.pitch);
    this.pitch = Math.max(-0.5 * Math.PI, this.pitch);
    // spherical coordinates (r=1).
    this.forward[0] = -Math.sin(this.yaw) * Math.cos(this.pitch);
    this.forward[1] = -Math.sin(this.pitch);
    this.forward[2] = -Math.cos(this.yaw) * Math.cos(this.pitch);
    vec3.normalize(this.forward, this.forward);
    this.right[0] = -Math.cos(this.yaw);
    this.right[1] = 0;
    this.right[2] = +Math.sin(this.yaw);
    vec3.normalize(this.right, this.right);
    vec3.cross(this.up, this.forward, this.right);
  }

  translate(dx, dy, dz) {
    this.pos[0] += dx;
    this.pos[1] += dy;
    this.pos[2] += dz;
  }

  move(dforward, dup, dright) {
    if (dforward) vec3.add(this.pos, this.pos, vec3.scale([], this.forward, +this.moving_speed * dforward));
    if (dright) vec3.add(this.pos, this.pos, vec3.scale([], this.right, +this.moving_speed * dright));
    if (dup) vec3.add(this.pos, this.pos, vec3.scale([], this.up, +this.moving_speed * dup));
  }

  lookat(target, up=[0, 1, 0]) {
    // TODO: set yaw and pitch ?
    vec3.sub(this.forward, target, this.pos);
    vec3.normalize(this.forward, this.forward);
    vec3.sub(this.up, up, vec3.scale([], this.forward, vec3.dot(up, this.forward)));
    vec3.normalize(this.up, this.up);
    vec3.cross(this.right, this.up, this.forward);
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


class MouseLock {
  constructor(canvas, parent=document) {
    this.mouse = {
      locked: false,
      _movementX: 0,
      _movementY: 0,
      get movementX() {
        const v = this._movementX;
        this._movementX = 0;
        return v;
      },
      get movementY() {
        const v = this._movementY;
        this._movementY = 0;
        return v;
      },
    };

    this.onmousemove = (e) => {
      this.mouse._movementX += e.movementX;
      this.mouse._movementY += e.movementY;
    };

    this.onmousedown = () => console.log('onmousedown');
    this.onmouseup = () => console.log('onmouseup');

    this.onpointerlockchange = () => {
      console.log('onpointerlockchange');
      if (parent.pointerLockElement === canvas) {
        parent.addEventListener('mousemove', this.onmousemove);
        parent.addEventListener('mousedown', this.onmousedown);
        parent.addEventListener('mouseup', this.onmouseup);
        this.mouse.locked = true;
      } else {
        parent.removeEventListener('mousemove', this.onmousemove);
        parent.removeEventListener('mousedown', this.onmousedown);
        parent.removeEventListener('mouseup', this.onmouseup);
        this.mouse.locked = false;
        this.mouse._movementX = 0;
        this.mouse._movementY = 0;
      }
    };

    parent.addEventListener('pointerlockchange', this.onpointerlockchange);

    this.onclick = () => {
      if (parent.pointerLockElement !== canvas)
        canvas.requestPointerLock();
    };

    this.parent = parent;
    this.canvas = canvas;
  }

  listen() {
    this.canvas.addEventListener('click', this.onclick);
  }

  forget() {
    this.canvas.removeEventListener('click', this.onclick);
  }
}


function centroid3(v0, v1, v2) {
  return [
    (v0[0] + v1[0] + v2[0]) / 3,
    (v0[1] + v1[1] + v2[1]) / 3,
    (v0[2] + v1[2] + v2[2]) / 3,
  ];
}


function sig(v, d=2) {
  const d1 = (10 ** d);
  return (v * d1 | 0) / d1;
}


function to_pos2(pos3, pmat, w, h) {
  const out = vec3.transformMat4([], pos3, pmat);
  out[0] = (+out[0] / out[2] + 1) * w / 2; // x in display space
  out[1] = (-out[1] / out[2] + 1) * h / 2; // y in display space
  // "out[2]" is the distance from the camera (exiting of near\far plane if > 1).
  // Also can be used to sort by distance.
  return out;
}


function face_normal(p1, p2, p3) {
  const Ux = p2[0] - p1[0];
  const Uy = p2[1] - p1[1];
  const Uz = p2[2] - p1[2];
  const Vx = p3[0] - p1[0];
  const Vy = p3[1] - p1[1];
  const Vz = p3[2] - p1[2];
  const N = [
    Uy * Vz - Uz * Vy,
    Uz * Vx - Ux * Vz,
    Ux * Vy - Uy * Vx,
  ];
  return vec3.normalize(N, N);
  // return vec3.normalize([], vec3.cross([], vec3.sub([], p2, p1), vec3.sub([], p3, p1)));
}


function plane_line_intersection(pd, plane_normal, a, b) {
  const ad = vec3.dot(a, plane_normal);
  const bd = vec3.dot(b, plane_normal);
  const ll = vec3.sub([], b, a);
  const li = vec3.scale([], ll, (pd - ad) / (bd - ad));
  return vec3.add([], a, li);
}


function clip_plane(plane_pos, plane_normal, tri) {
  const pd = vec3.dot(plane_normal, plane_pos);
  const dist = (p) => vec3.dot(plane_normal, p) - pd;

  const ip = [];
  const op = [];

  if (dist(tri[0]) >= 0) ip.push(tri[0]); else op.push(tri[0]);
  if (dist(tri[1]) >= 0) ip.push(tri[1]); else op.push(tri[1]);
  if (dist(tri[2]) >= 0) ip.push(tri[2]); else op.push(tri[2]);

  if (ip.length === 1) {
    return [
      [
        ip[0],
        plane_line_intersection(pd, plane_normal, ip[0], op[0]),
        plane_line_intersection(pd, plane_normal, ip[0], op[1]),
        1, // debug
      ]
    ];
  }

  if (ip.length === 2) {
    t1zt2y = plane_line_intersection(pd, plane_normal, ip[0], op[0]);
    return [
      [
        ip[0],
        ip[1],
        t1zt2y,
        2, // debug
      ],
      [
        ip[1],
        [...t1zt2y],
        plane_line_intersection(pd, plane_normal, ip[1], op[0]),
        3, // debug
      ]
    ];
  }

  if (ip.length === 3) {
    return [tri];
  }

  return [];
}
