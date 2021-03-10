import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';


import { Level } from './level.js';


class Town extends Level {
  constructor(scene) {

    super(scene);

  }



  apply_group(o) {


    const trees = [];
    o.children.filter(e => e.name.indexOf('tree') === 0).forEach(e => trees.push(e));

    const snowes = [];
    o.children.filter(e => e.name.indexOf('snow') === 0).forEach(e => snowes.push(e));

    const houses = [];
    o.children.filter(e => e.name.indexOf('house') === 0).forEach(e => houses.push(e));

    this.towns = [];
    o.children.filter(e => e.name.indexOf('town') === 0).forEach(e => this.towns.push(e));

    o.remove(...this.towns);

    // super.apply_group(new THREE.Group());
    super.apply_group(o);

    // this.group = new THREE.Group();

    this.trees = trees;
    this.snowes = snowes;
    this.houses = houses;

  }



  update(elapsed) {



  }


  init_rt(orthocamera) {

    const rt_camera_aspect = orthocamera.width / orthocamera.height;
    this.rt_camera = new THREE.PerspectiveCamera(45, rt_camera_aspect, 0.1, 1000);
    this.rt_camera_radius = 50;
    this.rt_camera_origin = new THREE.Vector3(0, 0, 0);
    this.rt_camera_rotation = 0;

    this.rt_camera.position.y = 2;
    this.rt_camera_origin.y = 6;

    const rt_width = 128;
    const rt_height = rt_width / rt_camera_aspect;
    this.rt = new THREE.WebGLRenderTarget(rt_width, rt_height);

    this.rt_scene = new THREE.Scene();
    this.rt_scene.background = null;

    {

      const ambient_light = new THREE.AmbientLight(0xffffff, 0.6);
      this.rt_scene.add(ambient_light);

      const directional_light = new THREE.DirectionalLight(0xffffff, 1.0);
      directional_light.position.set(1, 1, 1);
      this.rt_scene.add(directional_light);


      // this.towns[0].position.set(0, 0, 0);
      this.rt_scene.add(this.towns[0]);

    }

    const geom = new THREE.PlaneGeometry(orthocamera.width, orthocamera.height);
    const mat  = new THREE.MeshLambertMaterial({ map: this.rt.texture, transparent: true });
    this.rt_plane = new THREE.Mesh(geom, mat);
    this.rt_plane.name = 'RenderTargetBackground';

    this.scene.add(this.rt_plane);

  }


  move_rt_camera(dx, dz) {
    const delta_scaler = 0.5;
    this.rt_camera.position.x += dx * delta_scaler;
    this.rt_camera.position.z += dz * delta_scaler;

  }


  update_rt(renderer, orthocamera) {
    const radius = -50; // minus because mesh is positioned opposite of camera
    this.rt_plane.position.x = orthocamera.origin.x + radius * Math.sin(orthocamera.rotation);
    this.rt_plane.position.y = orthocamera.origin.y;
    this.rt_plane.position.z = orthocamera.origin.z + radius * Math.cos(orthocamera.rotation);
    this.rt_plane.lookAt(orthocamera.origin);

    this.rt_camera.rotation.y = orthocamera.rotation;

    renderer.setRenderTarget(this.rt);
    renderer.render(this.rt_scene, this.rt_camera);
    renderer.setRenderTarget(null);
  }

}


export {
  Town
};
