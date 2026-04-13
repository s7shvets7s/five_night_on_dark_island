/**
 * Enemy — entity with graph-based wandering, state, and door approach.
 * No fixed path — enemy chooses random rooms via connections.
 */
import { ENEMY_STATES, ENEMY_CONFIG } from '../config/enemyConfig.js';

export class Enemy {
  /**
   * @param {Object} deps
   * @param {string} deps.id - Enemy ID (matches ENEMY_CONFIG key)
   * @param {string} [deps.startRoom] - Starting room ID (defaults to baseRoom)
   * @param {number} [deps.aggression] - Initial aggression (0-20)
   */
  constructor({ id, startRoom, aggression = 0 }) {
    const config = ENEMY_CONFIG[id];
    if (!config) {
      throw new Error(`Unknown enemy ID: ${id}`);
    }

    this._id = config.id;
    this._name = config.name;
    this._color = config.color;
    this._sprites = config.sprites;
    this._baseRoom = config.baseRoom;
    this._doorSide = config.doorSide;
    this._doorOffset = config.doorOffset;
    this._possibleDoors = [...config.possibleDoors];

    this._currentRoom = startRoom || config.baseRoom;
    this._previousRoom = null;
    this._visitedRooms = new Set([this._currentRoom]);

    this._state = config.initialState;
    this._aggression = Math.max(0, Math.min(20, aggression));

    this._moveTimer = 0;
    this._isMoving = false;
    this._returnCooldown = 0;

    this._isDefeated = false;

    // Transit state — enemy is "in the corridor" between rooms
    this._transitTargetRoom = null;
    this._transitDuration = 0;
    this._transitTimer = 0;

    // Current target door — chosen dynamically when enemy decides to approach a door
    this._targetDoor = null;

    // Exposure timers — accumulate when enemy is subjected to light/door/mask
    this._lightExposureTimer = 0;
    this._doorExposureTimer = 0;
    this._maskExposureTimer = 0;

    // Camera X position — randomized each time enemy enters a room
    this._cameraX = null;
  }

  /**
   * Reset enemy to base room.
   */
  reset() {
    const config = ENEMY_CONFIG[this._id];
    this._currentRoom = config.baseRoom;
    this._previousRoom = null;
    this._visitedRooms = new Set([this._currentRoom]);
    this._state = config.initialState;
    this._moveTimer = 0;
    this._isMoving = false;
    this._returnCooldown = 0;
    this._isDefeated = false;
    this._targetDoor = null;

    this._transitTargetRoom = null;
    this._transitDuration = 0;
    this._transitTimer = 0;

    this._lightExposureTimer = 0;
    this._doorExposureTimer = 0;
    this._maskExposureTimer = 0;
  }

  /**
   * Set aggression level (0-20).
   * @param {number} level
   */
  setAggression(level) {
    this._aggression = Math.max(0, Math.min(20, level));
  }

  /**
   * Start transit to a specific room.
   * Enemy becomes IN_TRANSIT and is invisible during the transition.
   * @param {string} targetRoomId - Room ID to transit to
   * @param {number} transitDurationMs - Duration of transit in ms
   * @returns {boolean} Whether transit was started
   */
  startTransitTo(targetRoomId, transitDurationMs) {
    if (this._isMoving) return false;

    this._previousRoom = this._currentRoom;
    this._transitTargetRoom = targetRoomId;
    this._transitDuration = transitDurationMs;
    this._transitTimer = 0;
    this._isMoving = true;
    return true;
  }

  /**
   * Update transit timer. Call each frame while IN_TRANSIT.
   * @param {number} dt - Delta time in ms
   * @returns {boolean} True if transit completed
   */
  updateTransit(dt) {
    if (!this._isMoving || this._transitDuration <= 0) return false;

    this._transitTimer += dt;
    if (this._transitTimer >= this._transitDuration) {
      this._completeTransit();
      return true;
    }
    return false;
  }

  /**
   * Complete the transit — move enemy to target room.
   */
  _completeTransit() {
    this._currentRoom = this._transitTargetRoom;
    this._visitedRooms.add(this._currentRoom);
    this._isMoving = false;
    this._transitTargetRoom = null;
    this._transitDuration = 0;
    this._transitTimer = 0;
    this._moveTimer = 0;
  }

  /**
   * Cancel transit (e.g. enemy forced to return).
   */
  cancelTransit() {
    this._isMoving = false;
    this._transitTargetRoom = null;
    this._transitDuration = 0;
    this._transitTimer = 0;
  }

  /**
   * Try to return to base (called on light or door block).
   * Sets state to RETURNING — actual transit is handled by AI._updateReturning.
   * @param {boolean} force - Bypass return chance check
   * @returns {boolean} Whether return was triggered
   */
  tryReturn(force = false) {
    if (this._state === ENEMY_STATES.RETURNING || this._state === ENEMY_STATES.IN_TRANSIT) {
      return false;
    }

    const config = ENEMY_CONFIG[this._id];
    const chance = force ? 1 : config.returnChance;

    if (Math.random() < chance && this._returnCooldown <= 0) {
      this._state = ENEMY_STATES.RETURNING;
      this._returnCooldown = config.returnCooldownMs;
      this._targetDoor = null;
      this.resetExposures();
      return true;
    }
    return false;
  }

  /**
   * Update return cooldown.
   * @param {number} dt - Delta time in ms
   */
  updateCooldown(dt) {
    if (this._returnCooldown > 0) {
      this._returnCooldown = Math.max(0, this._returnCooldown - dt);
    }
  }

  /**
   * Tick move timer.
   * @param {number} dt - Delta time in ms
   */
  tickMoveTimer(dt) {
    this._moveTimer += dt;
  }

  /**
   * Reset move timer.
   */
  resetMoveTimer() {
    this._moveTimer = 0;
  }

  /**
   * Set state directly.
   * @param {string} state
   */
  setState(state) {
    this._state = state;
  }

  /**
   * Check if enemy is at a door room (dock or generator).
   * @returns {boolean}
   */
  isAtDoor() {
    return this._possibleDoors.includes(this._currentRoom);
  }

  /**
   * Check if at base room.
   * @returns {boolean}
   */
  isAtBase() {
    return this._currentRoom === this._baseRoom;
  }

  /**
   * Check if can attack from current position.
   * @returns {boolean}
   */
  canAttack() {
    return this.isAtDoor() && this._state === ENEMY_STATES.AT_DOOR;
  }

  /**
   * Mark as defeated (jumpscare triggered).
   */
  defeat() {
    this._isDefeated = true;
  }

  /** Choose a random door to target from possibleDoors. */
  chooseTargetDoor() {
    const doors = this._possibleDoors;
    this._targetDoor = doors[Math.floor(Math.random() * doors.length)];
    return this._targetDoor;
  }

  /** Tick light exposure. Call each frame while at door. */
  tickLightExposure(dt, isLit) {
    if (isLit) {
      this._lightExposureTimer += dt;
    } else {
      this._lightExposureTimer = Math.max(0, this._lightExposureTimer - dt * 0.5);
    }
  }

  /** Tick door exposure. Call each frame while at door. */
  tickDoorExposure(dt, isBlocked) {
    if (isBlocked) {
      this._doorExposureTimer += dt;
    } else {
      this._doorExposureTimer = Math.max(0, this._doorExposureTimer - dt * 0.5);
    }
  }

  /** Tick mask exposure. Call each frame while at door. */
  tickMaskExposure(dt, isActive) {
    if (isActive) {
      this._maskExposureTimer += dt;
    } else {
      this._maskExposureTimer = Math.max(0, this._maskExposureTimer - dt * 0.5);
    }
  }

  /** Reset all exposure timers (called when enemy leaves door or resets). */
  resetExposures() {
    this._lightExposureTimer = 0;
    this._doorExposureTimer = 0;
    this._maskExposureTimer = 0;
  }

  /** Randomize camera X position (0-1 relative) for when enemy appears on camera. */
  randomizeCameraX() {
    this._cameraX = 0.15 + Math.random() * 0.7;
  }

  /** @returns {number} Light exposure in ms */
  get lightExposure() { return this._lightExposureTimer; }

  /** @returns {number} Door exposure in ms */
  get doorExposure() { return this._doorExposureTimer; }

  /** @returns {number} Mask exposure in ms */
  get maskExposure() { return this._maskExposureTimer; }

  /** @returns {number} Camera X position 0-1, randomized per room entry */
  get cameraX() { return this._cameraX ?? 0.5; }

  /** @returns {string|null} Current targeted door room ID. */
  get targetDoor() { return this._targetDoor; }

  /** @returns {string} */
  get id() { return this._id; }

  /** @returns {string} */
  get name() { return this._name; }

  /** @returns {string} */
  get color() { return this._color; }

  /** @returns {Object} */
  get sprites() { return this._sprites; }

  /** @returns {string} */
  get currentRoom() { return this._currentRoom; }

  /** @returns {string|null} */
  get previousRoom() { return this._previousRoom; }

  /** @returns {'left'|'right'} Which door side this enemy attacks */
  get doorSide() { return this._doorSide; }

  /** @returns {{x:number, y:number}} */
  get doorOffset() { return this._doorOffset; }

  /** @returns {string} */
  get state() { return this._state; }

  /** @returns {number} */
  get aggression() { return this._aggression; }

  /** @returns {boolean} */
  get isMoving() { return this._isMoving; }

  /** @returns {number} */
  get moveTimer() { return this._moveTimer; }

  /** @returns {boolean} */
  get isDefeated() { return this._isDefeated; }

  /** @returns {boolean} — True if enemy is currently in transit between rooms */
  get isInTransit() { return this._isMoving && this._state === ENEMY_STATES.IN_TRANSIT; }

  /** @returns {number} — Transit progress 0-1 */
  get transitProgress() {
    if (!this._isMoving || this._transitDuration <= 0) return 0;
    return Math.min(1, this._transitTimer / this._transitDuration);
  }

  /** @returns {Set<string>} Rooms visited this night */
  get visitedRooms() { return this._visitedRooms; }

  /**
   * Render enemy placeholder.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} size
   */
  render(ctx, x, y, size = 60) {
    ctx.fillStyle = this._color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._name, x, y);

    if (this._state === ENEMY_STATES.AT_DOOR) {
      ctx.font = '10px Courier New';
      ctx.fillText('!', x, y - size / 2 - 8);
    }
  }
}
