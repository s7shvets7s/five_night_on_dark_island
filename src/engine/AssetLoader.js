/**
 * AssetLoader — loads images and audio with graceful fallback.
 * Never crashes on missing assets; uses placeholder rendering instead.
 * Supports progress tracking for loading screens.
 */
export class AssetLoader {
  /**
   * @param {Object} options
   * @param {string} [options.imagePrefix='assets/images/'] - Base path for images
   * @param {string} [options.audioPrefix='assets/audio/'] - Base path for audio
   */
  constructor({ imagePrefix = 'assets/images/', audioPrefix = 'assets/audio/' } = {}) {
    this._imagePrefix = imagePrefix;
    this._audioPrefix = audioPrefix;

    /** @type {Map<string, HTMLImageElement>} */
    this._images = new Map();

    /** @type {Map<string, HTMLAudioElement>} */
    this._audio = new Map();

    /** @type {number} */
    this._totalToLoad = 0;

    /** @type {number} */
    this._loaded = 0;

    /** @type {boolean} */
    this._ready = false;
  }

  /** @returns {number} Load progress 0-1 */
  get progress() {
    if (this._totalToLoad === 0) return 1;
    return this._loaded / this._totalToLoad;
  }

  /** @returns {boolean} */
  get isReady() {
    return this._ready;
  }

  /**
   * Queue images for loading.
   * @param {Object} manifest - { key: 'filename.png', ... }
   */
  queueImages(manifest) {
    for (const [key, filename] of Object.entries(manifest)) {
      this._images.set(key, { filename, loaded: false });
      this._totalToLoad++;
    }
  }

  /**
   * Queue audio files for loading.
   * @param {Object} manifest - { key: 'filename.ogg', ... }
   */
  queueAudio(manifest) {
    for (const [key, filename] of Object.entries(manifest)) {
      this._audio.set(key, { filename, loaded: false });
      this._totalToLoad++;
    }
  }

  /**
   * Load all queued assets.
   * @returns {Promise<void>}
   */
  async loadAll() {
    const imagePromises = this._loadImages();
    const audioPromises = this._loadAudio();

    await Promise.all([...imagePromises, ...audioPromises]);
    this._ready = true;
  }

  /**
   * Get a loaded image by key.
   * @param {string} key
   * @returns {HTMLImageElement | null}
   */
  getImage(key) {
    const entry = this._images.get(key);
    if (!entry || !entry.loaded) return null;
    return entry.element;
  }

  /**
   * Get a loaded audio element by key.
   * @param {string} key
   * @returns {HTMLAudioElement | null}
   */
  getAudio(key) {
    const entry = this._audio.get(key);
    if (!entry || !entry.loaded) return null;
    return entry.element;
  }

  /**
   * Check if a specific asset is loaded.
   * @param {string} key
   * @returns {boolean}
   */
  isLoaded(key) {
    return this._images.get(key)?.loaded || this._audio.get(key)?.loaded || false;
  }

  /** Load all queued images */
  _loadImages() {
    const promises = [];

    for (const [key, entry] of this._images) {
      promises.push(
        this._loadImage(entry.filename).then((img) => {
          entry.element = img;
          entry.loaded = true;
          this._loaded++;
        }).catch(() => {
          // Silently skip missing images — game uses placeholder rendering
          entry.loaded = true;
          this._loaded++;
        })
      );
    }

    return promises;
  }

  /** Load a single image by filename */
  _loadImage(filename) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${filename}`));
      img.src = this._imagePrefix + filename;
    });
  }

  /** Load all queued audio */
  _loadAudio() {
    const promises = [];

    for (const [key, entry] of this._audio) {
      promises.push(
        this._loadAudioFile(entry.filename).then((audio) => {
          entry.element = audio;
          entry.loaded = true;
          this._loaded++;
        }).catch(() => {
          // Silently skip missing audio — never break game flow
          entry.loaded = true;
          this._loaded++;
        })
      );
    }

    return promises;
  }

  /** Load a single audio file */
  _loadAudioFile(filename) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.addEventListener('error', () => reject(new Error(`Failed to load audio: ${filename}`)));
      audio.src = this._audioPrefix + filename;
      audio.load();
    });
  }
}
