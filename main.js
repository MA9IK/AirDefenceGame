import * as THREE from 'three';
import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const params = {
  color: '#ccc'
};
const bullets = [];
const mouse = new THREE.Vector2();

let camera;
let scene;
let renderer;
let fbxModel;

init();

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

  // Create GUI for changing the scene background color
  const gui = new dat.GUI();
  gui.addColor(params, 'color').onChange(value => {
    scene.background.set(value);
  });

  // Hide the default cursor and add the custom crosshair
  document.body.style.cursor = 'none';

  const loader = new FBXLoader();

  loader.load('./public/turret.fbx', fbx => {
    fbxModel = fbx;

    fbxModel.scale.set(0.01, 0.01, 0.01);

    fbxModel.position.set(0, 0, -2);
    scene.add(fbx);
  });

  // Set camera position
  camera.position.set(0, 1, -3);
  camera.lookAt(0, 1, 0);

  // Add mouse move event listener
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', shootBullet);

  // Animation function
  // Inside the animate() function, update the bullets
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    // Move and check for out-of-scene bullets
    bullets.forEach((bullet, index) => {
      bullet.position.add(bullet.velocity);

      // Remove the bullet if it goes out of the scene
      if (
        bullet.position.x < window.innerWidth / -2 ||
        bullet.position.x > window.innerWidth / 2 ||
        bullet.position.y < window.innerHeight / -2 ||
        bullet.position.y > window.innerHeight / 2
      ) {
        scene.remove(bullet);
        bullets.splice(index, 1);
      }
    });
  }

  animate();
}

function shootBullet(event) {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16), // Adjust the size of the bullet
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
  );

  bullet.position.copy(fbxModel.position.clone());
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const mouseDirection = new THREE.Vector3(
    mouse.x / 2,
    mouse.y / 2,
    -fbxModel.position.z
  );

  // Normalize the direction vector to ensure constant bullet speed
  mouseDirection.normalize();

  // Set the bullet's initial velocity (you can adjust this value for speed)
  const bulletSpeed = 0.02; // Adjust the bullet speed
  bullet.velocity = mouseDirection.multiplyScalar(bulletSpeed);

  scene.add(bullet);

  // Update bullet position in the animation loop
  bullets.push(bullet); // Store bullets in an array for updating
  scene.add(bullet);
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

  fbxModel.lookAt(fbxModel.position.clone().add(direction));
}
