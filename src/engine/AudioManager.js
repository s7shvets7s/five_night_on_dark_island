/**
 * AudioManager — handles audio playback, volume control, and background loops.
 * Uses Web Audio API with graceful fallback when assets are missing.
 */
export class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._sfxGain = null;
    this._musicGain = null;
    this._ambienceGain = null;
    this._masterVolume = 0.7;
    this._sfxVolume = 0.8;
    this._musicVolume = 0.5;
    this._ambienceVolume = 0.5;
    this._cameraStaticSource = null;
    this._cameraStaticGain = null;
    this._cameraStaticBuffer = null;
    this._muted = false;
    this._activeLoops = new Map();
    this._initialized = false;
    this._playlist = [];
    this._playlistIndex = 0;
    this._currentMusic = null;
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

      this._musicGain = this._ctx.createGain();
      this._musicGain.gain.value = this._musicVolume;
      this._musicGain.connect(this._masterGain);

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

  /** Set SFX volume (0-1) — used by SFXManager for HTMLAudio playback */
  setMasterSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._sfxVolume;
    }
  }

  /** Set music volume (0-1) */
  setMusicVolume(vol) {
    this._musicVolume = Math.max(0, Math.min(1, vol));
    if (this._musicGain) {
      this._musicGain.gain.value = this._musicVolume;
    }
    if (this._currentMusic) {
      this._currentMusic.volume = this._musicVolume;
    }
  }

  /** @returns {number} */
  get musicVolume() { return this._musicVolume; }

  /** Shuffle array using Fisher-Yates algorithm */
  _shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Set playlist of music tracks */
  setPlaylist(tracks) {
    this._playlist = [...tracks];
    this._shuffleArray(this._playlist);
    this._playlistIndex = 0;
  }

  /** Play music playlist (loops infinitely in random order) */
  playMusic() {
    if (this._muted || this._playlist.length === 0) return;
    if (!this._initialized) {
      this.init();
    }
    this._playNextTrack();
  }

  /** Play next track in playlist */
  _playNextTrack() {
    if (!this._initialized || this._playlist.length === 0) return;

    if (this._currentMusic) {
      this._currentMusic.pause();
      this._currentMusic.src = '';
      this._currentMusic = null;
    }

    const trackSrc = this._playlist[this._playlistIndex];
    this._currentMusic = new Audio(trackSrc);
    this._currentMusic.loop = false;
    this._currentMusic.volume = this._musicVolume;

    this._currentMusic.addEventListener('ended', () => {
      this._playlistIndex++;
      if (this._playlistIndex >= this._playlist.length) {
        this._shuffleArray(this._playlist);
        this._playlistIndex = 0;
      }
      this._playNextTrack();
    });

    this._currentMusic.play().catch(() => {});
  }

  /** Stop music */
  stopMusic() {
    if (this._currentMusic) {
      this._currentMusic.pause();
      this._currentMusic.src = '';
      this._currentMusic = null;
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

  // ==================== Camera Static Noise ====================

  /**
   * Generate a white noise buffer for camera static.
   * @param {number} duration - Buffer duration in seconds
   * @returns {AudioBuffer}
   * @private
   */
  _createStaticNoiseBuffer(duration = 2) {
    if (this._cameraStaticBuffer) return this._cameraStaticBuffer;

    const sampleRate = this._ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    this._cameraStaticBuffer = buffer;
    return buffer;
  }

  /**
   * Start continuous camera static noise loop.
   * @param {number} volume - Volume 0-1
   */
  startCameraStaticNoise(volume = 0.1) {
    if (!this._initialized || this._muted) return;
    this.stopCameraStaticNoise();

    try {
      const buffer = this._createStaticNoiseBuffer(2);

      this._cameraStaticSource = this._ctx.createBufferSource();
      this._cameraStaticSource.buffer = buffer;
      this._cameraStaticSource.loop = true;

      // Filter to make it sound like old TV/monitor
      const filter = this._ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;

      this._cameraStaticGain = this._ctx.createGain();
      this._cameraStaticGain.gain.value = volume;

      this._cameraStaticSource.connect(filter);
      filter.connect(this._cameraStaticGain);
      this._cameraStaticGain.connect(this._sfxGain);

      this._cameraStaticSource.start();
    } catch (e) {
      console.warn('[AudioManager] Failed to start camera static noise:', e);
    }
  }

  /**
   * Stop camera static noise.
   */
  stopCameraStaticNoise() {
    try {
      if (this._cameraStaticSource) {
        this._cameraStaticSource.stop();
        this._cameraStaticSource.disconnect();
        this._cameraStaticSource = null;
      }
      if (this._cameraStaticGain) {
        this._cameraStaticGain.disconnect();
        this._cameraStaticGain = null;
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  /**
   * Set camera static noise volume.
   * @param {number} volume - Volume 0-1
   */
  setCameraStaticVolume(volume) {
    if (this._cameraStaticGain) {
      this._cameraStaticGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Stop all audio immediately (used on game exit / scene change).
   */
  stopAll() {
    this.stopCameraStaticNoise();
    // Close and recreate context to kill all playing sounds
    if (this._ctx) {
      try {
        this._ctx.close();
      } catch (e) {
        // Ignore
      }
      this._ctx = null;
      this._initialized = false;
    }
  }
}
