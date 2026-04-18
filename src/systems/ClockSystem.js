/**
 * ClockSystem — manages game time progression.
 * 6 in-game hours per night.
 */
import { i18n } from '../i18n/index.js';

export class ClockSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._currentHour = 0;
    this._durationMs = 180000;
    this._elapsed = 0;
    this._hourDuration = this._durationMs / 6;
    this._isComplete = false;
  }

  /**
   * Reset clock for a new night.
   * @param {number} durationMs - Total night duration
   */
  reset(durationMs = 180000) {
    this._durationMs = durationMs;
    this._hourDuration = durationMs / 6;
    this._currentHour = 0;
    this._elapsed = 0;
    this._isComplete = false;
    this._emitTick();
  }

  /**
   * Update clock.
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    if (this._isComplete) return;

    this._elapsed += dt;

    const newHour = Math.min(6, Math.floor(this._elapsed / this._hourDuration));

    if (newHour !== this._currentHour) {
      this._currentHour = newHour;
      this._emitTick();
    }

    if (this._currentHour >= 6) {
      this._isComplete = true;
    }
  }

  /** @returns {number} Current hour (0-6) */
  get currentHour() { return this._currentHour; }

  /** @returns {string} Display time (e.g., "12:00", "3:00") */
  get displayTime() {
    if (this._currentHour === 0) return i18n.t('time12');
    return i18n.t('timeHour', { hour: this._currentHour });
  }

  /** @returns {number} Progress through current hour (0-1) */
  get hourProgress() {
    const hourElapsed = this._elapsed % this._hourDuration;
    return hourElapsed / this._hourDuration;
  }

  /** @returns {number} Overall night progress (0-1) */
  get nightProgress() {
    return Math.min(1, this._elapsed / this._durationMs);
  }

  /** @returns {boolean} */
  get isComplete() { return this._isComplete; }

  _emitTick() {
    this._eventBus.emit('clock:tick', {
      hour: this._currentHour,
      progress: this.nightProgress,
    });
  }
}
