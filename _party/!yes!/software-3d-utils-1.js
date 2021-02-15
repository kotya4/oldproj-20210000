

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
      } else {
        parent.removeEventListener('mousemove', this.onmousemove);
        parent.removeEventListener('mousedown', this.onmousedown);
        parent.removeEventListener('mouseup', this.onmouseup);
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








function to_pos2(pos3, pmat, w, h) {
  const out = vec3.transformMat4([], pos3, pmat);
  out[0] = (+out[0] / out[2] + 1) * w / 2; // x in display space
  out[1] = (-out[1] / out[2] + 1) * h / 2; // y in display space
  // out[2] is the distance from the camera (exiting of near\far plane if > 1)
  // also can be used to sort by distance
  return out;
}


function calc_normal(p1, p2, p3) {
  // U = p2 - p1
  // V = p3 - p1
  // N = U X V
  // or
  // Nx = UyVz - UzVy
  // Ny = UzVx - UxVz
  // Nz = UxVy - UyVx
  return vec3.normalize([], vec3.cross([], vec3.sub([], p2, p1), vec3.sub([], p3, p1)));
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


function lookat(eye, target, up_) {
  // E: eye, T: target, Y: up;
  // F = (T - E)^
  // U = (Y - F * (Y · F))^
  // R = U x F
  //                 [ ...R 0 ]
  // pointAtMatrix = [ ...U 0 ]
  //                 [ ...F 0 ]
  //                 [ ...E 1 ]
  // lookAtMatrix = pointAtMatrix ⁻¹
  const forward = vec3.normalize([], vec3.sub([], target, eye));
  const up = vec3.normalize([], vec3.sub([], up_, vec3.scale([], forward, vec3.dot(up_, forward))));
  const right = vec3.cross([], up, forward);
  const point_at = [
    ...right,   0,
    ...up,      0,
    ...forward, 0,
    ...eye,     1,
  ];
  return mat4.invert([], point_at);
  // return [
  //   point_at[0x0], point_at[0x4], point_at[0x8], 0,
  //   point_at[0x1], point_at[0x5], point_at[0x9], 0,
  //   point_at[0x2], point_at[0x6], point_at[0xa], 0,
  //   -(point_at[0xc] * point_at[0x0] + point_at[0xd] * point_at[0x1] + point_at[0xe] * point_at[0x2]),
  //   -(point_at[0xc] * point_at[0x4] + point_at[0xd] * point_at[0x5] + point_at[0xe] * point_at[0x6]),
  //   -(point_at[0xc] * point_at[0x8] + point_at[0xd] * point_at[0x9] + point_at[0xe] * point_at[0xa]),
  //   1,
  // ];
}


function plane_line_intersect(plane_pos, plane_normal, line_p1, line_p2) {
  const plane_d = -vec3.dot(plane_normal, plane_pos);
  const ad = vec3.dot(line_p1, plane_normal);
  const bd = vec3.dot(line_p2, plane_normal);
  const t = (-plane_d - ad) / (bd - ad);
  const line_len = vec3.sub([], line_p2, line_p1);
  const intersection = vec3.scale([], line_len, t);
  return vec3.add([], line_p1, intersection);
}


function clip_plane(plane_pos, plane_normal, tri) {
  // Return signed shortest distance from point to plane, plane normal must be normalised
  const dist = (p) => {
    const n = vec3.normalize([], p);
    return (plane_normal[0] * p[0] + plane_normal[1] * p[1] + plane_normal[2] * p[2] - vec3.dot(plane_normal, plane_pos));
  };

  // Create two temporary storage arrays to classify points either side of plane
  // If distance sign is positive, point lies on "inside" of plane
  const inside_points = [null, null, null]; let nInsidePointCount = 0;
  const outside_points = [null, null, null]; let nOutsidePointCount = 0;

  // Get signed distance of each point in triangle to plane
  let d0 = dist(tri[0]);
  let d1 = dist(tri[1]);
  let d2 = dist(tri[2]);

  if (d0 >= 0) { inside_points[nInsidePointCount++] = tri[0]; }
  else { outside_points[nOutsidePointCount++]       = tri[0]; }
  if (d1 >= 0) { inside_points[nInsidePointCount++] = tri[1]; }
  else { outside_points[nOutsidePointCount++]       = tri[1]; }
  if (d2 >= 0) { inside_points[nInsidePointCount++] = tri[2]; }
  else { outside_points[nOutsidePointCount++]       = tri[2]; }

  // Now classify triangle points, and break the input triangle into
  // smaller output triangles if required. There are four possible
  // outcomes...

  if (nInsidePointCount === 0) {
    // All points lie on the outside of plane, so clip whole triangle
    // It ceases to exist
    return []; // No returned triangles are valid
  }

  if (nInsidePointCount === 3) {
    // All points lie on the inside of plane, so do nothing
    // and allow the triangle to simply pass through
    return [tri]; // Just the one returned original triangle is valid
  }

  if (nInsidePointCount === 1 && nOutsidePointCount === 2) {
    // Triangle should be clipped. As two points lie outside
    // the plane, the triangle simply becomes a smaller triangle

    const out_tri1 = [];

    // Copy appearance info to new triangle
    // out_tri1.col = in_tri.col;
    // out_tri1.sym = in_tri.sym;

    // The inside point is valid, so keep that...
    out_tri1[0] = inside_points[0];

    // but the two new points are at the locations where the
    // original sides of the triangle (lines) intersect with the plane
    out_tri1[1] = plane_line_intersect(plane_pos, plane_normal, inside_points[0], outside_points[0]);
    out_tri1[2] = plane_line_intersect(plane_pos, plane_normal, inside_points[0], outside_points[1]);

    // Return the newly formed single triangle
    return [ out_tri1 ];
  }

  if (nInsidePointCount === 2 && nOutsidePointCount === 1) {
    // Triangle should be clipped. As two points lie inside the plane,
    // the clipped triangle becomes a "quad". Fortunately, we can
    // represent a quad with two new triangles

    const out_tri1 = [];
    const out_tri2 = [];

    // Copy appearance info to new triangles
    // out_tri1.col =  in_tri.col;
    // out_tri1.sym = in_tri.sym;

    // out_tri2.col =  in_tri.col;
    // out_tri2.sym = in_tri.sym;

    // The first triangle consists of the two inside points and a new
    // point determined by the location where one side of the triangle
    // intersects with the plane
    out_tri1[0] = inside_points[0];
    out_tri1[1] = inside_points[1];
    out_tri1[2] = plane_line_intersect(plane_pos, plane_normal, inside_points[0], outside_points[0]);

    // The second triangle is composed of one of he inside points, a
    // new point determined by the intersection of the other side of the
    // triangle and the plane, and the newly created point above
    out_tri2[0] = inside_points[1];
    out_tri2[1] = out_tri1[2];
    out_tri2[2] = plane_line_intersect(plane_pos, plane_normal, inside_points[1], outside_points[0]);

    // Return two newly formed triangles which form a quad
    return [
      out_tri1,
      out_tri2,
    ];
  }

}







function get_hedron_obj() {
  const vertices = [
    [ -0.000000,  0.000319, -1.000000 ],
    [ -0.866026,  0.000318,  0.500000 ],
    [  0.866025,  0.000318,  0.500000 ],
    [  0.000000, -1.000000, -0.000000 ],
    [ -0.000000,  1.000637,  0.000000 ],
  ];

  const fnormals = [
    [ +0.7746, -0.4471, -0.4472 ],
    [ -0.7746, -0.4471, -0.4472 ],
    [ -0.0000, -0.4471, +0.8945 ],
    [ -0.7746, +0.4471, -0.4472 ],
    [ +0.7746, +0.4471, -0.4472 ],
    [ -0.0000, +0.4471, +0.8945 ],
  ];

  const normal_indices = [
    1, 1, 1,
    2, 2, 2,
    3, 3, 3,
    4, 4, 4,
    5, 5, 5,
    6, 6, 6,
  ];

  const indices = [
    3, 1, 4,
    1, 2, 4,
    3, 4, 2,
    2, 1, 5,
    1, 3, 5,
    2, 5, 3,
  ];

  return {
    vertices,
    fnormals,
    indices,
    normal_indices,
  };
}
