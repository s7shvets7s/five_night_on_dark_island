/**
 * OfficeSystem — manages doors, lights, and ventilation.
 */
export class OfficeSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._leftDoor = false;
    this._rightDoor = false;
    this._leftLight = false;
    this._rightLight = false;
    this._fanOn = true;
  }

  /** Reset office state */
  reset() {
    this._leftDoor = false;
    this._rightDoor = false;
    this._leftLight = false;
    this._rightLight = false;
    this._fanOn = true;
  }

  /**
   * Toggle a door.
   * @param {'left'|'right'} side
   */
  toggleDoor(side) {
    if (side === 'left') {
      this._leftDoor = !this._leftDoor;
      this._eventBus.emit('door:toggle', { side: 'left', isOpen: !this._leftDoor });
    } else if (side === 'right') {
      this._rightDoor = !this._rightDoor;
      this._eventBus.emit('door:toggle', { side: 'right', isOpen: !this._rightDoor });
    }
  }

  /**
   * Toggle a light.
   * @param {'left'|'right'} side
   */
  toggleLight(side) {
    if (side === 'left') {
      this._leftLight = !this._leftLight;
      this._eventBus.emit('light:toggle', { side: 'left', isOn: this._leftLight });
    } else if (side === 'right') {
      this._rightLight = !this._rightLight;
      this._eventBus.emit('light:toggle', { side: 'right', isOn: this._rightLight });
    }
  }

  /** Toggle fan */
  toggleFan() {
    this._fanOn = !this._fanOn;
  }

  /** @returns {boolean} */
  get leftDoorOpen() { return !this._leftDoor; }

  /** @returns {boolean} */
  get rightDoorOpen() { return !this._rightDoor; }

  /** @returns {boolean} */
  get leftLightOn() { return this._leftLight; }

  /** @returns {boolean} */
  get rightLightOn() { return this._rightLight; }

  /** @returns {number} Number of closed doors */
  get activeDoors() {
    return (this._leftDoor ? 1 : 0) + (this._rightDoor ? 1 : 0);
  }

  /** @returns {number} Number of active lights */
  get activeLights() {
    return (this._leftLight ? 1 : 0) + (this._rightLight ? 1 : 0);
  }

  /**
   * Check if enemy is at a door (revealed by light).
   * @param {string} side - 'left' or 'right'
   * @param {Array} enemies - Enemy array
   * @returns {boolean}
   */
  isEnemyAtDoor(side, enemies) {
    const doorRoom = side === 'left' ? 'dock' : 'generator';
    return enemies.some(e => e.currentRoom === doorRoom);
  }
}
