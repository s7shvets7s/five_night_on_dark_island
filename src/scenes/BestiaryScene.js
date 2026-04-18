/**
 * BestiaryScene — enemy lore browser.
 * Left: enemy list. Right: sprite + fear indicators + description.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { ENEMY_CONFIG } from '../config/enemyConfig.js';
import { BESTIARY, BESTIARY_FEARS, BESTIARY_ORDER } from '../data/bestiary.js';
import { i18n } from '../i18n/index.js';

export class BestiaryScene {
  constructor({ onSceneChange, inputManager, assetLoader, sfxManager }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._assetLoader = assetLoader;
    this._sfxManager = sfxManager;
    this._buttons = [];
    this._selectedEnemy = null;
    this._zoom = 1.0;
    this._zoomDir = 1;
    this._zoomSpeed = 0.15;
    this._glitchTimer = 0;
    this._glitchIntensity = 0;
  }

  enter() {
    this._zoom = 1.0;
    this._zoomDir = 1;
    this._glitchTimer = 0;
    this._glitchIntensity = 0;
    this._bindInput();
  }

  exit() {
    this._inputManager.clearAll();
  }

  update(dt) {
    this._zoom += this._zoomDir * this._zoomSpeed * dt;
    if (this._zoom >= 1.25) {
      this._zoom = 1.25;
      this._zoomDir = -1;
    } else if (this._zoom <= 1.0) {
      this._zoom = 1.0;
      this._zoomDir = 1;
    }
    this._glitchTimer += dt;
    if (this._glitchTimer > 0.3 + Math.random() * 0.5) {
      this._glitchTimer = 0;
      this._glitchIntensity = 1.0;
    }
    if (this._glitchIntensity > 0) {
      this._glitchIntensity -= dt * 0.15;
    }
  }

  render(ctx, w, h) {
    const fw = Number(w);
    const fh = Number(h);
    if (!isFinite(fw) || !isFinite(fh) || fw < 1 || fh < 1) return;

    this._buttons = [];

    const bgImage = this._assetLoader?.getImage('menusbackground');

    if (bgImage) {
      ctx.save();
      const cx = fw / 2;
      const cy = fh / 2;
      ctx.translate(cx, cy);
      ctx.scale(this._zoom, this._zoom);
      ctx.translate(-cx, -cy);

      const scale = Math.max(fw / bgImage.width, fh / bgImage.height);
      const bw = bgImage.width * scale;
      const bh = bgImage.height * scale;
      const bx = (fw - bw) / 2;
      const by = (fh - bh) / 2;
      ctx.drawImage(bgImage, bx, by, bw, bh);
      ctx.restore();

      if (this._glitchIntensity > 0) {
        this._drawGlitch(ctx, fw, fh);
      }
    } else {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, fw, fh);
    }

    const maxDim = Math.max(fw, fh);
    const vignette = ctx.createRadialGradient(fw / 2, fh / 2, maxDim * 0.2, fw / 2, fh / 2, maxDim * 0.8);
    vignette.addColorStop(0, 'rgba(20, 0, 0, 0.1)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, fw, fh);

    if (this._glitchIntensity > 0) {
      this._drawGlitch(ctx, fw, fh);
    }

    // Title
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${Math.min(36, h * 0.05)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('bestiaryTitle'), w / 2, h * 0.07);

    this._renderEnemyList(ctx, w, h);
    this._renderEnemyDetail(ctx, w, h);
    this._renderBackButton(ctx, w, h);

    this._drawScanlines(ctx, w, h);
  }

  _renderEnemyList(ctx, w, h) {
    const locale = i18n.getLocale();
    const data = BESTIARY[locale];
    const enemyNames = BESTIARY_ORDER;

    const listX = w * 0.04;
    const listY = h * 0.15;
    const listW = w * 0.28;
    const btnH = Math.max(44, h * 0.07);
    const gap = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(listX, listY, listW, enemyNames.length * (btnH + gap) + 12);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, enemyNames.length * (btnH + gap) + 12);

    enemyNames.forEach((enemyId, index) => {
      const config = ENEMY_CONFIG[enemyId];
      const btnY = listY + 6 + index * (btnH + gap);
      const isSelected = this._selectedEnemy === enemyId;

      this._buttons.push({
        label: `enemy_${enemyId}`,
        x: listX + 4,
        y: btnY,
        w: listW - 8,
        h: btnH,
        action: () => {
          this._selectedEnemy = enemyId;
        },
        enabled: true,
      });

      ctx.fillStyle = isSelected ? 'rgba(139, 0, 0, 0.5)' : 'rgba(20, 20, 20, 0.8)';
      ctx.fillRect(listX + 4, btnY, listW - 8, btnH);
      ctx.strokeStyle = isSelected ? COLORS.ACCENT_RED_BRIGHT : COLORS.UI_BORDER;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(listX + 4, btnY, listW - 8, btnH);

      ctx.fillStyle = isSelected ? '#ffffff' : COLORS.TEXT_PRIMARY;
      ctx.font = `bold ${Math.min(18, h * 0.025)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const enemyName = i18n.t(`enemy${config.id.charAt(0).toUpperCase() + config.id.slice(1)}`);
      ctx.fillText(enemyName, listX + listW / 2, btnY + btnH / 2);
    });
  }

  _renderEnemyDetail(ctx, w, h) {
    if (!this._selectedEnemy) return;

    const locale = i18n.getLocale();
    const data = BESTIARY[locale];
    const enemyData = data.enemies[this._selectedEnemy];
    if (!enemyData) return;

    const config = ENEMY_CONFIG[this._selectedEnemy];
    const fears = BESTIARY_FEARS[this._selectedEnemy];
    if (!fears) return;

    const detailX = w * 0.35;
    const detailY = h * 0.14;
    const detailW = w * 0.62;

    // Background panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(detailX, detailY, detailW, h * 0.72);
    ctx.strokeStyle = COLORS.ACCENT_RED;
    ctx.lineWidth = 2;
    ctx.strokeRect(detailX, detailY, detailW, h * 0.72);

    // Enemy name header
    ctx.fillStyle = COLORS.ACCENT_RED_BRIGHT;
    ctx.font = `bold ${Math.min(28, h * 0.04)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const enemyName = i18n.t(`enemy${config.id.charAt(0).toUpperCase() + config.id.slice(1)}`);
    ctx.fillText(enemyName, detailX + detailW / 2, detailY + 30);

    const spriteSize = Math.min(180, w * 0.15, h * 0.28);
    const spriteX = detailX + 40;
    const spriteY = detailY + 70;

    // Sprite frame
    ctx.strokeStyle = COLORS.ACCENT_RED;
    ctx.lineWidth = 3;
    ctx.strokeRect(spriteX, spriteY, spriteSize, spriteSize);

    // Inner frame glow
    ctx.strokeStyle = 'rgba(139, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(spriteX - 4, spriteY - 4, spriteSize + 8, spriteSize + 8);

    // Draw sprite
    const spriteKey = `enemies_${config.id}`;
    const sprite = this._assetLoader?.getImage(spriteKey);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      // Grayscale filter for dossier photo effect
      ctx.save();
      ctx.filter = 'saturate(0%) brightness(80%)';
      ctx.drawImage(sprite, spriteX, spriteY, spriteSize, spriteSize);
      ctx.restore();

      // Black square/shadow over the face area (upper half of sprite)
      const faceH = spriteSize * 0.3;
      const faceY = spriteY + spriteSize * 0.05;
      const faceX = spriteX + spriteSize * 0.15;
      const faceW = spriteSize * 0.7;

      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(faceX, faceY, faceW, faceH);

      // Subtle vignette around face block
      const faceGlow = ctx.createRadialGradient(
        faceX + faceW / 2, faceY + faceH / 2, faceW * 0.3,
        faceX + faceW / 2, faceY + faceH / 2, faceW * 0.8
      );
      faceGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      faceGlow.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = faceGlow;
      ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
    } else {
      // Fallback: draw colored circle with name
      ctx.fillStyle = config.color || '#6644aa';
      ctx.beginPath();
      ctx.arc(spriteX + spriteSize / 2, spriteY + spriteSize / 2, spriteSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.min(14, spriteSize * 0.08)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const enemyName = i18n.t(`enemy${config.id.charAt(0).toUpperCase() + config.id.slice(1)}`);
      ctx.fillText(enemyName, spriteX + spriteSize / 2, spriteY + spriteSize / 2);
    }

    // Fear indicators (right of sprite)
    const fearX = spriteX + spriteSize + 30;
    const fearY = spriteY + 10;
    const fearLabelH = 36;
    const fearGap = 12;
    const fearLabelW = Math.min(140, detailW - (fearX - detailX) - 30);

    this._renderFearBadge(ctx, fearX, fearY, fearLabelW, fearLabelH, data.light, fears.fearsLight, h);
    this._renderFearBadge(ctx, fearX, fearY + fearLabelH + fearGap, fearLabelW, fearLabelH, data.door, fears.fearsDoor, h);
    this._renderFearBadge(ctx, fearX, fearY + (fearLabelH + fearGap) * 2, fearLabelW, fearLabelH, data.mask, fears.fearsMask, h);

    // Description (bottom of panel)
    const descX = detailX + 30;
    const descY = spriteY + spriteSize + 30;
    const descW = detailW - 60;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${Math.min(16, h * 0.022)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this._wrapText(ctx, enemyData.description, descX, descY, descW, Math.min(22, h * 0.03));
  }

  _renderFearBadge(ctx, x, y, w, h, label, fearsIt, gameH) {
    const bgColor = fearsIt ? 'rgba(30, 80, 30, 0.6)' : 'rgba(80, 20, 20, 0.6)';
    const borderColor = fearsIt ? '#44aa44' : '#aa4444';
    const textColor = fearsIt ? '#88ff88' : '#ff8888';

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Label on left
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${Math.min(14, gameH * 0.02)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 10, y + h * 0.35);

    // Status on right
    const statusText = fearsIt ? '✓' : '✗';
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.min(16, gameH * 0.022)}px Courier New`;
    ctx.textAlign = 'right';
    ctx.fillText(statusText, x + w - 10, y + h * 0.35);
  }

  _renderBackButton(ctx, w, h) {
    const locale = i18n.getLocale();
    const data = BESTIARY[locale];

    const btnW = Math.min(140, w * 0.15);
    const btnH = Math.max(44, h * 0.06);
    const btnX = (w - btnW) / 2;
    const btnY = h - btnH - UI.PADDING;

    this._buttons.push({
      label: 'back',
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      action: () => this._onSceneChange(SCENES.TITLE),
      enabled: true,
    });

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${Math.min(16, h * 0.022)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.back, w / 2, btnY + btnH / 2);
  }

  _drawScanlines(ctx, w, h) {
    const spacing = Math.max(3, h * 0.004);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < h; y += spacing) {
      ctx.fillRect(0, y, w, 1);
    }
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
  }

  _bindInput() {
    this._inputManager.on('pointerdown', (x, y) => {
      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.enabled && btn.action) {
            this._sfxManager?.play('buttonClick');
            btn.action();
          }
          return;
        }
      }
    });
  }

  _drawGlitch(ctx, w, h) {
    const intensity = Math.max(0, this._glitchIntensity);
    if (intensity <= 0) return;

    const noiseMultiplier = intensity;

    if (Math.random() < 0.5 * noiseMultiplier) {
      const numLines = Math.floor(Math.random() * 10 * noiseMultiplier + 4);
      for (let i = 0; i < numLines; i++) {
        const ny = Math.random() * h;
        const nh = Math.random() * 8 + 3;
        ctx.fillStyle = `rgba(180, 180, 180, ${Math.random() * 0.3 * noiseMultiplier})`;
        ctx.fillRect(0, ny, w, nh);
      }
    }
  }
}
