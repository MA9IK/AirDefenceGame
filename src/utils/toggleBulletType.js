export default function toggleBulletType(
  currentBulletType,
  BulletTypes,
  changeTurretTypes,
  changeTypeBullets,
  currentBullet
) {
  currentBulletType =
    currentBulletType === BulletTypes.STANDARD
      ? BulletTypes.HOMING
      : BulletTypes.STANDARD;



  // Îíîâëþºìî òåêñò êíîïêè
  changeTurretTypes.textContent = `Turret type - ${currentBulletType}`;
  currentBullet = currentBulletType;
  changeTypeBullets.textContent = `Now type bullets - ${currentBulletType}`;

}
