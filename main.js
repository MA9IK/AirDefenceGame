import * as THREE from 'three';
import * as dat from './node_modules/dat.gui/build/dat.gui.module.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const params = {
  color: '#ccc'
};

const mouse = new THREE.Vector2();

let camera;
let scene;
let renderer;
let autocontrol = true;
let shootCooldown = 2;
let prevEnemyAngle = 0;
let maxTargetDistance = 20; 
let distanceTurret;
let isPageActive = true;
const fbxModels = [];
const bullets = [];
const enemies = [];

init();

loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(3, -2, 2));
loadAndAddTurret('./public/turret.fbx', new THREE.Vector3(-3, -2, 2));

animate();

setInterval(enemy, 3000)

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    isPageActive = false;
  } else {
    isPageActive = true;
  }
});

ui();

function init() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
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
  if (!isPageActive) return
  const spawnX = 20;
  const spawnY = Math.random() * 9 - (-1);
  const enemyZ = 20;

  const enemy = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
  );
  enemy.scale.set(3, 3, 3);

  enemy.position.set(spawnX, spawnY, enemyZ);

  const enemySpeed = 0.1;
  enemy.velocity = new THREE.Vector3(-enemySpeed, 0, 0);

  enemies.push(enemy);
  scene.add(enemy);
}

function fire(event) {
  if (!autocontrol) return;
  fbxModels.forEach(item => {
    // Змініть геометрію кульки на продовжену форму (наприклад, циліндр)
    const bullet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16), // Змініть розміри та геометрію
      new THREE.MeshLambertMaterial({ emissive: '#ff0000', emissiveIntensity: 14 }) // Додайте підсвічування
    );

    bullet.rotation.x = Math.PI / 2.2;

    const bulletPosition = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(item.quaternion)
      .add(item.position);
    bullet.position.copy(bulletPosition);

    const mouseDirection = new THREE.Vector3(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
      -item.position.z
    );

    mouseDirection.unproject(camera);
    mouseDirection.sub(camera.position).normalize();

    const bulletSpeed = 0.1;
    bullet.velocity = mouseDirection.clone().multiplyScalar(bulletSpeed);

    bullets.push(bullet);
    scene.add(bullet);
  });
}


function ui() {
  const gui = new dat.GUI();

  const customButton = document.createElement('button');
  customButton.textContent = 'Enable autocontrol'
  customButton.addEventListener('click', function () {
    autocontrol = !autocontrol;
    customButton.textContent = autocontrol ? 'Enable autocontrol' : 'Disable autocontrol'
  });

  gui.domElement.appendChild(customButton);

  customButton.style = `
    color: white;
    background-color: blue;
    border: none;
    padding: 10px;
    cursor: pointer
  `

  distanceTurret = document.createElement('div')
  distanceTurret.textContent = `Curret turret distance - ${maxTargetDistance}`

  distanceTurret.style = `
    color: black;
  `

  gui.domElement.appendChild(distanceTurret)

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

  if (autocontrol) {
    const mousePosition = new THREE.Vector3(mouse.x, mouse.y, -1);
    mousePosition.unproject(camera);
    const direction = mousePosition.sub(camera.position).normalize();

    fbxModels.forEach(item => {
      const rotationSpeed = 0.1;
      
      const angleToMouse = Math.atan2(direction.x, direction.z);

      let angleDiff = angleToMouse - item.rotation.y;

      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      item.rotation.y += angleDiff * rotationSpeed;
    });
  }
}


function removeEnemy(enemy) {
  const index = enemies.indexOf(enemy);
  if (index !== -1) {
    maxTargetDistance += 0.5
    distanceTurret.textContent = `Current turret distance - ${maxTargetDistance}`;
    scene.remove(enemy);
    enemies.splice(index, 1);
  }
}

function updateTurrets() {
  fbxModels.forEach(turret => {
    if (!autocontrol) {
      const target = findTargetInRange(turret.position);
      
      if (target) {
        const direction = new THREE.Vector3()
          .subVectors(target.position, turret.position)
          .normalize();

        const currentEnemyAngle = Math.atan2(direction.x, direction.z);

        const smoothAngle =
          prevEnemyAngle + 0.2 * (currentEnemyAngle - prevEnemyAngle);

        turret.lookAt(
          turret.position
            .clone()
            .add(
              new THREE.Vector3(Math.sin(smoothAngle), 0, Math.cos(smoothAngle))
            )
        );

        prevEnemyAngle = smoothAngle;
      }
    }
  });
}


function animate() {
  requestAnimationFrame(animate);

  updateTurrets();

  renderer.render(scene, camera);

  shootCooldown -= 1 / 60;

  if (!autocontrol && shootCooldown <= 0) {
    fbxModels.forEach(turret => {
      const target = findTargetInRange(turret.position);

      if (target) {
        const direction = new THREE.Vector3()
          .subVectors(target.position, turret.position)
          .normalize();

        const bullet = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: '#ff0000' })
        );

        bullet.velocity = direction.clone().multiplyScalar(2);
        bullet.position.copy(turret.position.clone());
        bullets.push(bullet);
        scene.add(bullet);

        shootCooldown = 1;
      }
    });
  }

  bullets.forEach((bullet, bulletIndex) => {
    bullet.position.add(bullet.velocity);

    enemies.forEach((enemy, enemyIndex) => {
      const distance = bullet.position.distanceTo(enemy.position);

      if (distance >= 1) {
        return;
      }
      scene.remove(bullet);
      bullets.splice(bulletIndex, 1);
      removeEnemy(enemy);
    });
  });

  enemies.forEach(enemy => {
    enemy.position.add(enemy.velocity);
  });
}

function findTargetInRange(turretPosition) {
  for (const enemy of enemies) {
    const distance = enemy.position.distanceTo(turretPosition);
    if (distance <= maxTargetDistance) {
      return enemy;
    }
  }
  return null;
}





