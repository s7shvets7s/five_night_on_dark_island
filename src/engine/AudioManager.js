/**
 * AudioManager — handles audio playback, volume control, and background loops.
 * Uses Web Audio API with graceful fallback when assets are missing.
 */
export class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._sfxGain = null;
    this._ambienceGain = null;
    this._masterVolume = 0.7;
    this._sfxVolume = 0.8;
    this._ambienceVolume = 0.5;
    this._muted = false;
    this._activeLoops = new Map();
    this._initialized = false;
  }

  /** Initialize Web Audio context (call on first user interaction) */
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._masterVolume;
      this._masterGain.connect(this._ctx.destination);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this._sfxVolume;
      this._sfxGain.connect(this._masterGain);

      this._ambienceGain = this._ctx.createGain();
      this._ambienceGain.gain.value = this._ambienceVolume;
      this._ambienceGain.connect(this._masterGain);

      this._initialized = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio not available:', e);
    }
  }

  /** Resume audio context (required after user gesture) */
  resume() {
    this._ctx?.resume();
  }

  /**
   * Play a sound effect.
   * @param {HTMLAudioElement|string} source - Audio element or asset key
   * @returns {boolean} Whether playback started
   */
  playSFX(source) {
    if (!this._initialized || this._muted) return false;
    try {
      if (source instanceof HTMLAudioElement) {
        source.volume = this._sfxVolume;
        source.currentTime = 0;
        source.play().catch(() => {});
        return true;
      }
    } catch (e) {
      // Silently fail — audio is non-critical
    }
    return false;
  }

  /**
   * Start a looping ambient sound.
   * @param {string} id - Unique loop identifier
   * @param {HTMLAudioElement} audio - Audio element
   */
  startLoop(id, audio) {
    if (!this._initialized || this._muted) return;
    try {
      if (this._activeLoops.has(id)) return;
      audio.loop = true;
      audio.volume = this._ambienceVolume;
      audio.play().catch(() => {});
      this._activeLoops.set(id, audio);
    } catch (e) {
      // Silently fail
    }
  }

  /** Stop a looping ambient sound by ID */
  stopLoop(id) {
    const audio = this._activeLoops.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this._activeLoops.delete(id);
    }
  }

  /** Stop all active loops */
  stopAllLoops() {
    for (const id of this._activeLoops.keys()) {
      this.stopLoop(id);
    }
  }

  /** Set master volume (0-1) */
  setMasterVolume(vol) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this._masterGain) {
      this._masterGain.gain.value = this._masterVolume;
    }
  }

  /** Set SFX volume (0-1) */
  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  }

  /** Set ambience volume (0-1) */
  setAmbienceVolume(vol) {
    this._ambienceVolume = Math.max(0, Math.min(1, vol));
    for (const audio of this._activeLoops.values()) {
      audio.volume = this._ambienceVolume;
    }
  }

  /** Toggle mute */
  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
    }
  }

  /** @returns {boolean} */
  get isMuted() { return this._muted; }

  /** @returns {number} */
  get masterVolume() { return this._masterVolume; }
}
