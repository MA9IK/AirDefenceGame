import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default function ground(scene, world) {
  const loader = new FBXLoader();
  loader.load('./ground.fbx', fbx => {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape
    });
    groundBody.position.set(0, -2, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    fbx.scale.set(1, 5, 1); // ������� ����� �� ��������
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    // ������� ��� �� ���� Cannon.js
    world.addBody(groundBody);

    // ������� ������ �� �����
    scene.add(fbx);
  });
}
