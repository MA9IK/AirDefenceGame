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
  const raycaster = new THREE.Raycaster()
  if (currentBulletType !== BulletTypes.STANDARD) return;
  const turret = fbxModels[0]; // ������� ������� �������
  const muzzleVelocity = 50; // adjust speed bullet

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
  
  const bullet = createBullet(turret, initialVelocity, world);
  bullets.push({ basic: bullet });
  scene.add(bullet.mesh);
}
