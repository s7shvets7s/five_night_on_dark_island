import { SCENES, COLORS, UI, gameState } from '../config/gameConfig.js';
import { i18n } from '../i18n/index.js';
import { eventBus } from '../engine/EventBus.js';

export class SettingsScene {
  constructor({ onSceneChange, inputManager, audioManager, sfxManager, assetLoader = null }) {
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._assetLoader = assetLoader;
    this._buttons = [];
    this._draggingMaster = false;
    this._draggingMusic = false;
    this._draggingSFX = false;
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
    i18n.setLocale(gameState.getLocale());
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

    const fontSizeTitle = Math.min(36, h * 0.05);
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${fontSizeTitle}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsTitle'), w / 2, h * 0.1);

    this._renderLanguageButtons(ctx, w, h);
    this._renderMasterVolumeSlider(ctx, w, h);
    this._renderMusicVolumeSlider(ctx, w, h);
    this._renderSFXVolumeSlider(ctx, w, h);
    this._renderBackButton(ctx, w, h);

    this._drawScanlines(ctx, w, h);
  }

  _renderLanguageButtons(ctx, w, h) {
    const btnW = Math.min(80, w * 0.12);
    const btnH = Math.max(36, h * 0.05);
    const startY = h * 0.25;

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsLanguage') + ':', w * 0.25, startY + btnH / 2);

    const currentLocale = i18n.getLocale();
    const languages = [
      { code: 'ru', label: 'Русский' },
      { code: 'en', label: 'English' },
    ];

    const gap = 8;
    const totalW = languages.length * btnW + (languages.length - 1) * gap;
    const startX = w * 0.55;

    languages.forEach((lang, i) => {
      const btnX = startX + i * (btnW + gap);
      const isActive = lang.code === currentLocale;

      this._buttons.push({
        label: 'lang_' + lang.code,
        x: btnX,
        y: startY,
        w: btnW,
        h: btnH,
        action: () => {
          if (!isActive) {
            i18n.setLocale(lang.code);
            gameState.setLocale(lang.code);
          }
        },
        enabled: !isActive,
      });

      ctx.fillStyle = isActive ? '#3a1a1a' : COLORS.UI_BG;
      ctx.fillRect(btnX, startY, btnW, btnH);
      ctx.strokeStyle = isActive ? COLORS.ACCENT_RED : COLORS.UI_BORDER;
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(btnX, startY, btnW, btnH);

      ctx.fillStyle = isActive ? COLORS.ACCENT_RED : COLORS.TEXT_SECONDARY;
      ctx.font = `bold ${Math.min(11, h * 0.015)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lang.label, btnX + btnW / 2, startY + btnH / 2);
    });
  }

  _renderMasterVolumeSlider(ctx, w, h) {
    const sliderW = Math.min(200, w * 0.4);
    const sliderH = 8;
    const startY = h * 0.42;
    const knobR = 12;

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsVolume') + ':', w * 0.25, startY + knobR);

    const sliderX = w * 0.55;
    const sliderY = startY + knobR - sliderH / 2;

    this._masterSlider = {
      x: sliderX,
      y: sliderY,
      w: sliderW,
      h: sliderH,
    };

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(sliderX, sliderY, sliderW, sliderH);

    const volume = gameState.getVolume();
    const fillW = volume * sliderW;
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.fillRect(sliderX, sliderY, fillW, sliderH);

    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(sliderX, sliderY, sliderW, sliderH);

    const knobX = sliderX + fillW;
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.beginPath();
    ctx.arc(knobX, sliderY + sliderH / 2, knobR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `${Math.min(10, h * 0.014)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(volume * 100) + '%', knobX, sliderY + sliderH / 2);
  }

  _renderMusicVolumeSlider(ctx, w, h) {
    const sliderW = Math.min(200, w * 0.4);
    const sliderH = 8;
    const startY = h * 0.54;
    const knobR = 12;

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsMusic') + ':', w * 0.25, startY + knobR);

    const sliderX = w * 0.55;
    const sliderY = startY + knobR - sliderH / 2;

    this._musicSlider = {
      x: sliderX,
      y: sliderY,
      w: sliderW,
      h: sliderH,
    };

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(sliderX, sliderY, sliderW, sliderH);

    const volume = gameState.getMusicVolume();
    const fillW = volume * sliderW;
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.fillRect(sliderX, sliderY, fillW, sliderH);

    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(sliderX, sliderY, sliderW, sliderH);

    const knobX = sliderX + fillW;
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.beginPath();
    ctx.arc(knobX, sliderY + sliderH / 2, knobR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `${Math.min(10, h * 0.014)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(volume * 100) + '%', knobX, sliderY + sliderH / 2);
  }

  _renderSFXVolumeSlider(ctx, w, h) {
    const sliderW = Math.min(200, w * 0.4);
    const sliderH = 8;
    const startY = h * 0.66;
    const knobR = 12;

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsSFX') + ':', w * 0.25, startY + knobR);

    const sliderX = w * 0.55;
    const sliderY = startY + knobR - sliderH / 2;

    this._sfxSlider = {
      x: sliderX,
      y: sliderY,
      w: sliderW,
      h: sliderH,
    };

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(sliderX, sliderY, sliderW, sliderH);

    const volume = gameState.getSFXVolume();
    const fillW = volume * sliderW;
    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.fillRect(sliderX, sliderY, fillW, sliderH);

    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(sliderX, sliderY, sliderW, sliderH);

    const knobX = sliderX + fillW;
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.beginPath();
    ctx.arc(knobX, sliderY + sliderH / 2, knobR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = `${Math.min(10, h * 0.014)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(volume * 100) + '%', knobX, sliderY + sliderH / 2);
  }

  _renderBackButton(ctx, w, h) {
    const btnW = Math.min(120, w * 0.2);
    const btnH = Math.max(40, h * 0.06);
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
    ctx.font = `bold ${Math.min(14, h * 0.02)}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('settingsBack'), w / 2, btnY + btnH / 2);
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
      if (this._masterSlider) {
        const s = this._masterSlider;
        if (x >= s.x && x <= s.x + s.w && y >= s.y - 10 && y <= s.y + s.h + 10) {
          this._draggingMaster = true;
          this._updateMasterVolume(x);
          return;
        }
      }

      if (this._musicSlider) {
        const s = this._musicSlider;
        if (x >= s.x && x <= s.x + s.w && y >= s.y - 10 && y <= s.y + s.h + 10) {
          this._draggingMusic = true;
          this._updateMusicVolume(x);
          return;
        }
      }

      if (this._sfxSlider) {
        const s = this._sfxSlider;
        if (x >= s.x && x <= s.x + s.w && y >= s.y - 10 && y <= s.y + s.h + 10) {
          this._draggingSFX = true;
          this._updateSFXVolume(x);
          return;
        }
      }

      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          if (btn.enabled && btn.action) {
            btn.action();
          }
          return;
        }
      }
    });

    this._inputManager.on('pointermove', (x, y) => {
      if (this._draggingMaster) {
        this._updateMasterVolume(x);
      }
      if (this._draggingMusic) {
        this._updateMusicVolume(x);
      }
      if (this._draggingSFX) {
        this._updateSFXVolume(x);
      }
    });

    this._inputManager.on('pointerup', () => {
      this._draggingMaster = false;
      this._draggingMusic = false;
      this._draggingSFX = false;
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

  _updateMasterVolume(x) {
    const s = this._masterSlider;
    if (!s) return;

    let vol = (x - s.x) / s.w;
    vol = Math.max(0, Math.min(1, vol));
    gameState.setVolume(vol);

    if (this._audioManager) {
      this._audioManager.setMasterVolume(vol);
    }

    eventBus.emit('settings:change', { key: 'volume', value: vol });
  }

  _updateMusicVolume(x) {
    const s = this._musicSlider;
    if (!s) return;

    let vol = (x - s.x) / s.w;
    vol = Math.max(0, Math.min(1, vol));
    gameState.setMusicVolume(vol);

    if (this._audioManager) {
      this._audioManager.setMusicVolume(vol);
    }

    eventBus.emit('settings:change', { key: 'musicVolume', value: vol });
  }

  _updateSFXVolume(x) {
    const s = this._sfxSlider;
    if (!s) return;

    let vol = (x - s.x) / s.w;
    vol = Math.max(0, Math.min(1, vol));
    gameState.setSFXVolume(vol);

    if (this._audioManager) {
      this._audioManager.setMasterSFXVolume(vol);
    }

    eventBus.emit('settings:change', { key: 'sfxVolume', value: vol });
  }
}