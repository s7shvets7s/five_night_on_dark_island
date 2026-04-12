/**
 * EnemyAI — AI behavior for enemy movement and attacks.
 * Uses aggression level and randomness to determine movement timing.
 */
export class EnemyAI {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
  }

  /**
   * Update enemy AI logic.
   * @param {Enemy} enemy - Enemy entity
   * @param {Object} enemyDef - Enemy definition from enemies.js
   * @param {number} dt - Delta time in milliseconds
   * @param {Object} officeSystem - OfficeSystem instance
   * @returns {'moved'|'attacked'|'blocked'|null}
   */
  update(enemy, enemyDef, dt, officeSystem) {
    if (enemy.isDefeated) return null;

    enemy.tickMoveTimer(dt);

    // Complete movement after a brief transition
    if (enemy.isMoving && enemy.moveTimer > 500) {
      enemy.completeMove();
    }

    if (enemy.isMoving) return null;

    // Calculate move interval based on aggression
    const aggressionFactor = enemy.aggression / 20; // 0-1
    const moveInterval = enemyDef.moveIntervalMs * (1 - aggressionFactor * 0.7)
      + Math.random() * enemyDef.moveIntervalVariance * (1 - aggressionFactor);

    if (enemy.moveTimer < moveInterval) return null;

    enemy.resetMoveTimer();

    // Check if enemy is at door
    if (enemy.isAtOfficeDoor && enemyDef.canAttackFromDoor) {
      return this._attemptAttack(enemy, enemyDef, officeSystem);
    }

    // Move towards office
    return this._moveTowardsOffice(enemy, enemyDef);
  }

  /**
   * Move enemy one step closer to office.
   * @param {Enemy} enemy
   * @param {Object} enemyDef
   * @returns {'moved'|null}
   */
  _moveTowardsOffice(enemy, enemyDef) {
    const path = enemyDef.preferredPath;
    const currentIndex = path.indexOf(enemy.currentRoom);

    if (currentIndex === -1) {
      // Enemy not on path, move to first room
      enemy.moveTo(path[0]);
      this._eventBus.emit('enemy:move', { enemyId: enemy.id, from: null, to: path[0] });
      return 'moved';
    }

    if (currentIndex >= path.length - 1) {
      return null; // Already at end of path (door)
    }

    // Aggression-based chance to move forward
    const moveChance = 0.3 + (enemy.aggression / 20) * 0.7;
    if (Math.random() > moveChance) return null;

    const nextRoom = path[currentIndex + 1];
    const from = enemy.currentRoom;
    enemy.moveTo(nextRoom);
    this._eventBus.emit('enemy:move', { enemyId: enemy.id, from, to: nextRoom });
    return 'moved';
  }

  /**
   * Attempt to attack from door.
   * @param {Enemy} enemy
   * @param {Object} enemyDef
   * @param {Object} officeSystem
   * @returns {'attacked'|'blocked'}
   */
  _attemptAttack(enemy, enemyDef, officeSystem) {
    const isLeftDoor = enemy.currentRoom === 'dock';
    const doorClosed = isLeftDoor ? !officeSystem.leftDoorOpen : !officeSystem.rightDoorOpen;

    if (doorClosed) {
      enemy.defeat();
      return 'blocked';
    }

    return 'attacked';
  }
}
