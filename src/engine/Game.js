import { GameLoop } from './GameLoop.js';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { AssetLoader } from './AssetLoader.js';
import { TARGET_FPS, START_SCENE } from '../config/gameConfig.js';

/**
 * Game — main orchestrator.
 * Creates canvas context, initializes SceneManager, GameLoop,
 * InputManager, and AssetLoader. Handles dynamic resize.
 */
export class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');

    this._gameWidth = 1280;
    this._gameHeight = 720;

    // Core systems
    this._sceneManager = new SceneManager();
    this._inputManager = new InputManager({
      canvas,
      baseWidth: this._gameWidth,
      baseHeight: this._gameHeight,
    });
    this._assetLoader = new AssetLoader();

    // GameLoop handles fixed-step updates with rAF rendering
    this._gameLoop = new GameLoop({
      targetFPS: TARGET_FPS,
      maxDeltaTime: 0.25,
      onUpdate: (dt) => this._update(dt),
      onRender: () => this._render(),
    });

    this._resize();
    this._bindResize();
  }

  /** @returns {SceneManager} */
  get sceneManager() {
    return this._sceneManager;
  }

  /** @returns {InputManager} */
  get inputManager() {
    return this._inputManager;
  }

  /** @returns {AssetLoader} */
  get assetLoader() {
    return this._assetLoader;
  }

  /** @returns {number} */
  get baseWidth() {
    return this._gameWidth;
  }

  /** @returns {number} */
  get baseHeight() {
    return this._gameHeight;
  }

  /** @returns {HTMLCanvasElement} */
  get canvas() {
    return this._canvas;
  }

  /** Register a scene by name */
  registerScene(name, scene) {
    this._sceneManager.register(name, scene);
  }

  /** Start the game — switches to START_SCENE and begins the loop */
  start() {
    this._inputManager.start();
    this._sceneManager.change(START_SCENE);
    this._gameLoop.start();
  }

  /** Stop the game loop and input */
  stop() {
    this._gameLoop.stop();
    this._inputManager.stop();
  }

  /** Handle window resize — dynamically adjusts game resolution */
  _resize() {
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    if (displayWidth === 0 || displayHeight === 0) return;

    this._canvas.width = displayWidth;
    this._canvas.height = displayHeight;

    this._gameWidth = displayWidth;
    this._gameHeight = displayHeight;

    this._inputManager.updateResolution(this._gameWidth, this._gameHeight);
  }

  /** Bind resize listener with debounce */
  _bindResize() {
    let timeoutId = null;
    window.addEventListener('resize', () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => this._resize(), 50);
    });
  }

  /** Per-frame update — delegates to active scene */
  _update(dt) {
    this._sceneManager.update(dt);
  }

  /** Per-frame render — delegates to active scene */
  _render() {
    const ctx = this._ctx;
    const cw = this._canvas.width;
    const ch = this._canvas.height;
    const gw = this._gameWidth;
    const gh = this._gameHeight;

    if (!gw || !gh || gw < 1 || gh < 1 || !isFinite(gw) || !isFinite(gh)) {
      return;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    try {
      this._sceneManager.render(ctx, gw, gh);
    } catch (e) {
      console.error('[Game] Render error:', e);
    }
    ctx.restore();
  }
}
