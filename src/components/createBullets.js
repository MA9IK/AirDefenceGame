import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default function createBullet(turret, initialVelocity, world, scene) {
  const bulletBody = new CANNON.Body({
    mass: 0.1,
    shape: new CANNON.Sphere(0.5) // Розмір пулі
  });

  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Колір пулі
  );

  // Перетворення позиції turret в систему координат Cannon.js
  const cannonPosition = new CANNON.Vec3(
    turret.position.x,
    turret.position.y,
    turret.position.z
  );

  // Задаємо початкову позицію bulletBody
  bulletBody.position.copy(cannonPosition);

  bulletMesh.position.copy(turret.position);
  bulletMesh.quaternion.copy(turret.quaternion);

  // Задаємо початкову швидкість пулі
  bulletBody.velocity.set(
    initialVelocity.x,
    initialVelocity.y,
    initialVelocity.z
  );

  bulletBody.addEventListener('collide', () => {
    scene.remove(bulletMesh);
    world.removeBody(bulletBody);
  });

  world.addBody(bulletBody);
  return { body: bulletBody, mesh: bulletMesh };
}
