/**
 * PowerSystem — manages power drain and emergency mode.
 * Power drains based on active systems (doors, lights, cameras).
 */
export class PowerSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._maxPower = 100;
    this._currentPower = this._maxPower;
    this._drainRate = 0.15;
    this._doorDrain = 0.1;
    this._lightDrain = 0.05;
    this._cameraDrain = 0.08;
    this._isDraining = true;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;
  }

  /** Reset power to full */
  reset() {
    this._currentPower = this._maxPower;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;
    this._isDraining = true;
    this._emitChange();
  }

  /**
   * Set the number of active doors.
   * @param {number} count
   */
  setActiveDoors(count) {
    this._activeDoors = Math.max(0, count);
  }

  /**
   * Set the number of active lights.
   * @param {number} count
   */
  setActiveLights(count) {
    this._activeLights = Math.max(0, count);
  }

  /**
   * Set camera active state.
   * @param {boolean} active
   */
  setCameraActive(active) {
    this._cameraActive = active;
  }

  /**
   * Update power drain.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this._isDraining || this._currentPower <= 0) return;

    const totalDrain = this._drainRate
      + (this._activeDoors * this._doorDrain)
      + (this._activeLights * this._lightDrain)
      + (this._cameraActive ? this._cameraDrain : 0);

    this._currentPower = Math.max(0, this._currentPower - totalDrain * dt);

    if (this._currentPower <= 0) {
      this._isDraining = false;
    }

    this._emitChange();
  }

  /** @returns {number} Current power (0-100) */
  get currentPower() { return this._currentPower; }

  /** @returns {number} Max power */
  get maxPower() { return this._maxPower; }

  /** @returns {number} Power as percentage (0-100) */
  getPowerPercent() { return (this._currentPower / this._maxPower) * 100; }

  /** @returns {boolean} Whether power is depleted */
  get isDepleted() { return this._currentPower <= 0; }

  _emitChange() {
    this._eventBus.emit('power:change', {
      current: this._currentPower,
      max: this._maxPower,
      percent: this.getPowerPercent(),
    });
  }
}
