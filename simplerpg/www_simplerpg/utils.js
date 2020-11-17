/*
*/
var Utils = {};


Utils.DisplayCanvas = class DisplayCanvas {
  constructor(width, height, opt={}) {
    const {
      imageRendering = 'auto',
      imageSmoothingEnabled = true,
    } = opt;

    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.style.imageRendering = imageRendering;
    ctx.canvas.height = height;
    ctx.canvas.width = width;
    ctx.imageSmoothingEnabled = imageSmoothingEnabled;

    this.ctx = ctx;
    this.width = ctx.canvas.width;
    this.height = ctx.canvas.height;
    this.domElement = ctx.canvas;
  }
}


Utils.DisplayContainer = class DisplayContainer {
  constructor(width, height, displays, opt={}) {
    const {
      parent = document.body,
      outline = 'auto',
    } = opt;

    const domElement = document.createElement('div');
    domElement.classList.add('render-container');
    domElement.style.outline = outline; // HACK: OrbitControls trick
    domElement.style.height = `${height}px`;
    domElement.style.width = `${width}px`;
    for (let display of displays) {
      if (null == display.domElement)
        throw Error(`${display.constructor.name} has no domElement.`);
      display.domElement.style.position = 'absolute';
      domElement.appendChild(display.domElement);
    }
    parent.appendChild(domElement);

    this.parent = parent;
    this.displays = displays;
    this.domElement = domElement;
  }

  get width() { return parseFloat(this.domElement.style.width); }
  get height() { return parseFloat(this.domElement.style.height); }
  set width(width) { this.domElement.style.width = `${width}px`; }
  set height(height) { this.domElement.style.height = `${height}px`; }
}


Utils.Clock = class Clock {
  constructor() {
    this.lastTime = window.performance.now();
  }

  getDelta() {
    const currentTime = window.performance.now();
    const delta = (currentTime - this.lastTime) / 1000.0;
    this.lastTime = currentTime;
    return delta;
  }
}


Utils.Grid3 = class Grid3 {
  constructor(w, h, d) {
    w = ~~w;
    h = ~~h;
    d = ~~d;
    this.grid = Array(w * h * d).fill(0);
    this.width = w;
    this.height = h;
    this.depth = d;
  }

  inRange(x, y, z) { return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth; }
  i(x, y, z) { return ~~x + this.width * (~~y + this.height * ~~z); }
  xyz(i) { throw Error('not implemented yet'); }
  get(x, y, z) { return this.inRange(x, y, z) ? this.grid[this.i(x, y, z)] : null; }
  set(x, y, z, v) { return this.inRange(x, y, z) ? (this.grid[this.i(x, y, z)] = v) : null; }

  forEach(cb) {
    for (let z = 0; z < this.depth; ++z)
      for (let y = 0; y < this.height; ++y)
        for (let x = 0; x < this.width; ++x)
          cb(this.grid[this.i(x, y, z)], x, y, z, this.grid);
    return this;
  }

  fillRandomly(num, value) {
    for (let i = 0; i < num; ++i)
      this.grid[this.i(Math.random()*this.width,
                       Math.random()*this.height,
                       Math.random()*this.depth)] = value;
    return this;
  }

  fillEllipsoid(x, y, z, a, b, c, r, value) {
    // x, y, z as offset from 0,0,0
    // a, b, c as radiuses
    // r as radiuses scaler
    const x0 = Math.max(x-a*r+1, 0);
    const y0 = Math.max(y-b*r+1, 0);
    const z0 = Math.max(z-c*r+1, 0);
    const x1 = Math.min(x+a*r-0, this.width);
    const y1 = Math.min(y+b*r-0, this.height);
    const z1 = Math.min(z+c*r-0, this.depth);
    for (let _z = z0; _z < z1; _z += 1)
      for (let _y = y0; _y < y1; _y += 1)
        for (let _x = x0; _x < x1; _x += 1)
          if (((_x-x)/a)**2 + ((_y-y)/b)**2 + ((_z-z)/c)**2 <= r)
            this.set(_x, _y, _z, value);
    return this;
  }

  createTHREEGeometry() {
    if (!('THREE' in window))
      throw Error('threejs required!');

    const g = new THREE.Geometry();

    function push_quad(v1, v2, v3, v4) {
      g.vertices.push(v1, v2, v3, v4);
      g.faces.push(new THREE.Face3(0 + g.vertices.length - 4, 1 + g.vertices.length - 4, 2 + g.vertices.length - 4));
      g.faces.push(new THREE.Face3(2 + g.vertices.length - 4, 3 + g.vertices.length - 4, 0 + g.vertices.length - 4));
    }

    this.forEach((e, x, y, z) => {
      if (e) {
        const left   = this.get(x-1, y  , z  );
        const right  = this.get(x+1, y  , z  );
        const bottom = this.get(x  , y-1, z  ); // top and bottom inverted in opengl
        const top    = this.get(x  , y+1, z  );
        const far    = this.get(x  , y  , z-1);
        const near   = this.get(x  , y  , z+1);

        if (left && right && top && bottom && near && far)
          return;

        const ow = this.width  / 2 + 0.5;
        const oh = this.height / 2 + 0.5;
        const od = this.depth  / 2 + 0.5;
        //     xyz
        const v000 = new THREE.Vector3(0 + x - ow, 0 + y - oh, 0 + z - od);
        const v100 = new THREE.Vector3(1 + x - ow, 0 + y - oh, 0 + z - od);
        const v110 = new THREE.Vector3(1 + x - ow, 1 + y - oh, 0 + z - od);
        const v010 = new THREE.Vector3(0 + x - ow, 1 + y - oh, 0 + z - od);
        const v001 = new THREE.Vector3(0 + x - ow, 0 + y - oh, 1 + z - od);
        const v101 = new THREE.Vector3(1 + x - ow, 0 + y - oh, 1 + z - od);
        const v111 = new THREE.Vector3(1 + x - ow, 1 + y - oh, 1 + z - od);
        const v011 = new THREE.Vector3(0 + x - ow, 1 + y - oh, 1 + z - od);

        left   || push_quad(v000, v001, v011, v010);
        right  || push_quad(v100, v110, v111, v101);
        bottom || push_quad(v000, v100, v101, v001);
        top    || push_quad(v010, v011, v111, v110);
        far    || push_quad(v000, v010, v110, v100);
        near   || push_quad(v001, v101, v111, v011);
      }
    });

    g.computeFlatVertexNormals();

    return g;
  }
}


Utils.localStorage = {
  setItem(...args) { return window.localStorage.setItem(...args); },
  getItem(...args) { return window.localStorage.getItem(...args); },
  setJSON(key, o) { return window.localStorage.setItem(key, JSON.stringify(o)); },
  getJSON(key) { return JSON.parse(window.localStorage.getItem(key) || null); },

  listenTHREEControls(controls, key, delay) {
    if (!('_' in window))
      throw Error('lodash required!');

    const values = this.getJSON(key);
    if (values) {
      controls.position0.copy(values.position0);
      controls.target0.copy(values.target0);
      controls.zoom0 = values.zoom0;
      controls.reset();
    }

    return setInterval(() => {
      controls.saveState();
      this.setJSON(key, _.pick(controls, 'position0', 'target0', 'zoom0'));
    }, delay);
  },
};


Utils.Keyboard = class Keyboard {
  constructor() {
    this.keys = {};

    this.onkeyup = (e) => {
      e.preventDefault();
      this.keys[e.code] = false;
    };

    this.onkeydown = (e) => {
      e.preventDefault();
      this.keys[e.code] = true;
    };

    window.addEventListener('keyup', this.onkeyup);
    window.addEventListener('keydown', this.onkeydown);
  }
}


Utils.Mouse = class Mouse {
  constructor(domElement=document.body) {
    this.domElement = domElement;
    this.buttons = {};
    this.deltaX = 0;
    this.coords = [0, 0];
    this.ndc = [0, 0];

    this.onwheel = (e) => {
      e.preventDefault();
      this.deltaX = e.deltaX;
    };

    this.onmousemove = (e) => {
      e.preventDefault();
      const rect = this.domElement.getBoundingClientRect();
      this.coords[0] = e.clientX - rect.x;
      this.coords[1] = e.clientY - rect.y;
      this.ndc[0] = +this.coords[0] / rect.width  * 2 - 1;
      this.ndc[1] = -this.coords[1] / rect.height * 2 + 1;
    };

    this.onmousedown = (e) => {
      e.preventDefault();
      this.buttons[e.button] = true;
    };

    this.onmouseup = (e) => {
      e.preventDefault();
      this.buttons[e.button] = false;
    };

    this.domElement.addEventListener('wheel', this.onwheel);
    this.domElement.addEventListener('mousemove', this.onmousemove);
    this.domElement.addEventListener('mousedown', this.onmousedown);
    window.addEventListener('mouseup', this.onmouseup);
  }
}


Utils.getRGBAFromCanvasImageDataUV = function (image_data, u, v) {
  const tx = Math.min((  (u%1+1)%1) * image_data.width  | 0, image_data.width  - 1);
  const ty = Math.min((1-(v%1+1)%1) * image_data.height | 0, image_data.height - 1);
  const offset = (ty * image_data.width + tx) * 4;
  const r = image_data.data[offset + 0];
  const g = image_data.data[offset + 1];
  const b = image_data.data[offset + 2];
  const a = image_data.data[offset + 3];
  return [r, g, b, a];
};


Utils.THREETransformAxis = class THREETransformAxis {
  // У меня не работает TransformControls поэтому я написал свой.
  constructor(DragControls, scene, camera, domElement, opt={}) {
    if (!('THREE' in window))
      throw Error('threejs required!');

    const {
      controls = null,
      opacity = 0.5,
      object = null,
    } = opt;

    const geometry_line = new THREE.BoxGeometry(2, 0.05, 0.05);
    const geometry_box = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const meshes = [
      new THREE.Mesh(geometry_line, new THREE.MeshBasicMaterial({ color: 0xff5555 })),
      new THREE.Mesh(geometry_line, new THREE.MeshBasicMaterial({ color: 0x55ff55 })),
      new THREE.Mesh(geometry_line, new THREE.MeshBasicMaterial({ color: 0x5555ff })),
      new THREE.Mesh(geometry_box, new THREE.MeshBasicMaterial({ color: 0xffffff })),
    ];
    // axis meshes to drag object
    const group = new THREE.Group();
    meshes.forEach(e => {
      e.material.depthTest = false;
      e.material.opacity = opacity;
      e.material.transparent = true;
      group.add(e);
    });
    meshes[1].rotation.z = Math.PI / 2;
    meshes[2].rotation.y = Math.PI / 2;

    this.domElement = domElement;
    this.opacity = opacity;       // opacity of inactive axis (active is 1)
    this.object = object;         // pointer to an draggable object
    this.group = group;
    this.scene = scene;

    const oldpos = new THREE.Vector3(); // saves old position of axis to move in one axis only
    let index = 0;                      // axis index (0 - x, 1 - y, 2 - z, 3 - all)

    // resize axis then camera zooms
    this.onwheel = (e) => {
      // (e) && e.preventDefault();
      const dist = camera.position.distanceTo(this.group.position) / 5;
      meshes.forEach(axis => axis.scale.set(dist, dist, dist));
    };
    this.onwheel();
    // (controls) && this.domElement.addEventListener('wheel', this.onwheel);

    // dragger from THREEJS examples to control object
    const dragger = new DragControls(meshes, camera, domElement);
    // apply opacity in on hover
    dragger.addEventListener('hoveroff', (e) => e.object.material.opacity = this.opacity);
    dragger.addEventListener('hoveron', (e) => e.object.material.opacity = 1);
    // OrbitControls must be disabled when dragging
    dragger.addEventListener('dragstart', (e) => {
      (controls) && (controls.enabled = false);
      index = meshes.findIndex(axis => axis === e.object);
      oldpos.copy(e.object.position);
    });
    dragger.addEventListener('dragend', (e) => (controls) && (controls.enabled = true));
    // dragging object throw axis
    dragger.addEventListener('drag', (e) => {
      if        (index === 0) { // x
        e.object.position.y = oldpos.y;
        e.object.position.z = oldpos.z;
      } else if (index === 1) { // y
        e.object.position.x = oldpos.x;
        e.object.position.z = oldpos.z;
      } else if (index === 2) { // z
        e.object.position.x = oldpos.x;
        e.object.position.y = oldpos.y;
      }
      meshes.forEach(axis => axis.position.copy(e.object.position));
      (this.object) && this.object.position.copy(e.object.position);
      this.onwheel();
    });

    this.dragger = dragger;
  }

  setObject(o=null) {
    this.object = o;
    if (o) {
      this.scene.add(this.group);
      this.dragger.activate();
    } else {
      this.scene.remove(this.group);
      this.dragger.deactivate();
    }
    return this;
  }
}


Object.freeze(Utils);
