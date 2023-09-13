import * as THREE from 'three';
// import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const params = {
  color: '#ccc'
};
const mouse = new THREE.Vector2();

let camera;
let scene;
let renderer;
let fbxModels = [];
let bullets = [];

init();


loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(1, -2, 2));
loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(3, -2, 2));

animate();

function init() {
  // Create the camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    10
  );
  camera.position.z = 1;

  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(params.color);

  // Create the renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Hide the default cursor and add the custom crosshair
  document.body.style.cursor = 'none';


  camera.position.set(0, 1, -3);
  camera.lookAt(0, 1, 0);

  // Add mouse move event listener
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', fire)
}

function loadAndAddTurret(modelPath, position) {
  const loader = new FBXLoader();

  loader.load(modelPath, fbx => {
    // Clone the model for each turret instance
    const clonedFbx = fbx.clone();

    fbxModels.push(clonedFbx)
    
    // Apply scaling and position to the cloned model
    clonedFbx.scale.set(0.005, 0.005, 0.005);
    clonedFbx.position.copy(position);
    
    // Add the cloned turret model to the scene
    scene.add(clonedFbx);
  });
}

// function fire(event) {
//   const bullet = new THREE.Mesh(
//     new THREE.SphereGeometry(0.05, 16, 16), // adjust size
//     new THREE.MeshBasicMaterial({ color: '#ff0000' })
//   )
//   let mouseDirection;
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   fbxModels.forEach(item => {
//     bullet.position.copy(item.position.clone())

//     mouseDirection = new THREE.Vector3(
//       -mouse.x,
//       mouse.y,
//       item.position.z
//     );
//   })
//   mouseDirection.normalize()

//   const bulletSpeed = 0.02

//   bullet.velocity = mouseDirection.multiplyScalar(bulletSpeed)

//   bullets.push(bullet)
//   scene.add(bullet)
// }

function fire(event) {
  fbxModels.forEach(item => {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 16, 16), // adjust size
      new THREE.MeshBasicMaterial({ color: '#ff0000' })
    );

    const mouseDirection = new THREE.Vector3(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      -item.position.z
    );
    
    mouseDirection.unproject(camera);
    mouseDirection.sub(camera.position).normalize();
    
    const bulletSpeed = 0.02;
    bullet.velocity = mouseDirection.multiplyScalar(bulletSpeed);
    
    bullet.position.copy(item.position.clone());
    bullets.push(bullet);
    scene.add(bullet);
  });
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const crosshairX = `${event.clientX - crosshair.width / 2}px`;
  const crosshairY = `${event.clientY - crosshair.height / 2}px`;

  crosshair.style.left = crosshairX;
  crosshair.style.top = crosshairY;

  const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -1);
  mousePosition.unproject(camera);

  const direction = mousePosition.sub(camera.position).normalize();

  fbxModels.forEach(item => {
    // Calculate the rotation to look at the direction
    item.lookAt(item.position.clone().add(direction));
  });
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  bullets.forEach(item => {
    item.position.add(item.velocity)
  })
}

