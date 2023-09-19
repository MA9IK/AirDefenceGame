export default function toggleBulletType(
  currentBulletType,
  changeTurretTypes,
  changeTypeBullets,
  BulletTypes
) {
  currentBulletType =
    currentBulletType === BulletTypes.STANDARD
      ? BulletTypes.HOMING
      : BulletTypes.STANDARD;

  // Оновлюємо текст кнопки
  changeTurretTypes.textContent = `Turret type - ${currentBulletType}`;
  currentBulletType = currentBulletType;
  changeTypeBullets.textContent = `Now type bullets - ${currentBulletType}`;
}
