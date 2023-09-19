import * as THREE from 'three';

export default function sun(scene) {
  const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // ������ ����
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);

  sunMesh.position.set(0, 50, -20); // ������� ������� �����
  scene.add(sunMesh);

  const sunlight = new THREE.DirectionalLight(0xffffff, 1); // ���� ����� � ������������ 1
  sunlight.position.copy(sunMesh.position); // ������� ����� ������� � �������� �����
  scene.add(sunlight);

  sunlight.color.set('#fff'); // ����� ���� �����
  sunlight.intensity = 2; // ����� ������������ �����

  // sunlight.castShadow = true; // �������� ��������� ���� �� �����

  // ������������ ��������� ���� ��� ��'����, �� ������� ��
  sunlight.shadow.mapSize.width = 1024;
  sunlight.shadow.mapSize.height = 1024;
}
