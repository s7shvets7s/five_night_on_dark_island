import { SCENES, COLORS, UI, gameState } from '../config/gameConfig.js';
import { NIGHTS } from '../data/nights.js';
import { i18n } from '../i18n/index.js';
import { eventBus } from '../engine/EventBus.js';

export class NightSelectScene {
  constructor({ onSceneChange, inputManager, sfxManager }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._sfxManager = sfxManager;
    this._buttons = [];
  }

  enter() {
    this._bindInput();
  }

  exit() {
    this._inputManager.clearAll();
  }

  update(dt) {}

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

    const fontSizeTitle = Math.min(36, h * 0.05);
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('nightSelectTitle'), w / 2, h * 0.1);

    this._renderButtons(ctx, w, h);

    this._drawScanlines(ctx, w, h);
  }

  _renderButtons(ctx, w, h) {
    this._buttons = [];

    const unlockedNight = gameState.getUnlockedNight();
    const columns = 4;
    const btnW = Math.min(120, (w * 0.8) / columns - 12);
    const btnH = Math.max(50, h * 0.12);
    const startX = (w - (columns * btnW + (columns - 1) * 12)) / 2;
    const startY = h * 0.2;
    const gapX = 12;
    const gapY = 12;

    NIGHTS.forEach((night, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const btnX = startX + col * (btnW + gapX);
      const btnY = startY + row * (btnH + gapY);

      const isUnlocked = night.id <= unlockedNight;
      const isCompleted = gameState.isNightCompleted(night.id);

      let bgColor = COLORS.UI_BG;
      let textColor = COLORS.TEXT_PRIMARY;
      let borderColor = COLORS.UI_BORDER;
      const label = night.name;
      let sublabel = '';

      if (!isUnlocked) {
        bgColor = '#1a1a1a';
        textColor = '#444444';
        borderColor = '#222222';
        sublabel = i18n.t('nightLocked');
      } else if (isCompleted) {
        bgColor = '#1a2a1a';
        textColor = COLORS.POWER_OK;
        borderColor = '#2a4a2a';
        sublabel = i18n.t('nightComplete');
      }

      this._buttons.push({
        nightId: night.id,
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        enabled: isUnlocked,
      });

      ctx.fillStyle = bgColor;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isUnlocked ? 2 : 1;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.min(16, h * 0.022)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, btnX + btnW / 2, btnY + btnH / 2 - 8);

      if (sublabel) {
        ctx.font = `${Math.min(11, h * 0.015)}px Courier New`;
        ctx.fillText(sublabel, btnX + btnW / 2, btnY + btnH / 2 + 12);
      }
    });

    const backBtnW = Math.min(120, w * 0.2);
    const backBtnH = Math.max(40, h * 0.06);
    const backBtnX = (w - backBtnW) / 2;
    const backBtnY = h - backBtnH - UI.PADDING;

    this._buttons.push({
      label: 'back',
      x: backBtnX,
      y: backBtnY,
      w: backBtnW,
      h: backBtnH,
      enabled: true,
    });

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(backBtnX, backBtnY, backBtnW, backBtnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(backBtnX, backBtnY, backBtnW, backBtnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsBack'), w / 2, backBtnY + backBtnH / 2);
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
          if (!btn.enabled) return;

          this._sfxManager?.play('buttonClick');

          if (btn.nightId) {
            eventBus.emit('game:night-change', { nightId: btn.nightId });
            this._onSceneChange(SCENES.NIGHT);
          } else {
            this._onSceneChange(SCENES.TITLE);
          }
          return;
        }
      }
    });
  }
}