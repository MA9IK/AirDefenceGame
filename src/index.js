import * as THREE from 'three';
import * as dat from 'dat.gui';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as CANNON from 'cannon-es';
import createEnemy from './components/enemies';
import ground from './components/ground';
import sun from './components/sun';
import fire from './utils/fire';
import onMouseMove from './utils/onMouseMove';
import onWindowResize from './utils/onResize';
import toggleBulletType from './utils/toggleBulletType';

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

const enemies = [];

const currentBulletType = BulletTypes.STANDARD;
const fbxModels = [];
const turrets = [];
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

init();
ground(scene, world);
sun(scene);
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(3, -1, 2),
  turretTypes.STANDARD,
  0.005
); // ����� �������� (3) - x-����������, ����� (1) - y-���������� (����� ������), ���� (2) - z-����������
loadAndAddTurret(
  'turret.fbx',
  new THREE.Vector3(-3, -1, 2),
  turretTypes.HOMING,
  0.005
); // ����� �������� (-3) - x-����������, ����� (1) - y-���������� (����� ������), ���� (2) - z-����������
setInterval(() => {
  const spawnX = 20;
  const spawnY = Math.random() * 12 - -1;
  const enemyZ = 20;
  const position = new CANNON.Vec3(spawnX, spawnY, enemyZ);
  createEnemy(position, world, scene, enemies); // �������� ������� ���
}, 1000);

animate();

const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

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

  renderer.domElement.addEventListener('mousemove', event => {
    onMouseMove(event, mouse);
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

function ui() {
  const gui = new dat.GUI();

  changeTurretTypes = document.createElement('button');
  changeTypeBullets = document.createElement('button');

  changeTurretTypes.textContent = `Turret type - ${currentBulletType}`;
  changeTurretTypes.addEventListener(
    'click',
    toggleBulletType(
      currentBulletType,
      changeTurretTypes,
      changeTypeBullets,
      BulletTypes
    )
  );

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

  changeTypeBullets.style = `
    color: black;
    background-color: green;
    border: none;
    padding: 10px;
    cursor: pointer;
    
    `;

  changeTypeBullets.textContent = `Now type bullets - ${currentBulletType}`;
  changeTypeBullets.addEventListener(
    'click',
    toggleBulletType(
      toggleBulletType(
        currentBulletType,
        changeTurretTypes,
        changeTypeBullets,
        BulletTypes
      )
    )
  );
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
  gui.domElement.appendChild(changeTypeBullets);
  gui.domElement.appendChild(changeTurretTypes);
  gui.domElement.appendChild(distanceTurret);

  const closeControlsButton = gui.domElement.querySelector('.close-button');
  if (closeControlsButton) {
    closeControlsButton.style.display = 'none';
  }
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

window.addEventListener('resize', onWindowResize(camera, renderer));
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

  // ��������� ������ � ��� Cannon.js
  updateTargetPosition();

  bullets.forEach(bullet => {
    const bulletBody = bullet.basic.body;
    const bulletMesh = bullet.basic.mesh;

    // ������ ������� ���� �������� �� ��� ������ ������
    bulletMesh.position.copy(bulletBody.position);
    bulletMesh.quaternion.copy(bulletBody.quaternion);
  });

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
