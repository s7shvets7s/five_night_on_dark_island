import { SCENES, COLORS, UI, GAME_TITLE, GAME_VERSION, gameState } from '../config/gameConfig.js';
import { i18n } from '../i18n/index.js';
import { eventBus } from '../engine/EventBus.js';

export class TitleScene {
  constructor({ onSceneChange, inputManager, audioManager, sfxManager }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._buttons = [];
    this._pulsePhase = 0;
  }

  enter() {
    this._pulsePhase = 0;
    this._bindInput();
  }

  exit() {
    this._inputManager.clearAll();
  }

  update(dt) {
    this._pulsePhase += dt * 2;
  }

  render(ctx, w, h) {
    const fw = Number(w);
    const fh = Number(h);
    if (!isFinite(fw) || !isFinite(fh) || fw < 1 || fh < 1) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, fw, fh);

    const maxDim = Math.max(fw, fh);
    const vignette = ctx.createRadialGradient(fw / 2, fh / 2, maxDim * 0.2, fw / 2, fh / 2, maxDim * 0.8);
    vignette.addColorStop(0, 'rgba(20, 0, 0, 0.1)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, fw, fh);

    const fontSizeTitle = Math.min(48, h * 0.067);
    ctx.fillStyle = '#8b0000';
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GAME_TITLE, w / 2, h * 0.25);

    const fontSizeSub = Math.min(14, h * 0.019);
    ctx.fillStyle = '#555';
    ctx.font = `${fontSizeSub}px Courier New`;
    ctx.fillText(i18n.t('titleSubtitle'), w / 2, h * 0.32);

    this._renderButtons(ctx, w, h);

    const alpha = 0.4 + Math.sin(this._pulsePhase) * 0.3;
    const fontSizePulse = Math.min(18, h * 0.025);
    ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
    ctx.font = `${fontSizePulse}px Courier New`;
    ctx.fillText(i18n.t('titleClickStart'), w / 2, h * 0.85);

    const fontSizeVer = Math.min(11, h * 0.015);
    ctx.fillStyle = '#333';
    ctx.font = `${fontSizeVer}px Courier New`;
    ctx.fillText(`v${GAME_VERSION}`, w / 2, h * 0.92);

    ctx.fillStyle = '#2a2a2a';
    ctx.font = `${Math.max(9, h * 0.012)}px Courier New`;
    ctx.fillText('Music: Retro Indie Josh (CC BY 4.0)', w / 2, h * 0.96);

    this._drawScanlines(ctx, w, h);
  }

  _renderButtons(ctx, w, h) {
    this._buttons = [];

    const btnW = Math.min(200, w * 0.35);
    const btnH = Math.max(44, h * 0.08);
    const btnX = (w - btnW) / 2;
    const startY = h * 0.42;
    const gap = 16;

    const labels = [
      i18n.t('menuPlay'),
      i18n.t('menuSettings'),
      i18n.t('menuExit'),
    ];

    labels.forEach((label, i) => {
      const btnY = startY + i * (btnH + gap);
      this._buttons.push({ label, x: btnX, y: btnY, w: btnW, h: btnH });

      ctx.fillStyle = COLORS.UI_BG;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `bold ${Math.min(16, h * 0.022)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, btnY + btnH / 2);
    });
  }

  _drawScanlines(ctx, w, h) {
    const spacing = Math.max(3, h * 0.004);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < h; y += spacing) {
      ctx.fillRect(0, y, w, 1);
    }
  }

  _bindInput() {
    this._inputManager.on('pointerdown', (x, y) => {
      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this._handleButtonClick(btn.label);
          return;
        }
      }
      this._onSceneChange(SCENES.NIGHT_SELECT);
    });

    this._inputManager.on('keydown', (key) => {
      if (key === 'enter' || key === ' ') {
        this._onSceneChange(SCENES.NIGHT_SELECT);
      }
    });
  }

  _handleButtonClick(label) {
    this._sfxManager?.play('buttonClick');
    if (label === i18n.t('menuPlay')) {
      this._onSceneChange(SCENES.NIGHT_SELECT);
    } else if (label === i18n.t('menuSettings')) {
      this._onSceneChange(SCENES.SETTINGS);
    } else if (label === i18n.t('menuExit')) {
      this._onSceneChange(SCENES.CONFIRM_EXIT);
    }
  }
}