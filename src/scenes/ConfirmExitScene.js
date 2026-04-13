import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { i18n } from '../i18n/index.js';

export class ConfirmExitScene {
  constructor({ onSceneChange, inputManager }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._buttons = [];
  }

  enter() {
    this._bindInput();
    i18n.onChange(() => this._render());
  }

  exit() {
    this._inputManager.clearAll();
    i18n.offChange(() => this._render());
  }

  update(dt) {}

  render(ctx, w, h) {
    const fw = Number(w);
    const fh = Number(h);
    if (!isFinite(fw) || !isFinite(fh) || fw < 1 || fh < 1) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, fw, fh);

    const boxW = Math.min(350, w * 0.5);
    const boxH = Math.min(200, h * 0.3);
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = COLORS.ACCENT_RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const fontSizeTitle = Math.min(28, h * 0.04);
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('confirmExitTitle'), w / 2, boxY + boxH * 0.25);

    const fontSizeMsg = Math.min(14, h * 0.02);
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${fontSizeMsg}px Courier New`;
    ctx.fillText(i18n.t('confirmExitMessage'), w / 2, boxY + boxH * 0.45);

    this._renderButtons(ctx, w, h, boxX, boxY, boxW, boxH);
  }

  _renderButtons(ctx, w, h, boxX, boxY, boxW, boxH) {
    this._buttons = [];

    const btnW = Math.min(120, boxW * 0.4);
    const btnH = Math.max(36, h * 0.05);
    const gap = 16;

    const labels = [
      { label: i18n.t('confirmExitYes'), action: 'yes' },
      { label: i18n.t('confirmExitNo'), action: 'no' },
    ];

    const totalW = labels.length * btnW + (labels.length - 1) * gap;
    const startX = boxX + (boxW - totalW) / 2;
    const btnY = boxY + boxH * 0.65;

    labels.forEach((item, i) => {
      const btnX = startX + i * (btnW + gap);

      this._buttons.push({
        label: item.label,
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        action: item.action,
        enabled: true,
      });

      const bgColor = item.action === 'yes' ? '#3a1a1a' : COLORS.UI_BG;
      const borderColor = item.action === 'yes' ? COLORS.ACCENT_RED : COLORS.UI_BORDER;
      const textColor = item.action === 'yes' ? COLORS.ACCENT_RED : COLORS.TEXT_PRIMARY;

      ctx.fillStyle = bgColor;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.min(12, h * 0.016)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, btnX + btnW / 2, btnY + btnH / 2);
    });
  }

  _bindInput() {
    this._inputManager.on('pointerdown', (x, y) => {
      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.enabled && btn.action) {
            this._handleAction(btn.action);
          }
          return;
        }
      }
    });
  }

  _handleAction(action) {
    if (action === 'yes') {
      window.close();
    } else if (action === 'no') {
      this._onSceneChange(SCENES.TITLE);
    }
  }
}