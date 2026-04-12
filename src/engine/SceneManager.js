/**
 * SceneManager — registers, switches, and updates scenes.
 * Scenes have enter/exit lifecycle methods.
 * Supports push/pop for overlays (pause menu) that don't destroy the underlying scene.
 */
export class SceneManager {
  constructor() {
    /** @type {Map<string, Object>} */
    this._scenes = new Map();
    /** @type {Object|null} */
    this._current = null;
    /** @type {string|null} */
    this._currentName = null;
    /** @type {Array<{name: string, scene: Object}>} */
    this._stack = [];
  }

  /**
   * Register a scene.
   * @param {string} name
   * @param {Object} scene - Must have enter(), exit(), update(dt), render(ctx, w, h)
   */
  register(name, scene) {
    this._scenes.set(name, scene);
  }

  /**
   * Switch to a registered scene (replaces current).
   * @param {string} name
   */
  change(name) {
    const scene = this._scenes.get(name);
    if (!scene) {
      console.error(`[SceneManager] Scene not found: ${name}`);
      return;
    }

    if (this._current) {
      this._current.exit?.();
    }

    this._current = scene;
    this._currentName = name;
    this._current.enter?.();
  }

  /**
   * Push a scene on top of the stack (overlay — underlying scene stays alive).
   * @param {string} name
   */
  push(name) {
    const scene = this._scenes.get(name);
    if (!scene) {
      console.error(`[SceneManager] Scene not found: ${name}`);
      return;
    }

    if (this._current) {
      this._stack.push({ name: this._currentName, scene: this._current });
    }

    this._current = scene;
    this._currentName = name;
    this._current.enter?.();
  }

  /**
   * Pop the top scene off the stack (returns to the previous scene).
   */
  pop() {
    if (!this._current) return;

    this._current.exit?.();

    if (this._stack.length === 0) {
      this._current = null;
      this._currentName = null;
      return;
    }

    const prev = this._stack.pop();
    this._current = prev.scene;
    this._currentName = prev.name;
  }

  /**
   * Update the active scene.
   * @param {number} dt
   */
  update(dt) {
    this._current?.update?.(dt);
  }

  /**
   * Render the active scene.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  render(ctx, width, height) {
    this._current?.render?.(ctx, width, height);
  }

  /** @returns {string|null} */
  get currentName() {
    return this._currentName;
  }

  /** @returns {Object|null} */
  get current() {
    return this._current;
  }
}
