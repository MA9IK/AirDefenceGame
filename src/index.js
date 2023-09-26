import * as THREE from 'three';
import * as dat from 'dat.gui';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const params = {
  color: 'blue'
};

const mouse = new THREE.Vector2();

let camera;
let scene;
let renderer;
let isPageActive = true;
let changeTurretType;
let changeButtonType;
const rocketFuel = new Map();

const bullets = [];
const rockets = [];
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
let currentBulletType = BulletTypes.STANDARD;
let changeGravity;
let resetChangesButton;

let gravityValue = new CANNON.Vec3(0, -9.82, 0);

const enemies = [];
const fbxModels = [];
const turrets = [];

const world = new CANNON.World({ gravity: gravityValue });

init();
ui();
ground(scene, world);
sun(scene);
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(3, -1, 2),
  turretTypes.STANDARD,
  0.005,
  turrets,
  fbxModels
);
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(-3, -1, 2),
  turretTypes.HOMING,
  0.005,
  turrets,
  fbxModels
);

setInterval(
  () => {
    const spawnX = 45;
    const spawnY = Math.random() * 12 - -5;
    const enemyZ = 20;
    const position = new CANNON.Vec3(spawnX, spawnY, enemyZ);
    createEnemy(position, world, scene, enemies);
  },
  Math.random() * 3000 + 6000
);

animate();

const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.target.y = 0.1;
// controls.update();

document.addEventListener('visibilitychange', () => {
  isPageActive = document.visibilityState === 'hidden' ? false : true;
});

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

  renderer.domElement.addEventListener('mousemove', event => {
    onMouseMove(event, mouse);
  });
}

function loadAndAddTurret(modelPath, position, type, scale, name) {
  const loader = new FBXLoader();

  loader.load(modelPath, fbx => {
    const clonedFbx = fbx.clone();

    fbxModels.push(clonedFbx);

    clonedFbx.scale.set(scale, scale, scale);
    // clonedFbx.position.copy(position);

    const turret = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

    const cannonTurretBody = new CANNON.Body({
      mass: 0,
      shape: turret,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    cannonTurretBody.position.copy(position);

    world.addBody(cannonTurretBody);
    scene.add(clonedFbx);

    turrets.push({ body: cannonTurretBody, type });
  });
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
  const targetShape = new CANNON.Sphere(0.1);
  const targetBody = new CANNON.Body({
    mass: 100,
    shape: targetShape,
    position,
    linearFactor: new CANNON.Vec3(1, 0.03, 0)
  });

  world.addBody(targetBody);
  const dt = 1 / 60;
  const strength = 70300;

  const targetGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  // targetBody.linearDamping = 0.1;
  scene.add(targetMesh);

  const impulse = new CANNON.Vec3(-strength * dt, 0, 0);

  targetBody.applyImpulse(impulse);

  enemies.push({ body: targetBody, mesh: targetMesh });
}

function ground() {
  const loader = new FBXLoader();
  loader.load('./ground.fbx', fbx => {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });

    groundBody.position.set(0, -1.7, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    fbx.scale.set(1, 5, 1); // ������� ����� �� ��������
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    // ������� ��� �� ���� Cannon.js
    world.addBody(groundBody);

    // ������� ������ �� �����
    scene.add(fbx);
  });
}

function sun() {
  const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // ������ ����
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  sunMesh.position.set(0, 50, -20); // ������� ������� �����
  scene.add(sunMesh);

  const sunlight = new THREE.DirectionalLight(0xffffff, 1); // ���� ����� � ������������� 1
  sunlight.position.copy(sunMesh.position); // ������� ����� ������� � �������� �����
  scene.add(sunlight);

  sunlight.color.set('#fff'); // ������ ���� �����
  sunlight.intensity = 2; // ������ ������������� �����

  // sunlight.castShadow = true; // �������� ��������� ���� �� �����

  // ������������ ��������� ���� ��� ��'����, �� ������� ���
  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.mapSize.height = 1024;
}

function createBullet(turret, initialVelocity) {
  const bulletBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.05) // ����� ���
  });

  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }) // ���� ���
  );

  // ������������ ������� turret � ������� ��������� Cannon.js
  const cannonPosition = new CANNON.Vec3(
    turret.position.x,
    turret.position.y,
    turret.position.z
  );

  // ������ ��������� ������� bulletBody
  bulletBody.position.copy(cannonPosition);

  bulletMesh.position.copy(turret.position);
  bulletMesh.quaternion.copy(turret.quaternion);

  // ������ ��������� �������� ���
  bulletBody.velocity.set(
    initialVelocity.x,
    initialVelocity.y,
    initialVelocity.z
  );

  world.addBody(bulletBody);
  return { body: bulletBody, mesh: bulletMesh };
}

function createRocket(turret, initialVelocity) {
  const fuel = 20; // liters
  let mass = 50;
  if (fuel) mass += fuel;

  const rocketBody = new CANNON.Body({
    mass,
    shape: new CANNON.Sphere(0.05)
  });

  rocketFuel.set(rocketBody, fuel);

  const rocketMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshBasicMaterial({ color: 'green' })
  );

  const cannonPosition = new CANNON.Vec3(
    turret.position.x,
    turret.position.y,
    turret.position.z
  );

  rocketBody.position.copy(cannonPosition);

  rocketMesh.position.copy(turret.position);
  rocketMesh.quaternion.copy(turret.quaternion);

  rocketBody.velocity.set(
    initialVelocity.x,
    initialVelocity.y,
    initialVelocity.z
  );

  world.addBody(rocketBody);
  return { body: rocketBody, mesh: rocketMesh };
}

function fire(event) {
  const turret = fbxModels[0];
  const secondTurret = fbxModels[1];
  const muzzleVelocity = 60;

  const mouseDirection = new THREE.Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    -turret.position.z
  );

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  mouseDirection.unproject(camera);

  const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -turret.position.z);
  mousePosition.unproject(camera);
  const direction = mousePosition.sub(camera.position).normalize();

  const initialVelocity = direction.clone().multiplyScalar(muzzleVelocity);

  if (currentBulletType == BulletTypes.STANDARD) {
    const bullet = createBullet(turret, initialVelocity);
    bullets.push({ basic: bullet });
    scene.add(bullet.mesh);
  } else {
    const rocket = createRocket(secondTurret, initialVelocity);
    rockets.push(rocket);
    scene.add(rocket.mesh);
  }
}

function toggleBulletType() {
  currentBulletType =
    currentBulletType === BulletTypes.STANDARD
      ? BulletTypes.HOMING
      : BulletTypes.STANDARD;

  changeTurretType.textContent = `Turret type - ${currentBulletType}`;
  currentBullet = currentBulletType;
  changeButtonType.textContent = `Now type bullets - ${currentBulletType}`;
}

function ui() {
  const gui = new dat.GUI();

  // ����������� �������� UI �� ID
  changeTurretType = document.querySelector('#change-turret-button');
  changeButtonType = document.querySelector('#change-bullet-type-button');
  changeGravity = document.querySelector('#gravity');
  resetChangesButton = document.querySelector('#reset-changes');

  changeTurretType.innerText = `Turret type - ${currentBulletType}`;
  changeButtonType.innerText = `Turret type - ${currentBulletType}`;

  changeGravity.addEventListener('input', event => {
    console.log(event.target.value);
    gravityValue = new CANNON.Vec3(0, +event.target.value, 0);
    world.gravity.copy(gravityValue);
  });

  resetChangesButton.addEventListener('click', event => {
    gravityValue = new CANNON.Vec3(0, -9.82, 0);
    world.gravity.copy(gravityValue);
    changeGravity.value = '';
  });

  // ��������� ��������� ���� ��� ������
  changeTurretType.addEventListener('click', toggleBulletType);
  changeButtonType.addEventListener('click', toggleBulletType);

  renderer.domElement.addEventListener('click', event => {
    fire(
      event,
      scene,
      world,
      fbxModels,
      currentBulletType,
      BulletTypes,
      bullets,
      mouse,
      camera
    );
  });

  const closeControlsButton = gui.domElement.querySelector('.close-button');
  if (closeControlsButton) {
    closeControlsButton.style.display = 'none';
  }
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateRockets() {
  rockets.forEach(rocket => {
    const rocketBody = rocket.body;
    const rocketMesh = rocket.mesh;

    // ������� ��������� ����
    let closestTarget = null;
    let closestDistance = Infinity;

    enemies.forEach(enemy => {
      const enemyBody = enemy.body;
      const distance = rocketBody.position.distanceTo(enemyBody.position);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = enemyBody;
      }
    });

    if (closestTarget) {
      // �������� �������� �� ���
      const directionToTarget = new CANNON.Vec3();
      closestTarget.position.vsub(rocketBody.position, directionToTarget);
      directionToTarget.normalize();

      // ������ �������� ������ �� �������� �� ���
      rocketBody.velocity.copy(directionToTarget);

      // ������� ��������� ���������
      const randomDeviation = new CANNON.Vec3(
        directionToTarget.x,
        directionToTarget.y,
        directionToTarget.z
      );
      randomDeviation.normalize();
      rocketBody.velocity.vadd(randomDeviation, rocketBody.velocity);

      // ������ ������� ������
      rocketMesh.position.copy(rocketBody.position);
      rocketMesh.quaternion.copy(rocketBody.quaternion);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);

  updateRockets();
  fbxModels.forEach((item, index) => {
    const turretInfo = turrets[index];

    const cannonTurretBody = turretInfo.body;

    item.position.copy(cannonTurretBody.position);
    item.quaternion.copy(cannonTurretBody.quaternion);

    const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -1);
    mousePosition.unproject(camera);
    const direction = mousePosition.sub(camera.position).normalize();

    const angleToMouse = Math.atan2(direction.x, direction.z);

    const smoothingFactor = 0.1;
    turretRotationAngles[index] = turretRotationAngles[index] || angleToMouse;
    turretRotationAngles[index] +=
      (angleToMouse - turretRotationAngles[index]) * smoothingFactor;

    if (turretInfo.type === currentBulletType) {
      turretRotationAngles[index] +=
        (angleToMouse - turretRotationAngles[index]) * smoothingFactor;
      item.rotation.y = turretRotationAngles[index];
    } else {
      const angleToZero = 0;
      const angleDiff = angleToZero - turretRotationAngles[index];
      turretRotationAngles[index] += angleDiff * smoothingFactor;
    }
  });

  bullets.forEach(bullet => {
    const bulletBody = bullet.basic.body;
    const bulletMesh = bullet.basic.mesh;

    bulletMesh.position.copy(bulletBody.position);
    bulletMesh.quaternion.copy(bulletBody.quaternion);
  });

  groundMeshes.forEach(groundMesh => {
    groundMesh.position.copy(new THREE.Vector3(0, -1.55, 0));
  });

  rockets.forEach(rocket => {
    const rocketBody = rocket.body;
    const rocketMesh = rocket.mesh;

    const fuel = rocketFuel.get(rocketBody);

    if (fuel > 0) {
      rocketFuel.set(rocketBody, fuel - 0.05);

      console.log(fuel);

      rocketMesh.position.copy(rocketBody.position);
      rocketMesh.quaternion.copy(rocketBody.quaternion);
    } else {
      scene.remove(rocketMesh);
      world.removeBody(rocketBody);
      rockets.splice(rockets.indexOf(rocket), 1);
      rocketFuel.delete(rocketBody);
    }
  });

  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    const bulletBody = bullet.basic.body;
    const bulletMesh = bullet.basic.mesh;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const enemyBody = enemy.body;
      const enemyMesh = enemy.mesh;

      // Calculate the distance between the bullet and enemy
      const distance = bulletBody.position.distanceTo(enemyBody.position);

      // Assuming that bullets and enemies have a specific collision radius
      const bulletRadius = 0.3;
      const enemyRadius = 0.3;

      if (distance < bulletRadius + enemyRadius) {
        // Collision detected
        // Remove the bullet
        scene.remove(bulletMesh);
        world.removeBody(bulletBody);
        bullets.splice(i, 1);

        // Remove the enemy
        scene.remove(enemyMesh);
        world.removeBody(enemyBody);
        enemies.splice(j, 1);
      }
    }

    bulletMesh.position.copy(bulletBody.position);
    bulletMesh.quaternion.copy(bulletBody.quaternion);
  }

  enemies.forEach(enemy => {
    const enemyMesh = enemy.mesh;
    const enemyBody = enemy.body;

    enemyMesh.position.copy(enemyBody.position);
    enemyMesh.quaternion.copy(enemyBody.quaternion);
  });

  world.fixedStep();

  renderer.render(scene, camera);
}
