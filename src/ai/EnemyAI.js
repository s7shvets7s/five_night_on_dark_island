/**
 * EnemyAI — FNAF-style AI with state machine.
 * Handles patrol, approach, return, attack logic.
 */
import { ENEMY_STATES, ENEMY_CONFIG, MASK_REACTION } from '../config/enemyConfig.js';

export class EnemyAI {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
  }

  /**
   * Main update — processes enemy state machine.
   * @param {Enemy} enemy
   * @param {number} dt - Delta time in ms
   * @param {Object} officeSystem
   * @param {boolean} [maskActive]
   * @returns {string|null} Result: 'moved'|'returned'|'blocked'|'attacked'|null
   */
  update(enemy, dt, officeSystem, maskActive = false) {
    if (enemy.isDefeated) return null;

    const config = ENEMY_CONFIG[enemy.id];
    enemy.updateCooldown(dt);

    if (enemy.isMoving && enemy.moveTimer > 500) {
      enemy.completeMove();
    }

    if (enemy.isMoving) return null;

    const state = enemy.state;

    switch (state) {
      case ENEMY_STATES.PATROL:
        return this._updatePatrol(enemy, config, dt);

      case ENEMY_STATES.APPROACH:
        return this._updateApproach(enemy, config, dt);

      case ENEMY_STATES.AT_DOOR:
        return this._updateAtDoor(enemy, config, dt, officeSystem, maskActive);

      case ENEMY_STATES.RETURNING:
        return this._updateReturning(enemy, config, dt);

      default:
        return null;
    }
  }

  /**
   * PATROL: Random movement back and forth on path.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updatePatrol(enemy, config, dt) {
    enemy.tickMoveTimer(dt);

    const baseInterval = config.moveIntervalMs;
    const variance = config.moveVariance;
    const interval = baseInterval + Math.random() * variance;

    if (enemy.moveTimer < interval) return null;

    enemy.resetMoveTimer();

    const aggressionFactor = config.aggression / 20;
    const moveChance = 0.3 + aggressionFactor * 0.5;

    if (Math.random() > moveChance) return null;

    const direction = this._chooseDirection(enemy, config);

    if (direction === 'forward') {
      const moved = enemy.moveForward();
      if (moved) {
        const newIndex = enemy.pathIndex;
        const totalPath = enemy.pathLength;

        if (newIndex >= totalPath - 2) {
          enemy.setState(ENEMY_STATES.AT_DOOR);
        } else if (newIndex >= 2 && Math.random() < 0.3) {
          enemy.setState(ENEMY_STATES.APPROACH);
        }

        this._emitMove(enemy);
        return 'moved';
      }
    } else {
      const moved = enemy.moveBackward();
      if (moved) {
        this._emitMove(enemy);
        return 'returned';
      }
    }

    return null;
  }

  /**
   * APPROACH: Aggressive forward movement.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updateApproach(enemy, config, dt) {
    enemy.tickMoveTimer(dt);

    const baseInterval = config.moveIntervalMs;
    const variance = config.moveVariance;
    const interval = baseInterval + Math.random() * variance;

    if (enemy.moveTimer < interval) return null;

    enemy.resetMoveTimer();

    const aggressionFactor = config.aggression / 20;
    const moveChance = 0.5 + aggressionFactor * 0.5;

    if (Math.random() > moveChance) {
      enemy.setState(ENEMY_STATES.PATROL);
      return null;
    }

    if (enemy.moveForward()) {
      const newIndex = enemy.pathIndex;
      const totalPath = enemy.pathLength;

      if (newIndex >= totalPath - 2) {
        enemy.setState(ENEMY_STATES.AT_DOOR);
      }

      this._emitMove(enemy);
      return 'moved';
    }

    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * AT_DOOR: Enemy at door, may attack.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {Object} officeSystem
   * @param {boolean} maskActive
   * @returns {string|null}
   */
  _updateAtDoor(enemy, config, dt, officeSystem, maskActive) {
    enemy.tickMoveTimer(dt);

    const attackChance = 0.3 + (config.aggression / 20) * 0.3;

    if (Math.random() < attackChance) {
      return this._attemptAttack(enemy, config, officeSystem, maskActive);
    }

    if (config.canReturnOnLight) {
      const lightOn = enemy.doorSide === 'left'
        ? officeSystem.leftLightOn
        : officeSystem.rightLightOn;

      if (lightOn) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'returned';
      }
    }

    if (config.canReturnOnDoor) {
      const doorClosed = enemy.doorSide === 'left'
        ? !officeSystem.leftDoorOpen
        : !officeSystem.rightDoorOpen;

      if (doorClosed && Math.random() < config.returnChance) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'returned';
      }
    }

    return null;
  }

  /**
   * RETURNING: Moving backward to base.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updateReturning(enemy, config, dt) {
    enemy.tickMoveTimer(dt);

    const returnSpeed = config.moveIntervalMs * 0.5;
    const variance = config.moveVariance * 0.3;
    const interval = returnSpeed + Math.random() * variance;

    if (enemy.moveTimer < interval) return null;

    enemy.resetMoveTimer();

    if (enemy.moveBackward()) {
      this._emitMove(enemy);

      if (enemy.isAtBase()) {
        enemy.setState(ENEMY_STATES.PATROL);
      }

      return 'returned';
    }

    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * Choose movement direction for patrol.
   * @param {Enemy} enemy
   * @param {Object} config
   * @returns {'forward'|'backward'}
   */
  _chooseDirection(enemy, config) {
    const index = enemy.pathIndex;
    const totalPath = enemy.pathLength;

    if (index <= 0) {
      return 'forward';
    }
    if (index >= totalPath - 1) {
      return 'backward';
    }

    return Math.random() < 0.5 ? 'forward' : 'backward';
  }

  /**
   * Attempt attack from door.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {Object} officeSystem
   * @param {boolean} maskActive
   * @returns {string|null}
   */
  _attemptAttack(enemy, config, officeSystem, maskActive) {
    const doorClosed = enemy.doorSide === 'left'
      ? !officeSystem.leftDoorOpen
      : !officeSystem.rightDoorOpen;

    if (doorClosed) {
      if (config.canReturnOnDoor) {
        enemy.tryReturn(true);
        return 'blocked';
      }
      return 'blocked';
    }

    if (maskActive) {
      const reaction = config.maskReaction;
      if (reaction === MASK_REACTION.FEAR) {
        enemy.tryReturn(true);
        return 'blocked';
      } else if (reaction === MASK_REACTION.STAND) {
        return 'blocked';
      }
      // IGNORE -> attack!
    }

    enemy.setState(ENEMY_STATES.ATTACK);
    return 'attacked';
  }

  /**
   * Emit move event.
   * @param {Enemy} enemy
   */
  _emitMove(enemy) {
    this._eventBus.emit('enemy:move', {
      enemyId: enemy.id,
      room: enemy.currentRoom,
      state: enemy.state,
    });
  }

  /**
   * Emit return event.
   * @param {Enemy} enemy
   */
  _emitReturn(enemy) {
    this._eventBus.emit('enemy:return', {
      enemyId: enemy.id,
      from: enemy.currentRoom,
    });
  }
}