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
const fbxModels = [];
const bullets = [];
const enemies = [];

init();

loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(1, -2, 2));
loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(3, -2, 2));

animate();
setInterval(enemy, 1000);

function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  );
  camera.position.z = 1;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(params.color);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  document.body.style.cursor = 'none';

  camera.position.set(0, 1, -3);
  camera.lookAt(0, 1, 0);

  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', fire);
}

function loadAndAddTurret(modelPath, position) {
  const loader = new FBXLoader();

  loader.load(modelPath, fbx => {
    const clonedFbx = fbx.clone();

    fbxModels.push(clonedFbx);

    clonedFbx.scale.set(0.005, 0.005, 0.005);
    clonedFbx.position.copy(position);

    scene.add(clonedFbx);
  });
}

function enemy() {
  const spawnX = 20;
  const spawnY = Math.random() * 7 - 0;
  const enemyZ = 20;

  const enemy = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
  );

  enemy.position.set(spawnX, spawnY, enemyZ);

  const enemySpeed = 0.04;
  enemy.velocity = new THREE.Vector3(-enemySpeed, 0, 0);

  enemies.push(enemy);
  scene.add(enemy);
}

function fire(event) {
  fbxModels.forEach(item => {
    const bullet = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16), // adjust size
      new THREE.MeshBasicMaterial({ color: '#ff0000' })
    );

    const mouseDirection = new THREE.Vector3(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      -item.position.z
    );

    mouseDirection.unproject(camera);
    mouseDirection.sub(camera.position).normalize();

    const bulletSpeed = 1;
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

function updateTurrets() {
  fbxModels.forEach(turret => {
    enemies.forEach(enemy => {
      const direction = new THREE.Vector3()
        .subVectors(enemy.position, turret.position)
        .normalize();

      turret.lookAt(turret.position.clone().add(direction));
    });
  });
}

function animate() {
  requestAnimationFrame(animate);

  updateTurrets();

  renderer.render(scene, camera);

  bullets.forEach(item => {
    item.position.add(item.velocity);
  });

  enemies.forEach(enemy => {
    enemy.position.add(enemy.velocity);
  });
}
