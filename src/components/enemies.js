import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export default function createEnemy(position, world, scene, enemies) {
  const targetShape = new CANNON.Sphere(0.1);
  const targetBody = new CANNON.Body({
    mass: 200,
    shape: targetShape,
    position
  });

  world.addBody(targetBody);

  const targetGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const targetMesh = new THREE.Mesh(targetGeometry, targetMaterial);
  scene.add(targetMesh);

  const randomizeYPosition = () => {
    let randomY;
    do {
      randomY = Math.random() * 12 + -1;
    } while (randomY < 3);
    animatePositionChange(targetBody, targetMesh, randomY);
  };

  const animatePositionChange = (body, mesh, newY) => {
    const currentPosition = body.position.y;
    const targetPosition = newY;

    const animationDuration = 2000; // Довжина анімації в мілісекундах
    const startTime = Date.now();

    function animate() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = elapsed / animationDuration;

      if (progress < 1) {
        const newYPosition =
          currentPosition + (targetPosition - currentPosition) * progress;
        body.position.y = newYPosition;
        mesh.position.y = newYPosition;
        requestAnimationFrame(animate);
      } else {
        body.position.y = targetPosition;
        mesh.position.y = targetPosition;
      }
    }

    requestAnimationFrame(animate);
  };

  const randomizeYPositionInterval = () => {
    randomizeYPosition();
    const interval = Math.random() * 2000 + 3000;
    setTimeout(randomizeYPositionInterval, interval);
  };

  randomizeYPositionInterval();

  targetBody.velocity = new CANNON.Vec3(-10, 0, 0);
  targetMesh.position.copy(position);

  targetBody.addEventListener('collide', function (event) {
    console.log(event.body);
  });

  enemies.push({ body: targetBody, mesh: targetMesh });
}
