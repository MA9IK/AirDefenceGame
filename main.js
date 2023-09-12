import * as THREE from '../node_modules/three/build/three.module.js';
import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';

// Define variables and parameters
const params = {
  color: '#ccc'
};
const bullets = [];
const mouse = new THREE.Vector2();
// const rotationSpeed = 0.005;

let camera, scene, renderer, cube;

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
  gui.addColor(params, 'color').onChange(function (value) {
    scene.background.set(value);
  });

  // Hide the default cursor and add the custom crosshair
  document.body.style.cursor = 'none';
  const crosshair = document.getElementById('crosshair');

  // Create a cube
  const geometry = new THREE.BoxGeometry(0.2, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: '#ff0000' });
  cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Set camera position
  camera.position.z = 2;
  camera.position.y = 1;

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
      console.log(bullets);
    });
  }

  animate();
}

function shootBullet(event) {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16), // Adjust the size of the bullet
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
  );

  // Set the bullet's initial position at the cube's position
  bullet.position.copy(cube.position.clone());
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const mouseDirection = new THREE.Vector3(
    mouse.x / 2,
    mouse.y / 2,
    -cube.position.z
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

  const crosshairX = event.clientX - crosshair.width / 2 + 'px';
  const crosshairY = event.clientY - crosshair.height / 2 + 'px';

  crosshair.style.left = crosshairX;
  crosshair.style.top = crosshairY;

  const target = new THREE.Vector3(mouse.x, mouse.y, -camera.position.z);
  cube.lookAt(target);
}
