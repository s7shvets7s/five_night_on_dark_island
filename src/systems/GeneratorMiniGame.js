/**
 * GeneratorMiniGame — manages generator maintenance mini-game.
 * Player must rotate mouse in a full circle (360°) within time limit.
 * Direction is random (CW or CCW) each time.
 */
import { CONFIG } from '../config/gameConfig.js';

export class GeneratorMiniGame {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   * @param {Function} deps.onSuccess - called when player completes the game
   * @param {Function} deps.onFail - called when player fails (timeout or wrong direction)
   */
  constructor({ eventBus, onSuccess, onFail }) {
    this._eventBus = eventBus;
    this._onSuccess = onSuccess;
    this._onFail = onFail;

    this._active = false;
    this._showingMenu = false;
    this._direction = 'CW';
    this._progress = 0;
    this._startAngle = 0;
    this._lastAngle = 0;
    this._timeLeft = 0;
    this._timeSinceActivation = 0;
    this._totalRotation = 0;
    this._initialMouseAngle = 0;
    this._started = false;
  }

  /**
   * Reset state for new night.
   */
  reset() {
    this._active = false;
    this._showingMenu = false;
    this._progress = 0;
    this._timeLeft = 0;
    this._timeSinceActivation = 0;
    this._totalRotation = 0;
    this._started = false;
  }

  /**
   * Update timer and check for timeout.
   * @param {number} dt - delta time in seconds
   */
  update(dt) {
    if (!this._active) {
      this._timeSinceActivation += dt;
      if (this._timeSinceActivation >= CONFIG.GENERATOR_INTERVAL) {
        this._activate();
      }
      return;
    }

    if (this._showingMenu) {
      this._timeLeft -= dt;
      if (this._timeLeft <= 0) {
        this._fail('timeout');
      }
    } else {
      this._timeSinceActivation += dt;
      if (this._timeSinceActivation >= CONFIG.GENERATOR_TIMEOUT) {
        this._fail('ignored');
      }
    }
  }

  /**
   * Activate the generator mini-game.
   */
  _activate() {
    this._active = true;
    this._showingMenu = false;
    this._progress = 0;
    this._totalRotation = 0;
    this._timeSinceActivation = 0;
    this._started = false;
    this._direction = Math.random() > 0.5 ? 'CW' : 'CCW';
    this._eventBus.emit('generator:active');
  }

  /**
   * Start the mini-game interaction (player clicked the button).
   */
  startInteraction() {
    if (this._showingMenu) return;
    
    this._showingMenu = true;
    this._timeLeft = CONFIG.GENERATOR_TIME_LIMIT;
    this._started = false;
    this._progress = 0;
    this._totalRotation = 0;
    this._lastAngle = 0;
  }

  /**
   * Close the mini-game menu (when charged).
   */
  closeInteraction() {
    this._showingMenu = false;
  }

  /**
   * Handle mouse move for rotation tracking.
   * @param {number} mouseX - current mouse X
   * @param {number} mouseY - current mouse Y
   * @param {number} centerX - center X of the mini-game
   * @param {number} centerY - center Y of the mini-game
   */
  handleMouseMove(mouseX, mouseY, centerX, centerY) {
    if (!this._showingMenu) return;

    const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);

    if (!this._started) {
      this._initialMouseAngle = currentAngle;
      this._lastAngle = currentAngle;
      this._started = true;
      return;
    }

    let delta = currentAngle - this._lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    this._lastAngle = currentAngle;

    const isCorrectDirection = (this._direction === 'CW' && delta > 0) || 
                               (this._direction === 'CCW' && delta < 0);

    if (isCorrectDirection) {
      this._totalRotation += Math.abs(delta);
      const rotationsNeeded = CONFIG.GENERATOR_ROTATIONS_NEEDED;
      this._progress = Math.min(360 * rotationsNeeded, (this._totalRotation / (Math.PI * 2)) * 360);

      if (this._progress >= 360 * rotationsNeeded) {
        this._success();
      }
    } else {
      this._totalRotation = Math.max(0, this._totalRotation - Math.abs(delta) * 2);
      const rotationsNeeded = CONFIG.GENERATOR_ROTATIONS_NEEDED;
      this._progress = Math.min(360 * rotationsNeeded, (this._totalRotation / (Math.PI * 2)) * 360);
    }
  }

  /**
   * Player successfully completed the mini-game.
   */
  _success() {
    this._active = false;
    this._showingMenu = false;
    this._timeSinceActivation = 0;
    this._eventBus.emit('generator:success');
    if (this._onSuccess) this._onSuccess();
  }

  /**
   * Player failed the mini-game.
   * @param {string} reason - 'timeout' or 'ignored'
   */
  _fail(reason) {
    this._active = false;
    this._showingMenu = false;
    this._timeSinceActivation = 0;
    this._eventBus.emit('generator:fail', { reason });
    if (this._onFail) this._onFail(reason);
  }

  /** @returns {boolean} Whether generator needs attention */
  get isActive() { return this._active; }

  /** @returns {boolean} Whether generator is charged (no attention needed) */
  get isCharged() { return !this._active; }

  /** @returns {boolean} Whether mini-game menu is showing */
  get isShowingMenu() { return this._showingMenu; }

  /** @returns {string} Current direction ('CW' or 'CCW') */
  get direction() { return this._direction; }

  /** @returns {number} Progress in degrees (0-360) */
  get progress() { return this._progress; }

  /** @returns {number} Time left in seconds */
  get timeLeft() { return this._timeLeft; }

  /** @returns {number} Time since activation (for timeout) */
  get timeSinceActivation() { return this._timeSinceActivation; }
}