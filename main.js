import * as THREE from 'three';
import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';

const params = {
  color: '#ccc'
};

const mouse = new THREE.Vector2();

let camera;
let scene;
let renderer;
const maxTargetDistance = 20;
let distanceTurret;
let isPageActive = true;
let changeTypeBullets;
let changeTurretTypes;
const bullets = [];
const groundMeshes = [];
const turretRotationAngles = [];
const BulletTypes = {
  STANDARD: 'Standard',
  HOMING: 'Homing'
};
const turretTypes = {
  STANDARD: 'Standard',
  HOMING: 'Homing'
};

let currentBullet = BulletTypes.STANDARD;

const enemies = [];

let currentBulletType = BulletTypes.STANDARD;
const fbxModels = [];
const turrets = [];
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

init();
ground();
sun();
loadAndAddTurret(
  './public/turret.fbx',
  new THREE.Vector3(3, -1, 2),
  turretTypes.STANDARD,
  0.005
); // Перше значення (3) - x-координата, друге (1) - y-координата (нижче підлоги), третє (2) - z-координата
loadAndAddTurret(
  './public/turret.fbx',
  new THREE.Vector3(-3, -1, 2),
  turretTypes.HOMING,
  0.005
); // Перше значення (-3) - x-координата, друге (1) - y-координата (нижче підлоги), третє (2) - z-координата
setInterval(() => {
  const spawnX = 20;
  const spawnY = Math.random() * 12 - -1;
  const enemyZ = 10;
  const position = new CANNON.Vec3(spawnX, spawnY, enemyZ);
  createEnemy(position); // Передача позиції цілі
}, 1000);

// loadGround('./public/ground.fbx', new THREE.Vector3(0, 0, 10), 0.01);

animate();

// Sets a 12 by 12 gird helper
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

// Sets the x, y, and z axes with each having a length of 4
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

document.addEventListener('visibilitychange', () => {
  isPageActive = document.visibilityState === 'hidden' ? false : true;
});

ui();

function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(params.color);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  document.body.style.cursor = 'none';

  camera.position.set(0, 1, -3);
  camera.lookAt(0, 1, 0);

  renderer.domElement.addEventListener('mousemove', onMouseMove);
}

function toggleBulletType() {
  currentBulletType =
    currentBulletType === BulletTypes.STANDARD
      ? BulletTypes.HOMING
      : BulletTypes.STANDARD;

  // Оновлюємо текст кнопки
  changeTurretTypes.textContent = `Turret type - ${currentBulletType}`;
  currentBullet = currentBulletType;
  changeTypeBullets.textContent = `Now type bullets - ${currentBulletType}`;
}

function ground() {
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(14, 0, 0),
    -Math.PI / 2
  );
  groundBody.position.y = -1.6;
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);

  const loader = new FBXLoader();
  loader.load('./public/ground.fbx', fbx => {
    fbx.scale.set(1, 1, 1); // Масштаб моделі за потребою
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    scene.add(fbx);
  });
}

function loadAndAddTurret(modelPath, position, type, scale) {
  const loader = new FBXLoader();

  loader.load(modelPath, fbx => {
    const clonedFbx = fbx.clone();

    fbxModels.push(clonedFbx);

    clonedFbx.scale.set(scale, scale, scale);
    clonedFbx.position.copy(position);

    // Створюємо форму для турелі у Cannon.js
    const turret = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

    // Створюємо тіло Cannon.js для турелі та встановлюємо його початкову позицію
    const cannonTurretBody = new CANNON.Body({
      mass: 400, // Змініть масу за потребою
      shape: turret,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    cannonTurretBody.position.copy(position);

    // Додаємо тіло турелі до світу Cannon.js
    world.addBody(cannonTurretBody);
    scene.add(clonedFbx);

    // Додаємо посилання на тіло турелі для оновлення в анімації
    turrets.push({ body: cannonTurretBody, type });
  });
}

function sun() {
  const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Жовтий колір
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  sunMesh.position.set(0, 50, -20); // Приклад позиції сонця
  scene.add(sunMesh);

  const sunlight = new THREE.DirectionalLight(0xffffff, 1); // Біле світло з інтенсивністю 1
  sunlight.position.copy(sunMesh.position); // Позиція світла співпадає з позицією сонця
  scene.add(sunlight);

  sunlight.color.set('#fff'); // Змініть колір світла
  sunlight.intensity = 2; // Змініть інтенсивність світла

  // sunlight.castShadow = true; // Увімкнути генерацію тіней від сонця

  // Налаштування параметрів тіней для об'єктів, які кидають тіні
  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.mapSize.height = 1024;
}

function ui() {
  const gui = new dat.GUI();

  changeTurretTypes = document.createElement('button');
  changeTurretTypes.textContent = `Turret type - ${currentBulletType}`;
  changeTurretTypes.addEventListener('click', toggleBulletType);

  changeTurretTypes.style = `
  color: white;
    background-color: blue;
    border: none;
    padding: 10px;
    cursor: pointer
    `;

  distanceTurret = document.createElement('div');
  distanceTurret.textContent = `Curret turret distance - ${maxTargetDistance}`;

  distanceTurret.style = `
    color: black;
    `;

  changeTypeBullets = document.createElement('button');
  changeTypeBullets.style = `
    color: black;
    background-color: green;
    border: none;
    padding: 10px;
    cursor: pointer;
    
    `;

  changeTypeBullets.textContent = `Now type bullets - ${currentBulletType}`;
  changeTypeBullets.addEventListener('click', toggleBulletType);

  gui.domElement.appendChild(changeTypeBullets);
  gui.domElement.appendChild(changeTurretTypes);
  gui.domElement.appendChild(distanceTurret);

  const closeControlsButton = gui.domElement.querySelector('.close-button');
  if (closeControlsButton) {
    closeControlsButton.style.display = 'none';
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const crosshairX = `${event.clientX - crosshair.width / 2}px`;
  const crosshairY = `${event.clientY - crosshair.height / 2}px`;

  crosshair.style.left = crosshairX;
  crosshair.style.top = crosshairY;
}

function createEnemy(position) {
  const targetShape = new CANNON.Sphere(0.1); // Сфера радіус 1
  const targetBody = new CANNON.Body({
    mass: 200, // Реальна вага БПЛА (в кг)
    shape: targetShape,
    position
  });

  // Сила яка компенсує гравітацію
  // targetBody.applyForce(new CANNON.Vec3(-1, 0, 0), targetBody.position);

  world.addBody(targetBody);

  const targetGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Graphics geometry of the enemy
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Color of the enemy
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  scene.add(targetMesh);
  // targetMesh.velocity = new THREE.Vector3(-10, 0, 0);

  targetBody.velocity = new CANNON.Vec3(-10, 0, 0);
  targetMesh.position.copy(position);

  targetBody.addEventListener('collide', function (event) {
    console.log('Enemy collided with something!');
  });

  enemies.push({ body: targetBody, mesh: targetMesh });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateTargetPosition() {
  enemies.forEach(enemy => {
    const targetSpeed = 0.04;
    const enemyBody = enemy.body;

    // Отримати поточну позицію цілі
    const currentPosition = enemyBody.position;

    // Визначити напрямок руху цілі (наприклад, прямо вперед)
    const forwardDirection = new CANNON.Vec3(-100, 0, 0); // Змініть напрямок за потребою

    // Множимо напрямок на швидкість цілі, щоб отримати вектор швидкості
    const velocity = forwardDirection.scale(targetSpeed);

    // Застосовуємо вектор швидкості до цілі
    enemyBody.velocity.copy(velocity);

    // Оновіть позицію меша відповідно до тіла фізики ворога
    enemy.mesh.position.copy(currentPosition);
  });
}

window.addEventListener('resize', onWindowResize);
function animate() {
  requestAnimationFrame(animate);

  // Оновлення турелей та їх фізичних об'єктів
  fbxModels.forEach((item, index) => {
    const turretInfo = turrets[index];

    const cannonTurretBody = turretInfo.body;

    // Оновити фізичну модель турелі
    item.position.copy(cannonTurretBody.position);
    item.quaternion.copy(cannonTurretBody.quaternion);

    const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -1);
    mousePosition.unproject(camera);
    const direction = mousePosition.sub(camera.position).normalize();

    const angleToMouse = Math.atan2(direction.x, direction.z);

    // Здійснюємо згладжування кута повороту
    const smoothingFactor = 0.1; // Задайте значення згладжування
    turretRotationAngles[index] = turretRotationAngles[index] || angleToMouse;
    turretRotationAngles[index] +=
      (angleToMouse - turretRotationAngles[index]) * smoothingFactor;

    if (turretInfo.type === currentBullet) {
      turretRotationAngles[index] +=
        (angleToMouse - turretRotationAngles[index]) * smoothingFactor;
      item.rotation.y = turretRotationAngles[index];
    } else {
      const angleToZero = 0;
      const angleDiff = angleToZero - turretRotationAngles[index];
      turretRotationAngles[index] += angleDiff * smoothingFactor;
    }
  });

  // Оновлення фізики у світі Cannon.js
  updateTargetPosition();

  // Оновлення позицій ворогів
  enemies.forEach(enemy => {
    const enemyBody = enemy.body;
    const enemyMesh = enemy.mesh;

    // Оновіть позицію меша відповідно до тіла фізики ворога
    enemyMesh.position.copy(enemyBody.position);
    enemyMesh.quaternion.copy(enemyBody.quaternion);
  });

  groundMeshes.forEach(groundMesh => {
    groundMesh.position.copy(new THREE.Vector3(0, -1.55, 0)); // Оновіть позицію підлоги
  });

  world.fixedStep();

  renderer.render(scene, camera);
}
