/**
 * VictoryScene — night complete screen.
 */
import { SCENES, COLORS, UI, CONFIG } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';
import { eventBus } from '../engine/EventBus.js';
import { i18n } from '../i18n/index.js';


export class VictoryScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.inputManager
   * @param {Object} [deps.ads]
   * @param {number} [deps.nightId]
   */
  constructor({ onSceneChange, inputManager, ads, nightId }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._ads = ads;
    this._nightId = nightId || DEFAULT_NIGHT_ID;
    this._elapsed = 0;
    this._canInteract = false;
    this._adShowing = false;

    this._onVictory = ({ night }) => {
      this._nightId = night;
    };
  }


  enter() {
    this._elapsed = 0;
    this._canInteract = false;
    eventBus.on('game:victory', this._onVictory);
    this._bindInput();
  }


  exit() {
    eventBus.off('game:victory', this._onVictory);
    this._inputManager.clearAll();
  }


  /**
   * @param {number} dt
   */
  update(dt) {
    this._elapsed += dt * 1000;
    if (this._elapsed > 1500) {
      this._canInteract = true;
    }
  }


  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const alpha = Math.min(1, this._elapsed / 1500);
    ctx.globalAlpha = alpha;

    const fontSizeTitle = Math.min(UI.FONT_TITLE, h * 0.067);
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('victoryTitle'), w / 2, h * 0.3);

    const nightName = i18n.t(`nightName${this._nightId}`);
    const fontSizeSub = Math.min(UI.FONT_SUBTITLE, h * 0.025);
    ctx.fillStyle = COLORS.POWER_OK;
    ctx.font = `${fontSizeSub}px Courier New`;
    ctx.fillText(`${nightName} ${i18n.t('victoryComplete')}`, w / 2, h * 0.45);

    const fontSizeBody = Math.min(UI.FONT_BODY, h * 0.019);
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${fontSizeBody}px Courier New`;
    ctx.fillText(i18n.t('victorySurvived'), w / 2, h * 0.55);

    if (this._canInteract) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      ctx.fillText(i18n.t('victoryClickFor') + ' ' + i18n.t('menuPlay'), w / 2, h * 0.7);
    } else {
      const countdown = Math.ceil((1500 - this._elapsed) / 1000);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      ctx.fillText(`... ${countdown}`, w / 2, h * 0.7);
    }

    ctx.globalAlpha = 1;

    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.3)');
  }


  _bindInput() {
    this._inputManager.on('pointerdown', () => {
      if (!this._canInteract || this._adShowing) return;

      this._adShowing = true;

      const finishVictory = () => {
        this._adShowing = false;
        this._onSceneChange(SCENES.TITLE);
      };

      setTimeout(() => {
        if (this._ads?.showInterstitial) {
          this._ads.showInterstitial({
            onClose: () => finishVictory(),
            onError: () => finishVictory(),
          });
        } else {
          finishVictory();
        }
      }, CONFIG.AD_TRIGGER_DELAY);
    });
  }
}