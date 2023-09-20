import * as CANNON from 'cannon-es'

export default function updateTargetPosition(enemies) {
    enemies.forEach(enemy => {
      const targetSpeed = 0.04;
      const enemyBody = enemy.body;
  
      const currentPosition = enemyBody.position;
  
      const forwardDirection = new CANNON.Vec3(-100, 0, 0); // ������ �������� �� ��������
  
      const velocity = forwardDirection.scale(targetSpeed);
  
      enemyBody.velocity.copy(velocity);
  
      enemy.mesh.position.copy(currentPosition);
    });
  }
  