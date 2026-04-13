/**
 * VictoryScene — night complete screen.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';
import { eventBus } from '../engine/EventBus.js';
import { i18n } from '../i18n/index.js';

export class VictoryScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.inputManager
   * @param {number} [deps.nightId]
   */
  constructor({ onSceneChange, inputManager, nightId }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._nightId = nightId || DEFAULT_NIGHT_ID;
    this._elapsed = 0;
    this._canInteract = false;
    this._nextNight = DEFAULT_NIGHT_ID;

    eventBus.on('game:victory', ({ night }) => {
      this._nightId = night;
      this._nextNight = Math.min(night + 1, 7);
    });
  }

  enter() {
    this._elapsed = 0;
    this._canInteract = false;
    this._bindInput();
  }

  exit() {
    this._inputManager.clearAll();
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this._elapsed += dt * 1000;
    if (this._elapsed > 3000) {
      this._canInteract = true;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // 6 AM text
    const alpha = Math.min(1, this._elapsed / 1500);
    ctx.globalAlpha = alpha;

    const fontSizeTitle = Math.min(UI.FONT_TITLE, h * 0.067);
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('victoryTitle'), w / 2, h * 0.3);

    // Night complete
    const nightName = NIGHT_MAP[this._nightId]?.name || `Night ${this._nightId}`;
    const fontSizeSub = Math.min(UI.FONT_SUBTITLE, h * 0.025);
    ctx.fillStyle = COLORS.POWER_OK;
    ctx.font = `${fontSizeSub}px Courier New`;
    ctx.fillText(`${nightName} ${i18n.t('victoryComplete')}`, w / 2, h * 0.45);

    // Cheer
    const fontSizeBody = Math.min(UI.FONT_BODY, h * 0.019);
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${fontSizeBody}px Courier New`;
    ctx.fillText(i18n.t('victorySurvived'), w / 2, h * 0.55);

    // Continue prompt
    if (this._canInteract) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      const nextNight = Math.min(this._nightId + 1, 7);
      ctx.fillText(`${i18n.t('victoryClickFor')} ${NIGHT_MAP[nextNight]?.name || 'Next Night'}`, w / 2, h * 0.7);
    }

    ctx.globalAlpha = 1;

    // Subtle vignette
    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.3)');
  }

  _bindInput() {
    this._inputManager.on('pointerdown', () => {
      if (this._canInteract) {
        eventBus.emit('game:night-change', { nightId: this._nextNight });
        this._onSceneChange(SCENES.NIGHT);
      }
    });
  }
}
