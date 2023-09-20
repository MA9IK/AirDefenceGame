import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default function createBullet(turret, initialVelocity, world, scene) {
  const bulletBody = new CANNON.Body({
    mass: 0.1,
    shape: new CANNON.Sphere(0.5) // ����� ���
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

  bulletBody.addEventListener('collide', () => {
    scene.remove(bulletMesh);
    world.removeBody(bulletBody);
  });

  world.addBody(bulletBody);
  return { body: bulletBody, mesh: bulletMesh };
}
