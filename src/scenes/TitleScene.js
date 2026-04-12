import { SCENES } from '../config/gameConfig.js';

/**
 * TitleScene — main menu / title screen.
 * Shows game title, subtitle, and responds to user input
 * (click, tap, Enter, Space) to proceed to the next module.
 */
export class TitleScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange - Callback to switch scenes
   * @param {Object} deps.inputManager - InputManager for unified input
   */
  constructor({ onSceneChange, inputManager }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._pulsePhase = 0;
  }

  /** Called when scene becomes active */
  enter() {
    this._pulsePhase = 0;
    this._onPointerDown = () => this._proceed();
    this._onKeyDown = (key) => {
      if (key === 'enter' || key === ' ') {
        this._proceed();
      }
    };
    this._inputManager.on('pointerdown', this._onPointerDown);
    this._inputManager.on('keydown', this._onKeyDown);
  }

  exit() {
    this._inputManager.off('pointerdown', this._onPointerDown);
    this._inputManager.off('keydown', this._onKeyDown);
  }

  /**
   * Update animation state.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this._pulsePhase += dt * 2;
  }

  /**
   * Render title screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const maxDim = Math.max(w, h);
    const vignette = ctx.createRadialGradient(w / 2, h / 2, maxDim * 0.2, w / 2, h / 2, maxDim * 0.8);
    vignette.addColorStop(0, 'rgba(20, 0, 0, 0.1)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Title
    const fontSizeTitle = Math.min(48, h * 0.067);
    ctx.fillStyle = '#8b0000';
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ISLAND NIGHT WATCH', w / 2, h * 0.3);

    // Subtitle
    const fontSizeSub = Math.min(14, h * 0.019);
    ctx.fillStyle = '#555';
    ctx.font = `${fontSizeSub}px Courier New`;
    ctx.fillText('A survival horror experience', w / 2, h * 0.38);

    // Pulsing "press to start"
    const alpha = 0.4 + Math.sin(this._pulsePhase) * 0.3;
    const fontSizePulse = Math.min(18, h * 0.025);
    ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
    ctx.font = `${fontSizePulse}px Courier New`;
    ctx.fillText('[ CLICK OR PRESS ENTER TO START ]', w / 2, h * 0.6);

    // Version / module info
    const fontSizeVer = Math.min(11, h * 0.015);
    ctx.fillStyle = '#333';
    ctx.font = `${fontSizeVer}px Courier New`;
    ctx.fillText('Module 1 — Core Framework', w / 2, h * 0.85);

    // Scanlines
    this._drawScanlines(ctx, w, h);
  }

  /** Transition to next scene */
  _proceed() {
    console.log('[TitleScene] Starting Night 1...');
    this._onSceneChange(SCENES.NIGHT);
  }

  /** Draw subtle scanline overlay */
  _drawScanlines(ctx, w, h) {
    const spacing = Math.max(3, h * 0.004);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < h; y += spacing) {
      ctx.fillRect(0, y, w, 1);
    }
  }
}
