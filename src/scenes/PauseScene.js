/**
 * PauseScene — pause menu overlay.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';

export class PauseScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.inputManager
   */
  constructor({ onSceneChange, onResume, inputManager }) {
    this._onSceneChange = onSceneChange;
    this._onResume = onResume;
    this._inputManager = inputManager;
    this._buttons = [];
  }

  enter() {
    this._bindInput();
  }

  exit() {
    this._inputManager.clearAll();
  }

  update() {}

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // Menu box
    const boxW = w * 0.4;
    const boxH = h * 0.5;
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    const fontSizeSub = Math.min(UI.FONT_SUBTITLE, h * 0.025);
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${fontSizeSub}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PAUSED', w / 2, boxY + UI.PADDING);

    // Buttons
    this._buttons = [];
    const btnW = boxW * 0.7;
    const btnH = Math.max(44, h * 0.06);
    const btnX = (w - btnW) / 2;
    const labels = ['Resume', 'Restart Night', 'Quit to Title'];

    labels.forEach((label, i) => {
      const btnY = boxY + UI.PADDING + 50 + i * (btnH + 12);
      this._buttons.push({ label, x: btnX, y: btnY, w: btnW, h: btnH });

      ctx.fillStyle = COLORS.UI_BG;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      const fontSizeBody = Math.min(UI.FONT_BODY, h * 0.019);
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, btnY + btnH / 2);
    });

    // Vignette
    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.3)');
  }

  _bindInput() {
    this._inputManager.onPointerDown(({ x, y }) => {
      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this._handleButtonClick(btn.label);
          return;
        }
      }
    });
  }

  _handleButtonClick(label) {
    switch (label) {
      case 'Resume':
        if (this._onResume) {
          this._onResume();
        }
        break;
      case 'Restart Night':
        this._onSceneChange(SCENES.NIGHT);
        break;
      case 'Quit to Title':
        this._onSceneChange(SCENES.TITLE);
        break;
    }
  }
}
