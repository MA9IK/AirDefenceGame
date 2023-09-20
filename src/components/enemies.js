import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default function createEnemy(position, world, scene, enemies) {
  const targetShape = new CANNON.Sphere(0.1); // ????? ?????? 1
  const targetBody = new CANNON.Body({
    mass: 200, // ??????? ???? ???? (? ??)
    shape: targetShape,
    position
  });

  world.addBody(targetBody);

  const targetGeometry = new THREE.SphereGeometry(0.1, 16, 16); // Graphics geometry of the enemy
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Color of the enemy
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  scene.add(targetMesh);
  // targetMesh.velocity = new THREE.Vector3(-10, 0, 0);

  targetBody.velocity = new CANNON.Vec3(-10, 0, 0);
  targetMesh.position.copy(position);

  targetBody.addEventListener('collide', function (event) {
    console.log(event.body);
  });

  enemies.push({ body: targetBody, mesh: targetMesh });
}
