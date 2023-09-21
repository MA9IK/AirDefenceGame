import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default function ground(scene, world) {
  const loader = new FBXLoader();
  loader.load('./ground.fbx', fbx => {
    const geometry = fbx.children[0].geometry; // Отримайте геометрію першої дитини моделі
    // Отримайте вершини та грані з геометрії
    const vertices = geometry.attributes.position.array;
    const indices = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      indices.push(i);
    }
    // Створіть тіло для моделі підлоги
    const groundBody = new CANNON.Body({ mass: 0 });
    const shape = new CANNON.Trimesh(vertices, indices);
    groundBody.addShape(shape);
    // Встановіть позицію та орієнтацію тіла
    groundBody.position.set(0, -1.5, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    fbx.scale.set(1, 5, 1); // Масштаб моделі за потребою
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    // Додайте тіло до світу Cannon.js
    world.addBody(groundBody);

    groundBody.addEventListener('collide', function (event) {
      console.log(event.body);
    });

    // Додайте модель до сцени
    scene.add(fbx);
  });
}
