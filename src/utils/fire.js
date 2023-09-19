import createBullet from '../components/createBullets';
import * as THREE from 'three';

export default function fire(
  event,
  scene,
  world,
  fbxModels,
  currentBulletType,
  BulletTypes,
  bullets,
  mouse,
  camera
) {
  console.log(BulletTypes);
  if (currentBulletType !== BulletTypes.STANDARD) return;
  const turret = fbxModels[0]; // Виберіть потрібну гармату
  const muzzleVelocity = 50; // Початкова швидкість пулі

  const mouseDirection = new THREE.Vector3(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    -turret.position.z
  );
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  mouseDirection.unproject(camera);

  const direction = mouseDirection.sub(camera.position).normalize();
  const initialVelocity = direction.clone().multiplyScalar(muzzleVelocity);

  const bullet = createBullet(turret, initialVelocity, world);
  bullets.push({ basic: bullet });
  scene.add(bullet.mesh);
}
