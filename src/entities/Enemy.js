/**
 * Enemy — entity with position, state, patrol/return logic.
 */
import { ENEMY_STATES, ENEMY_CONFIG } from '../config/enemyConfig.js';

export class Enemy {
  /**
   * @param {Object} deps
   * @param {string} deps.id - Enemy ID (matches ENEMY_CONFIG key)
   * @param {string} deps.startRoom - Starting room ID
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
    this._doorRoom = config.doorRoom;
    this._doorSide = config.doorSide;
    this._doorOffset = config.doorOffset;
    this._path = config.path;

    this._currentRoom = startRoom || config.baseRoom;
    this._previousRoom = null;
    this._pathIndex = this._path.indexOf(this._currentRoom);

    this._state = config.initialState;
    this._aggression = Math.max(0, Math.min(20, aggression));

    this._moveTimer = 0;
    this._isMoving = false;
    this._returnCooldown = 0;

    this._isDefeated = false;
  }

  /**
   * Reset enemy to base room.
   */
  reset() {
    const config = ENEMY_CONFIG[this._id];
    this._currentRoom = config.baseRoom;
    this._previousRoom = null;
    this._pathIndex = 0;
    this._state = config.initialState;
    this._moveTimer = 0;
    this._isMoving = false;
    this._returnCooldown = 0;
    this._isDefeated = false;
  }

  /**
   * Set aggression level (0-20).
   * @param {number} level
   */
  setAggression(level) {
    this._aggression = Math.max(0, Math.min(20, level));
  }

  /**
   * Move forward on path (approaching).
   */
  moveForward() {
    if (this._pathIndex >= this._path.length - 1) {
      return false;
    }
    this._previousRoom = this._currentRoom;
    this._pathIndex++;
    this._currentRoom = this._path[this._pathIndex];
    this._isMoving = true;
    this._moveTimer = 0;
    return true;
  }

  /**
   * Move backward on path (returning to base).
   */
  moveBackward() {
    if (this._pathIndex <= 0) {
      this._state = ENEMY_STATES.PATROL;
      return false;
    }
    this._previousRoom = this._currentRoom;
    this._pathIndex--;
    this._currentRoom = this._path[this._pathIndex];
    this._isMoving = true;
    this._moveTimer = 0;
    return true;
  }

  /**
   * Complete movement transition.
   */
  completeMove() {
    this._isMoving = false;
  }

  /**
   * Try to return to base (called on light or door block).
   * @returns {boolean} Whether return was triggered
   */
  tryReturn(force = false) {
    if (this._state === ENEMY_STATES.RETURNING) {
      return false;
    }

    const config = ENEMY_CONFIG[this._id];
    const chance = force ? 1 : config.returnChance;

    if (Math.random() < chance && this._returnCooldown <= 0) {
      this._state = ENEMY_STATES.RETURNING;
      this._returnCooldown = config.returnCooldownMs;
      if (this._pathIndex > 0) {
        this.moveBackward();
      }
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
   * Check if at door room.
   * @returns {boolean}
   */
  isAtDoor() {
    return this._currentRoom === this._doorRoom;
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

  /**
   * @returns {string}
   */
  get id() { return this._id; }

  /** @returns {string} */
  get name() { return this._name; }

  /** @returns {string} */
  get color() { return this._color; }

  /** @returns {string} */
  get sprites() { return this._sprites; }

  /** @returns {string} */
  get currentRoom() { return this._currentRoom; }

  /** @returns {string|null} */
  get previousRoom() { return this._previousRoom; }

  /** @returns {string} */
  get doorRoom() { return this._doorRoom; }

  /** @returns {'left'|'right'} */
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

  /** @returns {number} */
  get pathIndex() { return this._pathIndex; }

  /** @returns {number} */
  get pathLength() { return this._path.length; }

  /** @returns {boolean} */
  get isDefeated() { return this._isDefeated; }

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