import * as THREE from 'three';

export default function sun(scene) {
  const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Жовтий колір
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  sunMesh.position.set(0, 50, -20); // Приклад позиції сонця
  scene.add(sunMesh);

  const sunlight = new THREE.DirectionalLight(0xffffff, 1); // Біле світло з інтенсивністю 1
  sunlight.position.copy(sunMesh.position); // Позиція світла співпадає з позицією сонця
  scene.add(sunlight);

  sunlight.color.set('#fff'); // Змініть колір світла
  sunlight.intensity = 2; // Змініть інтенсивність світла

  // sunlight.castShadow = true; // Увімкнути генерацію тіней від сонця

  // Налаштування параметрів тіней для об'єктів, які кидають тіні
  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.mapSize.height = 1024;
}
