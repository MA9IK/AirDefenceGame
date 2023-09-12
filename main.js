import * as THREE from "../node_modules/three/build/three.module.js";
import * as dat from "./node_modules/dat.gui/build/dat.gui.module.js"

let camera, scene, renderer;

const params = {
  color: '#ccc'
};

init();

function init() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 1;
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color( params.color );
  
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  document.body.appendChild(renderer.domElement);

  const gui = new dat.GUI();
  gui.addColor(params, 'color').onChange(function(value) {
    scene.background.set( value );
  });
}

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: '#ff0000' } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {

  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;

  renderer.render(scene, camera);

}

animate();
