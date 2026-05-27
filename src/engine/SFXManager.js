/**
 * SFXManager — manages sound effect playback with caching, random selection,
 * and ambient random scheduling.
 *
 * Usage:
 *   const sfx = new SFXManager(audioManager);
 *   await sfx.loadAll(sfxConfig);
 *   sfx.play('doorOpen');
 *   sfx.enableRandom(true);
 */
import { SFX } from '../config/sfxConfig.js';

export class SFXManager {
  /**
   * @param {Object} audioManager — AudioManager instance
   */
  constructor(audioManager) {
    this._audio = audioManager;
    this._cache = new Map();       // key -> Audio[]
    this._enabled = true;
    this._muted = false;
    this._randomEnabled = false;
    this._randomTimer = null;
    this._powerLowPlayed = false;  // prevent spam
    this._lastPowerLowPercent = 100;
    this._playingSFX = new Set();  // Track currently playing SFX
  }

  /**
   * Mute all SFX sounds.
   */
  mute() {
    this._muted = true;
    this.pauseAll();
  }

  /**
   * Unmute all SFX sounds.
   */
  unmute() {
    this._muted = false;
  }

  /**
   * Pause all currently playing SFX sounds.
   */
  pauseAll() {
    this._muted = true;
    this._playingSFX.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
      }
    });
  }

  /**
   * Resume all paused SFX sounds.
   */
  resumeAll() {
    this._muted = false;
  }

  /**
   * Load all SFX from config into cache.
   * @param {Object} sfxConfig — SFX config object (from sfxConfig.js)
   */
  loadAll(sfxConfig = SFX) {
    for (const [key, config] of Object.entries(sfxConfig)) {
      if (config.files) {
        this._cache.set(key, config.files.map(file => this._createAudio(file)));
      }
      if (config.pool) {
        const poolAudios = config.pool.map(item => ({
          audio: this._createAudio(item.file),
          weight: item.weight,
        }));
        this._cache.set(key, poolAudios);
      }
    }
  }

  /**
   * Play a sound effect by key.
   * @param {string} key — SFX key (e.g. 'doorOpen', 'buttonClick')
   * @param {number} [overrideVolume] — optional volume override (0-1)
   * @returns {boolean} Whether playback started
   */
  play(key, overrideVolume) {
    if (!this._enabled || this._muted) return false;

    const cached = this._cache.get(key);
    if (!cached || cached.length === 0) return false;

    const config = SFX[key];
    if (!config) return false;

    let audioToPlay;

    if (config.pool) {
      // Weighted random from pool
      audioToPlay = this._pickWeighted(cached);
    } else {
      // Random from files array
      audioToPlay = cached[Math.floor(Math.random() * cached.length)];
    }

    if (!audioToPlay || !audioToPlay.audio && !(audioToPlay instanceof Audio)) return false;

    try {
      const audio = audioToPlay.audio || audioToPlay;
      audio.currentTime = 0;
      const baseVol = overrideVolume !== undefined ? overrideVolume : (config.volume ?? 1);
      const sfxVol = this._audio.sfxVolume;
      audio.volume = baseVol * sfxVol;
      this._playingSFX.add(audio);
      audio.onended = () => this._playingSFX.delete(audio);
      audio.play().catch((e) => {
        this._playingSFX.delete(audio);
        console.warn(`[SFXManager] Playback failed for '${key}':`, e.message);
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Play power-low warning sound (only once per drop below threshold).
   * @param {number} powerPercent — current power percentage
   */
  playPowerLow(powerPercent) {
    const threshold = 25;
    if (powerPercent <= threshold && !this._powerLowPlayed) {
      this._powerLowPlayed = true;
      this.play('powerLow');
    }
    if (powerPercent > threshold) {
      this._powerLowPlayed = false;
    }
  }

  /**
   * Enable or disable random ambient sounds.
   * @param {boolean} value
   */
  enableRandom(value) {
    this._randomEnabled = value;
    if (value) {
      this._scheduleNextAmbient();
    } else {
      this._clearAmbientTimer();
    }
  }

  /**
   * Set enabled state for all SFX.
   * @param {boolean} value
   */
  setEnabled(value) {
    this._enabled = value;
    if (!value) {
      this.enableRandom(false);
    } else if (this._randomEnabled) {
      this._scheduleNextAmbient();
    }
  }

  /**
   * Check if SFX is enabled.
   * @returns {boolean}
   */
  get enabled() {
    return this._enabled;
  }

  /** Dispose all cached audio and clear timers */
  dispose() {
    this._clearAmbientTimer();
    for (const [, audios] of this._cache) {
      for (const item of audios) {
        const audio = item.audio || item;
        if (audio instanceof Audio) {
          audio.pause();
          audio.src = '';
        }
      }
    }
    this._cache.clear();
  }

  // ==================== Private ====================

  /**
   * Create an Audio element from a relative SFX path.
   * @param {string} file — relative path from assets/audio/sfx/
   * @returns {HTMLAudioElement}
   * @private
   */
  _createAudio(file) {
    const audio = new Audio(encodeURI(`assets/audio/sfx/${file}`));
    audio.preload = 'auto';
    return audio;
  }

  /**
   * Pick a random item from a weighted pool.
   * @param {Array<{audio: HTMLAudioElement, weight: number}>} pool
   * @returns {{audio: HTMLAudioElement}|null}
   * @private
   */
  _pickWeighted(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of pool) {
      random -= item.weight;
      if (random <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  /**
   * Schedule the next random ambient sound.
   * @private
   */
  _scheduleNextAmbient() {
    this._clearAmbientTimer();
    if (!this._enabled || !this._randomEnabled) return;

    const config = SFX.ambientRandom;
    if (!config || !config.pool) return;

    const minMs = (config.intervalMin ?? 15) * 1000;
    const maxMs = (config.intervalMax ?? 45) * 1000;
    const delay = minMs + Math.random() * (maxMs - minMs);

    this._randomTimer = setTimeout(() => {
      const played = this.play('ambientRandom');
      if (!played) {
        console.warn('[SFXManager] Ambient sound failed to play');
      }
      this._scheduleNextAmbient();
    }, delay);
  }

  /**
   * Clear the ambient sound timer.
   * @private
   */
  _clearAmbientTimer() {
    if (this._randomTimer) {
      clearTimeout(this._randomTimer);
      this._randomTimer = null;
    }
  }
}
