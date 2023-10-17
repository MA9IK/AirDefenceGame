import * as THREE from 'three';
import * as dat from 'dat.gui';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const params = {
  color: 'blue'
};
const parameters = {
  elevation: 2,
  azimuth: 180
};
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import Stats from 'three/addons/libs/stats.module.js';

const mouse = new THREE.Vector2();

let camera;
let scene, stats, groundBody;
let renderer;
let isPageActive = true;
let changeTurretType;
let changeButtonType;
let sunlight, light, hemiLight, bulbLight;
const bulletsFired = document.querySelector('.firedBullets');
const rocketLaunched = document.querySelector('.rocketsLaunched');
const enemiesKilled = document.querySelector('.enemiesKilled');
let bulletsFiredCount = 0;
let rocketsLaunchedCount = 0;
let enemiesKilledCount = 0;
const rocketFuel = new Map();

const bulbLuminousPowers = {
  '110000 lm (1000W)': 110000,
  '3500 lm (300W)': 3500,
  '1700 lm (100W)': 1700,
  '800 lm (60W)': 800,
  '400 lm (40W)': 400,
  '180 lm (25W)': 180,
  '20 lm (4W)': 20,
  Off: 0
};

const hemiLuminousIrradiances = {
  '0.5 lx (Full Moon)': 0.5,
  '3.4 lx (City Twilight)': 3.4,
  '50 lx (Living Room)': 50
};

const paramsMoon = {
  shadows: true,
  exposure: 0.68,
  bulbPower: Object.keys(bulbLuminousPowers)[4],
  hemiIrradiance: Object.keys(hemiLuminousIrradiances)[0]
};

let timeScale = 0.5;

let sun, sky, water, nightMode;
const bullets = [];
const rockets = [];
const groundMeshes = [];
const turretRotationAngles = [];
let isNightMode = false;

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
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(3, -2, 2),
  turretTypes.STANDARD,
  0.005,
  turrets,
  fbxModels
);
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(-3, -2, 2),
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

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  let renderTarget;

  sun.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms['sunPosition'].value.copy(sun);
  water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  if (renderTarget !== undefined) renderTarget.dispose();

  // sceneEnv.add(sky);
  scene.add(sky);
  renderTarget = pmremGenerator.fromScene(scene);
  scene.add(sky);

  scene.environment = renderTarget.texture;
}

function init() {
  camera = new THREE.PerspectiveCamera(
    70, // fov
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  scene = new THREE.Scene();
  scene.background = new THREE.Color(params.color);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  document.body.style.cursor = 'none';

  camera.position.set(0, -0.5, -3);
  camera.lookAt(0, 1, 0);

  renderer.domElement.addEventListener('mousemove', event => {
    onMouseMove(event, mouse);
  });

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  sun = new THREE.Vector3();

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      'waternormals.jpg',
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  });

  water.rotation.x = -Math.PI / 2;
  water.position.y = -3;

  scene.add(water);

  // Skybox

  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  sunlight = new THREE.PointLight(0xffee88, 1, 100, 2); //new THREE.DirectionalLight(0xffff00, 1);
  scene.add(sunlight);

  sunlight.color.set('#f5f3e6');
  sunlight.intensity = 222;
  bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);

  bulbLight.position.set(10, 2, 0);
  bulbLight.castShadow = true;
  scene.add(bulbLight);

  hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
  scene.add(hemiLight);

  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.mapSize.height = 1024;

  const skyUniforms = sky.material.uniforms;

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;
  skyUniforms['sunPosition'].value.copy(sun);

  updateSun();
  //
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.6;
  // controls.target.set(3, 3, 3);
  controls.minDistance = 2.0;
  controls.maxDistance = 12.5;
  // controls.update();
  //
  stats = new Stats();
  document.body.appendChild(stats.dom);
  paramsMoon.hemiIrradiance = Object.keys(hemiLuminousIrradiances)[1];
  renderer.shadowMap.enabled = true;
  animate();
}

function handleMode() {
  isNightMode = !isNightMode;
  toggleNightMode();
}

function toggleNightMode() {
  // isNightMode = !isNightMode;

  if (isNightMode) {
    const skyUniforms = sky.material.uniforms;
    sunlight.color.set('#5e5d57');
    skyUniforms['rayleigh'].value = -90;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    bulbLight.position.set(10, 2, 0);
    bulbLight.castShadow = true;
    bulbLight.intensity = 222;
    parameters.elevation = -90;
    paramsMoon.hemiIrradiance = Object.keys(hemiLuminousIrradiances)[0];
  } else {
    const skyUniforms = sky.material.uniforms;
    sunlight.color.set('#f5f3e6');
    skyUniforms['turbidity'].value = 50;
    skyUniforms['rayleigh'].value = 3;
    parameters.elevation = 3;

    // Set hemiLuminousIrradiance to 3.4
    paramsMoon.hemiIrradiance = Object.keys(hemiLuminousIrradiances)[1];
  }
}

function ui() {
  const gui = new dat.GUI();

  const folderSky = gui.addFolder('Sky');
  folderSky.add(parameters, 'elevation', -90, 90, 0.1).onChange(updateSun);
  folderSky.add(parameters, 'azimuth', -180, 180, 0.1).onChange(updateSun);
  folderSky.open();

  const folderSun = gui.addFolder('Sun');

  folderSun.add(
    paramsMoon,
    'hemiIrradiance',
    Object.keys(hemiLuminousIrradiances)
  );
  folderSun.add(paramsMoon, 'bulbPower', Object.keys(bulbLuminousPowers));
  folderSun.add(paramsMoon, 'exposure', 0, 1);
  folderSun.add(paramsMoon, 'shadows');
  folderSun.open();

  const waterUniforms = water.material.uniforms;

  const folderWater = gui.addFolder('Water');
  folderWater
    .add(waterUniforms.distortionScale, 'value', 0, 8, 0.1)
    .name('distortionScale');
  folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
  folderWater.open();

  changeTurretType = document.querySelector('#change-turret-button');
  changeButtonType = document.querySelector('#change-bullet-type-button');
  changeGravity = document.querySelector('#gravity');
  nightMode = document.querySelector('.nightMode');
  resetChangesButton = document.querySelector('#reset-changes');
  const timeControl = document.querySelector('#timeScaleSlider');
  const timeValue = document.querySelector('#timeScaleValue');

  changeTurretType.innerText = `Turret type - ${currentBulletType}`;
  changeButtonType.innerText = `Turret type - ${currentBulletType}`;

  changeGravity.addEventListener('input', event => {
    gravityValue = new CANNON.Vec3(0, +event.target.value, 0);
    world.gravity.copy(gravityValue);
  });

  timeControl.addEventListener('input', event => {
    updateTimeScale(event.target.value);
    timeValue.textContent = `${timeScale}`;
  });

  resetChangesButton.addEventListener('click', event => {
    gravityValue = new CANNON.Vec3(0, -9.82, 0);
    world.gravity.copy(gravityValue);
    changeGravity.value = '';
  });

  nightMode.addEventListener('click', handleMode);
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
}

// loadAndAddTurret('villa.fbx', new THREE.Vector3(0, 0, 0), 'house', 0.005)

function loadAndAddTurret(modelPath, position, type, scale) {
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
    groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });

    groundBody.position.set(0, 0, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    fbx.scale.set(1, 5, 1); // Adjust the scale as needed
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -2.5, 500);

    // Add the ground body and mesh to the world and scene
    world.addBody(groundBody);
    scene.add(fbx);
  });
}

function createBullet(turret, initialVelocity) {
  const bulletBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.05)
  });

  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );

  const cannonPosition = new CANNON.Vec3(
    turret.position.x,
    turret.position.y,
    turret.position.z
  );

  bulletBody.position.copy(cannonPosition);

  bulletMesh.position.copy(turret.position);
  bulletMesh.quaternion.copy(turret.quaternion);

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
  const fuel = 40; // liters
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateTimeScale(value) {
  timeScale = value;
}

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

// Function to check collision with the ground
function checkCollisionWithGround(objectBody, groundMesh) {
  // You may need to adjust these values based on your object and ground dimensions
  const objectRadius = 0.05;

  const objectPosition = objectBody.position.clone();
  const groundPosition = groundMesh.position.clone();
  const groundHalfHeight = groundMesh.scale.y / 2; // Adjust for the ground's actual size

  if (
    objectPosition.x >= groundPosition.x - groundHalfHeight &&
    objectPosition.x <= groundPosition.x + groundHalfHeight &&
    objectPosition.z >= groundPosition.z - groundHalfHeight &&
    objectPosition.z <= groundPosition.z + groundHalfHeight &&
    objectPosition.y <= groundPosition.y + objectRadius
  ) {
    return true; // Collision detected
  }
  return false; // No collision
}

// updateTimeScale(0.25);
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
    groundMesh.position.copy(new THREE.Vector3(0, 0, 0));

    if (checkCollisionWithGround(groundMesh.body, groundMesh)) {
      scene.remove(groundMesh);
      world.removeBody(groundMesh.body);
      groundMesh.body.velocity.set(0, 0, 0);
      groundMesh.body.angularVelocity.set(0, 0, 0);
    }
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

  const fixedTimeStep = 1 / 245; // Default time step

  const timeStep = fixedTimeStep * timeScale; // Apply the time scale

  bulbLight.power = bulbLuminousPowers[paramsMoon.bulbPower];
  // bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow( 0.02, 2.0 ); // convert from intensity to irradiance at bulb surface

  hemiLight.intensity = hemiLuminousIrradiances[paramsMoon.hemiIrradiance];

  water.material.uniforms['time'].value += 0.1 / 245.0;
  world.step(timeStep); // Update the physics world
  stats.update();
  renderer.render(scene, camera);
}
