/**
 * Enemy — enemy entity with position, state, and rendering.
 */
export class Enemy {
  /**
   * @param {Object} deps
   * @param {string} deps.id - Enemy ID
   * @param {string} deps.name - Display name
   * @param {string} deps.color - Display color
   * @param {string} deps.startRoom - Starting room ID
   */
  constructor({ id, name, color, startRoom }) {
    this._id = id;
    this._name = name;
    this._color = color;
    this._currentRoom = startRoom;
    this._previousRoom = null;
    this._isMoving = false;
    this._moveTimer = 0;
    this._aggression = 0;
    this._isDefeated = false; // defeated by closing door
  }

  /** Reset enemy to start room */
  reset(startRoom) {
    this._currentRoom = startRoom;
    this._previousRoom = null;
    this._isMoving = false;
    this._moveTimer = 0;
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
   * Move enemy to a new room.
   * @param {string} roomId
   */
  moveTo(roomId) {
    this._previousRoom = this._currentRoom;
    this._currentRoom = roomId;
    this._isMoving = true;
  }

  /** Mark movement as complete */
  completeMove() {
    this._isMoving = false;
  }

  /** Defeat enemy (door blocked attack) */
  defeat() {
    this._isDefeated = true;
  }

  /** @returns {string} */
  get id() { return this._id; }

  /** @returns {string} */
  get name() { return this._name; }

  /** @returns {string} */
  get color() { return this._color; }

  /** @returns {string} */
  get currentRoom() { return this._currentRoom; }

  /** @returns {string|null} */
  get previousRoom() { return this._previousRoom; }

  /** @returns {boolean} */
  get isMoving() { return this._isMoving; }

  /** @returns {number} */
  get aggression() { return this._aggression; }

  /** @returns {boolean} */
  get isDefeated() { return this._isDefeated; }

  /** @returns {number} */
  get moveTimer() { return this._moveTimer; }

  /** Increment move timer */
  tickMoveTimer(dt) {
    this._moveTimer += dt;
  }

  /** Reset move timer */
  resetMoveTimer() {
    this._moveTimer = 0;
  }

  /** @returns {boolean} Whether enemy is at office door */
  get isAtOfficeDoor() {
    return this._currentRoom === 'dock' || this._currentRoom === 'generator';
  }

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
  }
}
