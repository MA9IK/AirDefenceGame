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
); // ����� �������� (3) - x-����������, ����� (1) - y-���������� (����� ������), ���� (2) - z-����������
loadAndAddTurret(
  './public/turret.fbx',
  new THREE.Vector3(-3, -1, 2),
  turretTypes.HOMING,
  0.005
); // ����� �������� (-3) - x-����������, ����� (1) - y-���������� (����� ������), ���� (2) - z-����������
setInterval(() => {
  const spawnX = 20;
  const spawnY = Math.random() * 12 - -1;
  const enemyZ = 10;
  const position = new CANNON.Vec3(spawnX, spawnY, enemyZ);
  createEnemy(position); // �������� ������� ���
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

  // ��������� ����� ������
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
    fbx.scale.set(1, 1, 1); // ������� ����� �� ��������
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

    // ��������� ����� ��� ����� � Cannon.js
    const turret = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

    // ��������� ��� Cannon.js ��� ����� �� ������������ ���� ��������� �������
    const cannonTurretBody = new CANNON.Body({
      mass: 400, // ����� ���� �� ��������
      shape: turret,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });

    cannonTurretBody.position.copy(position);

    // ������ ��� ����� �� ���� Cannon.js
    world.addBody(cannonTurretBody);
    scene.add(clonedFbx);

    // ������ ��������� �� ��� ����� ��� ��������� � �������
    turrets.push({ body: cannonTurretBody, type });
  });
}

function sun() {
  const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // ������ ����
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  sunMesh.position.set(0, 50, -20); // ������� ������� �����
  scene.add(sunMesh);

  const sunlight = new THREE.DirectionalLight(0xffffff, 1); // ���� ����� � ������������ 1
  sunlight.position.copy(sunMesh.position); // ������� ����� ������� � �������� �����
  scene.add(sunlight);

  sunlight.color.set('#fff'); // ����� ���� �����
  sunlight.intensity = 2; // ����� ������������ �����

  // sunlight.castShadow = true; // �������� ��������� ���� �� �����

  // ������������ ��������� ���� ��� ��'����, �� ������� ��
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
  const targetShape = new CANNON.Sphere(0.1); // ����� ����� 1
  const targetBody = new CANNON.Body({
    mass: 200, // ������� ���� ���� (� ��)
    shape: targetShape,
    position
  });

  // ���� ��� �������� ���������
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

    // �������� ������� ������� ���
    const currentPosition = enemyBody.position;

    // ��������� �������� ���� ��� (���������, ����� ������)
    const forwardDirection = new CANNON.Vec3(-100, 0, 0); // ����� �������� �� ��������

    // ������� �������� �� �������� ���, ��� �������� ������ ��������
    const velocity = forwardDirection.scale(targetSpeed);

    // ����������� ������ �������� �� ���
    enemyBody.velocity.copy(velocity);

    // ������ ������� ���� �������� �� ��� ������ ������
    enemy.mesh.position.copy(currentPosition);
  });
}

window.addEventListener('resize', onWindowResize);
function animate() {
  requestAnimationFrame(animate);

  // ��������� ������� �� �� �������� ��'����
  fbxModels.forEach((item, index) => {
    const turretInfo = turrets[index];

    const cannonTurretBody = turretInfo.body;

    // ������� ������� ������ �����
    item.position.copy(cannonTurretBody.position);
    item.quaternion.copy(cannonTurretBody.quaternion);

    const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -1);
    mousePosition.unproject(camera);
    const direction = mousePosition.sub(camera.position).normalize();

    const angleToMouse = Math.atan2(direction.x, direction.z);

    // ��������� ������������ ���� ��������
    const smoothingFactor = 0.1; // ������� �������� ������������
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

  // ��������� ������ � ��� Cannon.js
  updateTargetPosition();

  // ��������� ������� ������
  enemies.forEach(enemy => {
    const enemyBody = enemy.body;
    const enemyMesh = enemy.mesh;

    // ������ ������� ���� �������� �� ��� ������ ������
    enemyMesh.position.copy(enemyBody.position);
    enemyMesh.quaternion.copy(enemyBody.quaternion);
  });

  groundMeshes.forEach(groundMesh => {
    groundMesh.position.copy(new THREE.Vector3(0, -1.55, 0)); // ������ ������� ������
  });

  world.fixedStep();

  renderer.render(scene, camera);
}
