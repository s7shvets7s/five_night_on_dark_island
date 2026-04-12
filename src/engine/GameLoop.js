/**
 * GameLoop — requestAnimationFrame-based loop with delta time and accumulator.
 * Decouples update from render for stable physics/logic regardless of frame rate.
 * Supports dynamic start/stop and protects against large dt spikes.
 */
export class GameLoop {
  /**
   * @param {Object} options
   * @param {number} options.targetFPS - Target frames per second
   * @param {number} options.maxDeltaTime - Maximum allowed dt to prevent spiral of death
   * @param {Function} options.onUpdate - Called with (dt) each frame
   * @param {Function} options.onRender - Called each frame after update
   */
  constructor({ targetFPS = 60, maxDeltaTime = 0.25, onUpdate, onRender }) {
    this._targetFPS = targetFPS;
    this._frameInterval = 1 / targetFPS;
    this._maxDeltaTime = maxDeltaTime;
    this._onUpdate = onUpdate;
    this._onRender = onRender;

    this._running = false;
    this._rafId = null;
    this._lastTime = 0;
    this._accumulator = 0;
  }

  /** Start the game loop */
  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._rafId = requestAnimationFrame((t) => this._tick(t));
  }

  /** Stop the game loop */
  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /** @returns {boolean} */
  get isRunning() {
    return this._running;
  }

  /** Main tick — called by rAF */
  _tick(timestamp) {
    if (!this._running) return;

    let frameTime = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;

    // Clamp dt to prevent spiral of death on tab switch / GC pause
    if (frameTime > this._maxDeltaTime) {
      frameTime = this._maxDeltaTime;
    }

    this._accumulator += frameTime;

    // Fixed-step updates with accumulator
    while (this._accumulator >= this._frameInterval) {
      this._onUpdate(this._frameInterval);
      this._accumulator -= this._frameInterval;
    }

    this._onRender();

    this._rafId = requestAnimationFrame((t) => this._tick(t));
  }
}
