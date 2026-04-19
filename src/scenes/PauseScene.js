/**
 * PauseScene — pause menu overlay.
 */
import { SCENES, COLORS, UI, CONFIG } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';
import { eventBus } from '../engine/EventBus.js';
import { i18n } from '../i18n/index.js';


export class PauseScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Function} deps.onResume
   * @param {Object} deps.inputManager
   * @param {Object} [deps.sfxManager]
   * @param {Object} [deps.ads]
   * @param {string|number} deps.nightId
   */
  constructor({ onSceneChange, onResume, inputManager, sfxManager, ads, nightId }) {
    this._onSceneChange = onSceneChange;
    this._onResume = onResume;
    this._inputManager = inputManager;
    this._sfxManager = sfxManager;
    this._ads = ads;
    this._nightId = nightId;
    this._buttons = [];
    this._pointerDownHandler = null;
    this._adShowing = false;
  }


  enter() {
    this._bindInput();
    this._onNightChange = ({ nightId }) => {
      this._nightId = nightId;
    };
    eventBus.on('game:night-change', this._onNightChange);
  }


  exit() {
    if (this._pointerDownHandler) {
      this._inputManager.off('pointerdown', this._pointerDownHandler);
      this._pointerDownHandler = null;
    }
    eventBus.off('game:night-change', this._onNightChange);
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
    ctx.fillText(i18n.t('pauseTitle'), w / 2, boxY + UI.PADDING);


    // Buttons
    this._buttons = [];
    const btnW = boxW * 0.7;
    const btnH = Math.max(44, h * 0.06);
    const btnX = (w - btnW) / 2;
    const labels = [
      i18n.t('pauseResume'),
      i18n.t('pauseRestart'),
      i18n.t('pauseQuit'),
    ];


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
    this._pointerDownHandler = (x, y) => {
      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this._handleButtonClick(btn.label);
          return;
        }
      }
    };
    this._inputManager.on('pointerdown', this._pointerDownHandler);
  }


  _handleButtonClick(label) {
    if (this._adShowing) return;
    this._sfxManager?.play('buttonClick');

    if (label === i18n.t('pauseResume')) {
      if (this._onResume) {
        this._onResume();
      }

    } else if (label === i18n.t('pauseRestart')) {
      this._adShowing = true;

      const finishRestart = () => {
        this._adShowing = false;
        // Сначала переключаем сцену, передавая nightId напрямую —
        // так NightScene получит его при создании, а не через eventBus
        this._onSceneChange(SCENES.NIGHT, { nightId: this._nightId });
      };

      setTimeout(() => {
        if (this._ads?.showInterstitial) {
          // Используем колбэки Яндекс SDK — onClose срабатывает
          // ровно в момент закрытия рекламы, без лишних setTimeout
          this._ads.showInterstitial({
            onClose: (_wasShown) => {
              finishRestart();
            },
            onError: (_error) => {
              // При ошибке тоже рестартим, чтобы игра не зависла
              finishRestart();
            },
          });
        } else {
          // Рекламного менеджера нет — сразу рестарт
          finishRestart();
        }
      }, CONFIG.AD_TRIGGER_DELAY);

    } else if (label === i18n.t('pauseQuit')) {
      this._onSceneChange(SCENES.TITLE);
    }
  }
}