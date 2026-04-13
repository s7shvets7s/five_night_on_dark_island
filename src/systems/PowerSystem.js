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
    this._drainRate = 0.25;
    this._doorDrain = 0.18;
    this._lightDrain = 0.08;
    this._cameraDrain = 0.15;
    this._isDraining = true;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;

    // Night difficulty multiplier — increases drain on harder nights
    this._drainMultiplier = 1.0;

    // Door fatigue — escalating cost for doors closed too long
    this._doorFatigueRate = 0.02;   // per second after threshold
    this._doorFatigueMax = 0.15;    // max extra drain per door
    this._doorFatigueThreshold = 30; // seconds before fatigue starts
    this._doorFatigueTimer = 0;
  }

  /** Reset power to full */
  reset() {
    this._currentPower = this._maxPower;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;
    this._isDraining = true;
    this._drainMultiplier = 1.0;
    this._doorFatigueTimer = 0;
    this._emitChange();
  }

  /**
   * Set the number of active doors.
   * @param {number} count
   */
  setActiveDoors(count) {
    const prevCount = this._activeDoors;
    this._activeDoors = Math.max(0, count);

    // Reset fatigue when door count changes (player opened a door)
    if (this._activeDoors < prevCount) {
      this._doorFatigueTimer = 0;
    }
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
   * Set drain multiplier for night difficulty scaling.
   * @param {number} multiplier
   */
  setDrainMultiplier(multiplier) {
    this._drainMultiplier = Math.max(0.5, multiplier);
  }

  /**
   * Update power drain.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this._isDraining || this._currentPower <= 0) return;

    // Track door fatigue — escalating cost when doors are closed
    if (this._activeDoors > 0) {
      this._doorFatigueTimer = (this._doorFatigueTimer || 0) + dt;
    } else {
      this._doorFatigueTimer = 0;
    }

    // Calculate fatigue: scales with number of closed doors
    let fatigue = 0;
    if (this._doorFatigueTimer > this._doorFatigueThreshold) {
      const excess = this._doorFatigueTimer - this._doorFatigueThreshold;
      const baseFatigue = Math.min(this._doorFatigueMax, excess * this._doorFatigueRate);
      fatigue = baseFatigue * this._activeDoors; // More closed doors = more fatigue
    }

    const totalDrain = (this._drainRate
      + (this._activeDoors * this._doorDrain)
      + (this._activeLights * this._lightDrain)
      + (this._cameraActive ? this._cameraDrain : 0)
      + fatigue) * this._drainMultiplier;

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

  /**
   * Drain a specific amount of power.
   * @param {number} amount
   */
  drain(amount) {
    this._currentPower = Math.max(0, this._currentPower - amount);
    this._emitChange();
  }

  /**
   * Add power (for generator success).
   * @param {number} amount
   */
  add(amount) {
    this._currentPower = Math.min(this._maxPower, this._currentPower + amount);
    this._emitChange();
  }

  _emitChange() {
    this._eventBus.emit('power:change', {
      current: this._currentPower,
      max: this._maxPower,
      percent: this.getPowerPercent(),
    });
  }
}
