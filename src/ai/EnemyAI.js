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

    // Handle IN_TRANSIT state first — enemy is invisible during transit
    if (enemy.state === ENEMY_STATES.IN_TRANSIT) {
      return this._updateInTransit(enemy, config, dt);
    }

    // RETURNING with transit in progress — must tick timer to complete transit
    if (enemy.state === ENEMY_STATES.RETURNING && enemy.isMoving) {
      return this._updateReturning(enemy, config, dt);
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

    // If enemy reached the last room on path (door room), transition to AT_DOOR
    // This prevents enemy from endlessly patrolling at the door room
    if (enemy.pathIndex >= enemy.pathLength - 1) {
      enemy.resetMoveTimer(); // Reset timer so AT_DOOR delay starts fresh
      enemy.setState(ENEMY_STATES.AT_DOOR);
      return 'moved';
    }

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
      const transitTime = config.transitTimeMs * (0.8 + Math.random() * 0.4); // ±20% variance
      const started = enemy.startTransitForward(transitTime);
      if (started) {
        enemy.setState(ENEMY_STATES.IN_TRANSIT);
        this._emitMove(enemy);
        return 'moved';
      }
    } else {
      const transitTime = config.transitTimeMs * (0.8 + Math.random() * 0.4);
      const started = enemy.startTransitBackward(transitTime);
      if (started) {
        enemy.setState(ENEMY_STATES.IN_TRANSIT);
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

    const transitTime = config.transitTimeMs * (0.8 + Math.random() * 0.4);
    if (enemy.startTransitForward(transitTime)) {
      enemy.setState(ENEMY_STATES.IN_TRANSIT);
      this._emitMove(enemy);
      return 'moved';
    }

    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * AT_DOOR: Enemy at door, may attack.
   * FNAF-style: enemy waits minimum time before checking attack,
   * reacts to light/door/mask in priority order.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {Object} officeSystem
   * @param {boolean} maskActive
   * @returns {string|null}
   */
  _updateAtDoor(enemy, config, dt, officeSystem, maskActive) {
    enemy.tickMoveTimer(dt);

    // 1. Enemy must stay at door for minimum time before any check
    // This prevents instant attacks — gives player time to react
    const minDoorTime = config.moveIntervalMs + config.moveVariance * 0.5;
    if (enemy.moveTimer < minDoorTime) return null;

    enemy.resetMoveTimer();

    // 2. LIGHT check first (if enemy fears light)
    // Player can actively repel enemy by turning on light
    if (config.canReturnOnLight) {
      const lightOn = enemy.doorSide === 'left'
        ? officeSystem.leftLightOn
        : officeSystem.rightLightOn;

      if (lightOn && Math.random() < config.returnChance) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'returned';
      }
    }

    // 3. DOOR check (if enemy retreats from closed doors)
    if (config.canReturnOnDoor) {
      const doorClosed = enemy.doorSide === 'left'
        ? !officeSystem.leftDoorOpen
        : !officeSystem.rightDoorOpen;

      if (doorClosed && Math.random() < config.returnChance) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'blocked';
      }
    }

    // 4. MASK reaction — 4 types of behavior per enemy
    if (maskActive) {
      const reaction = config.maskReaction;

      if (reaction === MASK_REACTION.FEAR) {
        // Enemy fears mask — runs away immediately
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'blocked';
      }

      if (reaction === MASK_REACTION.STAND) {
        // Enemy stands still — doesn't attack, doesn't leave
        // Player must wait out mask cooldown
        return null;
      }

      if (reaction === MASK_REACTION.ATTACK_ON_MASK) {
        // Enemy becomes MORE aggressive when seeing mask
        // High attack chance — mask is DANGEROUS for this enemy
        const attackOnMaskChance = 0.7 + (config.aggression / 20) * 0.3;
        if (Math.random() < attackOnMaskChance) {
          enemy.setState(ENEMY_STATES.ATTACK);
          return 'attacked';
        }
        // If not attacked this tick, will check again next cycle
        return null;
      }

      // IGNORE → mask doesn't affect this enemy, continue to attack check
    }

    // 5. Normal attack check (checked once per minDoorTime cycle)
    const attackChance = 0.3 + (config.aggression / 20) * 0.3;
    if (Math.random() < attackChance) {
      enemy.setState(ENEMY_STATES.ATTACK);
      return 'attacked';
    }

    // 6. Periodic voluntary leave (even with open door)
    // Creates natural pacing — enemies don't camp forever
    if (Math.random() < config.returnChance * 0.3) {
      enemy.tryReturn(false);
      this._emitReturn(enemy);
      return 'returned';
    }

    // Enemy continues waiting at door
    return null;
  }

  /**
   * IN_TRANSIT: Enemy is moving between rooms — invisible to cameras.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updateInTransit(enemy, config, dt) {
    const completed = enemy.updateTransit(dt);

    if (!completed) return null;

    // Transit completed — enemy arrives at new room
    const totalPath = enemy.pathLength;
    const newIndex = enemy.pathIndex;

    if (enemy.state === ENEMY_STATES.RETURNING) {
      // Was returninging — check if reached base
      if (enemy.isAtBase()) {
        enemy.setState(ENEMY_STATES.PATROL);
      }
      return 'returned';
    }

    // Check if approaching door
    if (newIndex >= totalPath - 1) {
      enemy.setState(ENEMY_STATES.AT_DOOR);
      return 'moved';
    }

    // Continue patrolling or switch to approach
    if (newIndex >= 2 && Math.random() < 0.3) {
      enemy.setState(ENEMY_STATES.APPROACH);
    } else {
      enemy.setState(ENEMY_STATES.PATROL);
    }

    this._emitArrive(enemy);
    return 'moved';
  }

  /**
   * RETURNING: Moving backward to base.
   * Waits for current transit to finish, then steps back one room at a time.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updateReturning(enemy, config, dt) {
    // Transit is in progress — tick the timer so it completes
    if (enemy.isMoving) {
      const completed = enemy.updateTransit(dt);
      if (!completed) return null;

      // Transit completed — check if reached base
      if (enemy.isAtBase()) {
        enemy.setState(ENEMY_STATES.PATROL);
        enemy.resetMoveTimer();
        return 'returned';
      }

      // Not at base yet — continue returning next cycle
      return 'returned';
    }

    // Transit completed — check if reached base
    if (enemy.isAtBase()) {
      enemy.setState(ENEMY_STATES.PATROL);
      enemy.resetMoveTimer();
      return null;
    }

    // Continue returning — start next step back
    if (enemy.pathIndex > 0) {
      const transitTime = config.transitTimeMs * 0.6; // Faster return
      enemy.startTransitBackward(transitTime);
      this._emitReturn(enemy);
      return 'returned';
    }

    // Already at start of path but not at base — fallback
    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * Choose movement direction for patrol.
   * Biased toward forward (70%) to create pressure on the player.
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

    // 70% forward, 30% backward — creates steady pressure
    return Math.random() < 0.7 ? 'forward' : 'backward';
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

  /**
   * Emit arrive event (transit completed).
   * @param {Enemy} enemy
   */
  _emitArrive(enemy) {
    this._eventBus.emit('enemy:arrive', {
      enemyId: enemy.id,
      room: enemy.currentRoom,
      state: enemy.state,
    });
  }
}