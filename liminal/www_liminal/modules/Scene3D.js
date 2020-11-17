import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/controls/OrbitControls.js';
import Stats from './Stats.js';

export class Scene3D {
  constructor(width, height) {
    this.directional_lights = [];
    this.setup_display(width, height);
    this.setup_light();
    this.setup_controls();
    console.log(`%cTHREEJS ${this.W}x${this.H}`, 'color:lightblue');
  }

  setup_display(width, height) {
    this.W = width;
    this.H = height;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, this.W/this.H, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.W, this.H);
    this.renderer.setClearColor(new THREE.Color(0x101010), 1);

    document.body.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'renderer';
    window.addEventListener('resize', () => this._onresize());
    this._onresize();
  }

  _onresize() {
    if (window.innerWidth < window.innerHeight) {
      this.renderer.domElement.style.width = `${window.innerWidth}px`;
      this.renderer.domElement.style.height = 'auto';
    } else {
      this.renderer.domElement.style.width = 'auto';
      this.renderer.domElement.style.height = `${window.innerHeight}px`;
    }
  }

  add_directional_light(color, intensivity, position) {
    const light = new THREE.DirectionalLight(color, intensivity);
    light.position.x = position[0];
    light.position.y = position[1];
    light.position.z = position[2];
    this.scene.add(light);
    this.directional_lights.push(light);
  }

  setup_light() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    this.add_directional_light(0x00aaff, 0.7, [-5.5, +2.5, +2.5]);
  }

  setup_controls() {
    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = new Stats();
    document.body.appendChild(this.stats.domElement);
  }
}
