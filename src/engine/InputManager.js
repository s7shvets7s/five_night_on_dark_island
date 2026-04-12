/**
 * InputManager — unified pointer/keyboard input handler.
 * Converts all input (mouse, touch, keyboard) into normalized game events.
 * Works with the dynamic game resolution.
 */
export class InputManager {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas - Game canvas
   * @param {number} options.baseWidth - Base game width
   * @param {number} options.baseHeight - Base game height
   */
  constructor({ canvas, baseWidth, baseHeight }) {
    this._canvas = canvas;
    this._gameWidth = baseWidth;
    this._gameHeight = baseHeight;

    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();

    /** @type {{x: number, y: number} | null} */
    this._pointerPos = null;

    /** @type {Set<string>} */
    this._keysDown = new Set();

    this._boundPointerDown = this._onPointerDown.bind(this);
    this._boundPointerUp = this._onPointerUp.bind(this);
    this._boundPointerMove = this._onPointerMove.bind(this);
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);

    this._active = false;
  }

  /**
   * Update resolution on window resize.
   * @param {number} width
   * @param {number} height
   */
  updateResolution(width, height) {
    this._gameWidth = width;
    this._gameHeight = height;
  }

  /** @returns {number} */
  get gameWidth() {
    return this._gameWidth;
  }

  /** @returns {number} */
  get gameHeight() {
    return this._gameHeight;
  }

  /** Start listening to input events */
  start() {
    if (this._active) return;
    this._active = true;

    // Pointer events cover both mouse and touch
    this._canvas.addEventListener('pointerdown', this._boundPointerDown);
    this._canvas.addEventListener('pointerup', this._boundPointerUp);
    this._canvas.addEventListener('pointermove', this._boundPointerMove);
    this._canvas.addEventListener('pointercancel', this._boundPointerUp);

    // Keyboard
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  /** Stop listening to input events */
  stop() {
    if (!this._active) return;
    this._active = false;

    this._canvas.removeEventListener('pointerdown', this._boundPointerDown);
    this._canvas.removeEventListener('pointerup', this._boundPointerUp);
    this._canvas.removeEventListener('pointermove', this._boundPointerMove);
    this._canvas.removeEventListener('pointercancel', this._boundPointerUp);

    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
  }

  /**
   * Register an input event listener.
   * Events: 'pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup'
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
  }

  /**
   * Remove an input event listener.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  /**
   * Convenience: register pointerdown listener.
   * @param {Function} callback - receives {x, y} in game coords
   */
  onPointerDown(callback) {
    this.on('pointerdown', (x, y) => callback({ x, y }));
  }

  /** Remove all listeners for all events */
  clearAll() {
    this._listeners.clear();
  }

  /** @returns {boolean} */
  isKeyDown(key) {
    return this._keysDown.has(key.toLowerCase());
  }

  /** @returns {Set<string>} */
  get keysDown() {
    return new Set(this._keysDown);
  }

  /** @returns {{x: number, y: number} | null} Current pointer in game coords */
  get pointerPos() {
    return this._pointerPos;
  }

  /**
   * Check if a rectangle contains the current pointer position.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @returns {boolean}
   */
  isPointerInRect(x, y, w, h) {
    if (!this._pointerPos) return false;
    return (
      this._pointerPos.x >= x &&
      this._pointerPos.x <= x + w &&
      this._pointerPos.y >= y &&
      this._pointerPos.y <= y + h
    );
  }

  /** Convert screen coordinates to game coordinates */
  _screenToGame(clientX, clientY) {
    const rect = this._canvas.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    return {
      x: canvasX,
      y: canvasY,
    };
  }

  /** Emit event to registered listeners */
  _emit(event, ...args) {
    const listeners = this._listeners.get(event);
    if (!listeners) return;
    for (const callback of listeners) {
      callback(...args);
    }
  }

  _onPointerDown(e) {
    e.preventDefault();
    const pos = this._screenToGame(e.clientX, e.clientY);
    this._pointerPos = pos;
    this._emit('pointerdown', pos.x, pos.y, e);
  }

  _onPointerUp(e) {
    e.preventDefault();
    const pos = this._screenToGame(e.clientX, e.clientY);
    this._pointerPos = null;
    this._emit('pointerup', pos.x, pos.y, e);
  }

  _onPointerMove(e) {
    const pos = this._screenToGame(e.clientX, e.clientY);
    this._pointerPos = pos;
    this._emit('pointermove', pos.x, pos.y, e);
  }

  _onKeyDown(e) {
    // Prevent default for game keys only
    if (['Enter', ' ', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    const key = e.key.toLowerCase();
    if (!this._keysDown.has(key)) {
      this._keysDown.add(key);
      this._emit('keydown', key, e);
    }
  }

  _onKeyUp(e) {
    const key = e.key.toLowerCase();
    this._keysDown.delete(key);
    this._emit('keyup', key, e);
  }
}
