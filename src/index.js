import * as THREE from 'three';
import * as dat from 'dat.gui';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
const bulletsFired = document.querySelector('.firedBullets');
const rocketLaunched = document.querySelector('.rocketsLaunched');
const enemiesKilled = document.querySelector('.enemiesKilled');
let bulletsFiredCount = 0;
let rocketsLaunchedCount = 0;
let enemiesKilledCount = 0;
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
    const spawnY = Math.random() * 12 - -7;
    const enemyZ = 20;
    const position = new CANNON.Vec3(spawnX, spawnY, enemyZ);
    createEnemy(position, world, scene, enemies);
  },
  Math.random() * 3000 + 6000
  // 1000
);

animate();


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

  // const controls = new OrbitControls(camera, renderer.domElement);

  // controls.enableDamping = true;
  // controls.target.y = 0.01;
  // controls.enableKeys = true;
  // controls.listenToKeyEvents(document.body);
  // controls.update();
  // controls.keys = {
  //   LEFT: 'ArrowLeft', //left arrow
  //   UP: 'ArrowUp', // up arrow
  //   RIGHT: 'ArrowRight', // right arrow
  //   BOTTOM: 'ArrowDown' // down arrow
  // };
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
  const loader = new FBXLoader();

  loader.load('rocket.fbx', fbx => {
    const targetShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const targetBody = new CANNON.Body({
      mass: 100,
      shape: targetShape,
      position,
      linearFactor: new CANNON.Vec3(1, 0.03, 0)
    });
    world.addBody(targetBody);

    const dt = 1 / 60;
    const strength = 73000;

    fbx.scale.set(0.005, 0.005, 0.005);

    const impulse = new CANNON.Vec3(-strength * dt, 0, 0);

    targetBody.applyImpulse(impulse);
    scene.add(fbx);

    enemies.push({ body: targetBody, mesh: fbx });
  });
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

  bulletsFiredCount++;
  bulletsFired.textContent = `Bullets Fired: ${bulletsFiredCount}`;
  world.addBody(bulletBody);
  return { body: bulletBody, mesh: bulletMesh };
}

function createRocket(turret) {
  const fuel = 20; // liters
  let mass = 50;
  if (fuel) mass += fuel;

  // Increase the initial velocity to make the rocket move faster
  const initialVelocity = new CANNON.Vec3(4, 0, 0); // Adjust the values as needed

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

  rocketBody.velocity.copy(initialVelocity);

  world.addBody(rocketBody);
  rocketsLaunchedCount++;
  rocketLaunched.textContent = `Rockets Launched: ${rocketsLaunchedCount}`;

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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

function calculateRotationQuaternion(velocity) {
  // Calculate the rotation quaternion based on the velocity vector
  const angle = Math.atan2(-velocity.z, velocity.x); // Adjust the components
  return new CANNON.Quaternion().setFromEuler(50, angle, 0);
}

function getDirectionToNearestEnemy(rocketPosition, enemies) {
  let nearestEnemy;
  let nearestDistance = Number.MAX_VALUE;

  for (const enemy of enemies) {
    const enemyPosition = enemy.body.position;
    const distance = rocketPosition.distanceTo(enemyPosition);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = enemyPosition;
    }
  }

  if (nearestEnemy) {
    const direction = new CANNON.Vec3().copy(nearestEnemy).vsub(rocketPosition);
    direction.normalize();
    return direction;
  }

  return null;
}

function animate() {
  requestAnimationFrame(animate);

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
      return;
    }
    const angleToZero = 0;
    const angleDiff = angleToZero - turretRotationAngles[index];
    turretRotationAngles[index] += angleDiff * smoothingFactor;
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

  rockets.forEach((rocket, rocketIndex) => {
    const rocketBody = rocket.body;
    const rocketMesh = rocket.mesh;

    const directionToNearestEnemy = getDirectionToNearestEnemy(
      rocketBody.position,
      enemies
    );

    const fuel = rocketFuel.get(rocketBody);

    rocketFuel.set(rocketBody, fuel - 0.3);

    if (!directionToNearestEnemy) {
      return;
    }

    if (fuel <= 0) {
      scene.remove(rocketMesh);
      world.removeBody(rocketBody);
      rockets.splice(rocketIndex, 1);
    }

    if (directionToNearestEnemy) {
      // Adjust the rocket's velocity based on the direction to the nearest enemy
      rocketBody.velocity.copy(directionToNearestEnemy);
      rocketBody.velocity.normalize();
      rocketBody.velocity.scale(rocketBody.mass, rocketBody.velocity);
    }

    rocketMesh.position.copy(rocketBody.position);
    rocketMesh.quaternion.copy(rocketBody.quaternion);

    // Check for collisions with enemies
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      const enemyBody = enemy.body;
      const enemyMesh = enemy.mesh;

      // Calculate the distance between the rocket and enemy
      const distance = rocketBody.position.distanceTo(enemyBody.position);

      // Assuming that rockets and enemies have a specific collision radius
      const rocketRadius = 0.05; // Adjust as needed
      const enemyRadius = 0.3; // Adjust as needed

      if (distance < rocketRadius + enemyRadius) {
        // Collision detected
        enemiesKilledCount++;
        enemiesKilled.textContent = `Enemies Killed: ${enemiesKilledCount}`;
        // Remove the rocket
        scene.remove(rocketMesh);
        world.removeBody(rocketBody);
        rockets.splice(rocketIndex, 1);

        // Remove the enemy
        scene.remove(enemyMesh);
        world.removeBody(enemyBody);
        enemies.splice(enemyIndex, 1);
      }
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
        enemiesKilledCount++;
        enemiesKilled.textContent = `Enemies Killed: ${enemiesKilledCount}`;
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

    // Update rotation quaternion based on velocity
    const rotationQuaternion = calculateRotationQuaternion(enemyBody.velocity);

    enemyMesh.position.copy(enemyBody.position);
    enemyMesh.quaternion.copy(rotationQuaternion); // Set the new rotation quaternion
  });

  world.fixedStep();

  renderer.render(scene, camera);
}
