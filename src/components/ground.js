import * as CANNON from 'cannon-es';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export default function ground(scene, world) {
  const loader = new FBXLoader();
  loader.load('./ground.fbx', fbx => {
    const geometry = fbx.children[0].geometry; // ��������� �������� ����� ������ �����
    // ��������� ������� �� ���� � �������
    const vertices = geometry.attributes.position.array;
    const indices = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      indices.push(i);
    }
    // ������� ��� ��� ����� ������
    const groundBody = new CANNON.Body({ mass: 0 });
    const shape = new CANNON.Trimesh(vertices, indices);
    groundBody.addShape(shape);
    // ��������� ������� �� �������� ���
    groundBody.position.set(0, -1.5, 0);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    fbx.scale.set(1, 5, 1); // ������� ����� �� ��������
    fbx.rotation.set(0, 20.4, 0);
    fbx.position.set(0, -1.5, 500);
    // ������� ��� �� ���� Cannon.js
    world.addBody(groundBody);

    groundBody.addEventListener('collide', function (event) {
      console.log(event.body);
    });

    // ������� ������ �� �����
    scene.add(fbx);
  });
}
