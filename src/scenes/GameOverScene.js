/**
 * GameOverScene — game over screen with jumpscare aftermath.
 */
import { SCENES, COLORS, UI, CONFIG } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';
import { eventBus } from '../engine/EventBus.js';
import { DEFAULT_NIGHT_ID } from '../data/nights.js';
import { i18n } from '../i18n/index.js';


export class GameOverScene {
  constructor({ baseWidth, baseHeight, onSceneChange, inputManager, ads }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._ads = ads;
    this._elapsed = 0;
    this._canInteract = false;
    this._retryNightId = DEFAULT_NIGHT_ID;
    this._adShowing = false;

    this._onGameOver = ({ nightId }) => {
      this._retryNightId = nightId;
    };
  }


  enter() {
    this._elapsed = 0;
    this._canInteract = false;
    eventBus.on('game:over', this._onGameOver);
    this._bindInput();
  }


  exit() {
    eventBus.off('game:over', this._onGameOver);
    this._inputManager.clearAll();
  }


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
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    Renderer.noise(ctx, w, h, 0.15);

    const alpha = Math.min(1, this._elapsed / 1000);
    ctx.globalAlpha = alpha;

    const fontSizeTitle = Math.min(UI.FONT_TITLE, h * 0.067);
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('gameOverTitle'), w / 2, h * 0.35);

    const fontSizeSub = Math.min(UI.FONT_SUBTITLE, h * 0.025);
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${fontSizeSub}px Courier New`;
    ctx.fillText(i18n.t('gameOverSubtitle'), w / 2, h * 0.48);

    const fontSizeBody = Math.min(UI.FONT_BODY, h * 0.019);
    if (this._canInteract) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      ctx.fillText(i18n.t('gameOverRetry'), w / 2, h * 0.65);
    } else {
      const countdown = Math.ceil((1500 - this._elapsed) / 1000);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = `${fontSizeBody}px Courier New`;
      ctx.fillText(`... ${countdown}`, w / 2, h * 0.65);
    }

    ctx.globalAlpha = 1;

    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.5)');
    Renderer.scanlines(ctx, w, h);
  }


  _bindInput() {
    this._inputManager.on('pointerdown', () => {
      if (!this._canInteract || this._adShowing) return;

      this._adShowing = true;

      const finishGameOver = () => {
        this._adShowing = false;
        this._onSceneChange(SCENES.NIGHT, { nightId: this._retryNightId });
      };

      setTimeout(() => {
        if (this._ads?.showInterstitial) {
          this._ads.showInterstitial({
            onClose: () => finishGameOver(),
            onError: () => finishGameOver(),
          });
        } else {
          finishGameOver();
        }
      }, CONFIG.AD_TRIGGER_DELAY);
    });
  }
}