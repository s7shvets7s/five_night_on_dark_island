/**
 * EnemyAI — FNAF-style AI with graph-based wandering.
 * Enemies choose random rooms via connections, can attack any door.
 */
import { ENEMY_STATES, ENEMY_CONFIG, MASK_REACTION } from '../config/enemyConfig.js';
import { ROOM_MAP } from '../data/rooms.js';

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
   * PATROL: Random movement through the room graph.
   * Enemy picks a random connected room and moves there.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updatePatrol(enemy, config, dt) {
    enemy.tickMoveTimer(dt);

    // If enemy is at a door room, transition to AT_DOOR to wait and possibly attack
    if (enemy.isAtDoor()) {
      enemy.resetMoveTimer();
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

    // Choose a random connected room (avoid going back immediately)
    const currentRoom = enemy.currentRoom;
    const room = ROOM_MAP[currentRoom];
    if (!room || !room.connections || room.connections.length === 0) {
      // No connections — force return to base
      enemy.setState(ENEMY_STATES.RETURNING);
      return 'returned';
    }

    const connections = room.connections;
    let targetRoom = this._chooseNextRoom(connections, currentRoom, enemy.previousRoom);

    const transitTime = config.transitTimeMs * (0.8 + Math.random() * 0.4);
    if (enemy.startTransitTo(targetRoom, transitTime)) {
      enemy.setState(ENEMY_STATES.IN_TRANSIT);
      this._emitMove(enemy);
      return 'moved';
    }

    return null;
  }

  /**
   * APPROACH: Aggressive movement toward a chosen door.
   * Enemy picks a door target and tries to move toward it.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {number} dt
   * @returns {string|null}
   */
  _updateApproach(enemy, config, dt) {
    enemy.tickMoveTimer(dt);

    // If already at the target door, switch to AT_DOOR
    if (enemy.currentRoom === enemy.targetDoor && enemy.isAtDoor()) {
      enemy.setState(ENEMY_STATES.AT_DOOR);
      return 'moved';
    }

    const baseInterval = config.moveIntervalMs;
    const variance = config.moveVariance;
    const interval = baseInterval + Math.random() * variance;

    if (enemy.moveTimer < interval) return null;

    enemy.resetMoveTimer();

    const aggressionFactor = config.aggression / 20;
    const moveChance = 0.5 + aggressionFactor * 0.5;

    if (Math.random() > moveChance) {
      // Lost interest — go back to patrolling
      enemy.setState(ENEMY_STATES.PATROL);
      return null;
    }

    // Find the best next room toward the target door (BFS shortest path step)
    const targetDoor = enemy.targetDoor || enemy.chooseTargetDoor();
    const nextRoom = this._findPathStep(enemy.currentRoom, targetDoor);

    if (!nextRoom) {
      // No path found — wander randomly
      enemy.setState(ENEMY_STATES.PATROL);
      return null;
    }

    const transitTime = config.transitTimeMs * (0.8 + Math.random() * 0.4);
    if (enemy.startTransitTo(nextRoom, transitTime)) {
      enemy.setState(ENEMY_STATES.IN_TRANSIT);
      this._emitMove(enemy);
      return 'moved';
    }

    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * AT_DOOR: Enemy at door, may attack.
   * Light/door/mask checks work IMMEDIATELY with accumulated exposure.
   * Attack check is delayed — gives player time to react.
   * @param {Enemy} enemy
   * @param {Object} config
   * @param {Object} officeSystem
   * @param {boolean} maskActive
   * @returns {string|null}
   */
  _updateAtDoor(enemy, config, dt, officeSystem, maskActive) {
    enemy.tickMoveTimer(dt);

    // ==================== IMMEDIATE CHECKS ====================
    // These work from the moment enemy arrives at door — player can react immediately

    // 1. LIGHT check — accumulates exposure over time
    if (config.canReturnOnLight) {
      const lightOn = enemy.doorSide === 'left'
        ? officeSystem.leftLightOn
        : officeSystem.rightLightOn;

      enemy.tickLightExposure(dt, lightOn);

      if (enemy.lightExposure >= config.lightExposureNeeded && Math.random() < config.returnChance) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'returned';
      }
    }

    // 2. DOOR check — accumulates exposure over time
    if (config.canReturnOnDoor) {
      const doorClosed = enemy.doorSide === 'left'
        ? !officeSystem.leftDoorOpen
        : !officeSystem.rightDoorOpen;

      enemy.tickDoorExposure(dt, doorClosed);

      if (enemy.doorExposure >= config.doorExposureNeeded && Math.random() < config.returnChance) {
        enemy.tryReturn(true);
        this._emitReturn(enemy);
        return 'blocked';
      }
    }

    // 3. MASK reaction — accumulates exposure over time
    if (maskActive) {
      const reaction = config.maskReaction;

      if (reaction === MASK_REACTION.FEAR) {
        enemy.tickMaskExposure(dt, true);
        if (enemy.maskExposure >= config.maskExposureNeeded) {
          enemy.tryReturn(true);
          this._emitReturn(enemy);
          return 'blocked';
        }
      }

      if (reaction === MASK_REACTION.STAND) {
        // Enemy stands still — doesn't attack, doesn't leave
        return null;
      }

      if (reaction === MASK_REACTION.ATTACK_ON_MASK) {
        enemy.tickMaskExposure(dt, true);
        if (enemy.maskExposure >= config.maskExposureNeeded) {
          const attackOnMaskChance = 0.7 + (config.aggression / 20) * 0.3;
          if (Math.random() < attackOnMaskChance) {
            enemy.setState(ENEMY_STATES.ATTACK);
            return 'attacked';
          }
        }
        return null;
      }

      // IGNORE → mask doesn't affect this enemy, continue to attack check
    }

    // ==================== DELAYED CHECKS ====================
    // Attack and voluntary leave — only after minimum door time

    const minDoorTime = config.moveIntervalMs + config.moveVariance * 0.5;
    if (enemy.moveTimer < minDoorTime) return null;

    enemy.resetMoveTimer();

    // 4. Normal attack check (checked once per minDoorTime cycle)
    const attackChance = 0.3 + (config.aggression / 20) * 0.3;
    if (Math.random() < attackChance) {
      enemy.setState(ENEMY_STATES.ATTACK);
      return 'attacked';
    }

    // 5. Periodic voluntary leave (even with open door)
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

    // Transit completed — reset exposure timers and randomize camera position
    enemy.resetExposures();
    enemy.randomizeCameraX();

    if (enemy.state === ENEMY_STATES.RETURNING) {
      if (enemy.isAtBase()) {
        enemy.setState(ENEMY_STATES.PATROL);
      }
      return 'returned';
    }

    // Check if approaching a door room
    if (enemy.isAtDoor()) {
      enemy.setState(ENEMY_STATES.AT_DOOR);
      return 'moved';
    }

    // Continue patrolling or switch to approach
    if (Math.random() < 0.3) {
      enemy.chooseTargetDoor();
      enemy.setState(ENEMY_STATES.APPROACH);
    } else {
      enemy.setState(ENEMY_STATES.PATROL);
    }

    this._emitArrive(enemy);
    return 'moved';
  }

  /**
   * RETURNING: Moving backward to base room.
   * Uses BFS to find path back, moves one step at a time.
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
        enemy.resetExposures();
        enemy.setState(ENEMY_STATES.PATROL);
        enemy.resetMoveTimer();
        return 'returned';
      }

      return 'returned';
    }

    // Transit completed — check if reached base
    if (enemy.isAtBase()) {
      enemy.resetExposures();
      enemy.setState(ENEMY_STATES.PATROL);
      enemy.resetMoveTimer();
      return null;
    }

    // Continue returning — find next step toward base
    const nextRoom = this._findPathStep(enemy.currentRoom, enemy.baseRoom || ENEMY_CONFIG[enemy.id].baseRoom);

    if (nextRoom) {
      const transitTime = config.transitTimeMs * 0.6; // Faster return
      enemy.startTransitTo(nextRoom, transitTime);
      this._emitReturn(enemy);
      return 'returned';
    }

    // No path found — fallback to patrol
    enemy.setState(ENEMY_STATES.PATROL);
    return null;
  }

  /**
   * Choose next room for patrol.
   * Prefers rooms not recently visited, avoids going back immediately.
   * @param {string[]} connections - Room connection IDs
   * @param {string} currentRoom - Current room ID
   * @param {string|null} previousRoom - Previous room ID
   * @returns {string}
   */
  _chooseNextRoom(connections, currentRoom, previousRoom) {
    // Filter out previous room to avoid immediate backtracking (unless it's the only option)
    let options = connections.filter(r => r !== previousRoom);
    if (options.length === 0) {
      options = connections;
    }

    // Weight door rooms slightly less (don't rush to doors every time)
    const doorRooms = ['dock', 'generator'];
    const nonDoorOptions = options.filter(r => !doorRooms.includes(r));

    // 70% chance to pick non-door room (wandering), 30% door room (pressure)
    if (nonDoorOptions.length > 0 && Math.random() < 0.7) {
      return nonDoorOptions[Math.floor(Math.random() * nonDoorOptions.length)];
    }

    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Find one step of the shortest path from current to target (BFS).
   * @param {string} fromRoom - Starting room ID
   * @param {string} toRoom - Target room ID
   * @returns {string|null} Next room ID, or null if no path
   */
  _findPathStep(fromRoom, toRoom) {
    if (fromRoom === toRoom) return toRoom;

    const visited = new Set();
    const queue = [{ roomId: fromRoom, path: [] }];
    visited.add(fromRoom);

    while (queue.length > 0) {
      const { roomId, path } = queue.shift();
      const room = ROOM_MAP[roomId];
      if (!room || !room.connections) continue;

      for (const next of room.connections) {
        if (visited.has(next)) continue;
        visited.add(next);

        const newPath = [...path, next];
        if (next === toRoom) {
          return newPath[0]; // First step toward target
        }

        queue.push({ roomId: next, path: newPath });
      }
    }

    return null; // No path found
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
