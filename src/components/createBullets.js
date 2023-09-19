import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default function createBullet(turret, initialVelocity, world) {
  const bulletBody = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(0.05) // Розмір пулі
  });

  const bulletMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshBasicMaterial({ color: 0xff0000 }) // Колір пулі
  );

  bulletMesh.position.copy(turret.position);
  bulletMesh.quaternion.copy(turret.quaternion);
  bulletBody.position.copy(turret.position);
  bulletBody.quaternion.copy(turret.quaternion);

  // Задаємо початкову швидкість пулі
  bulletBody.velocity.set(
    initialVelocity.x,
    initialVelocity.y,
    initialVelocity.z
  );

  world.addBody(bulletBody);
  return { body: bulletBody, mesh: bulletMesh };
}
