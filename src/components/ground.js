import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default function ground(scene, world) {
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(14, 0, 0),
    -Math.PI / 2
  );
  groundBody.position.y = -1.6;
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  // world.addBody(groundBody);

  const loader = new FBXLoader();
  loader.load('./ground.fbx', fbx => {
    fbx.scale.set(1, 3, 1); // Масштаб моделі за потребою
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    scene.add(fbx);
  });
}
