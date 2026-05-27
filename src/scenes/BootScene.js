import { SCENES } from '../config/gameConfig.js';
import { i18n } from '../i18n/index.js';

/**
 * BootScene — initial loading scene.
 * Shows a loading bar, simulates asset preparation,
 * then automatically transitions to TitleScene.
 */
export class BootScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange - Callback to switch scenes
   */
  constructor({ onSceneChange }) {
    this._onSceneChange = onSceneChange;
    this._loadDuration = 2000; // ms
    this._elapsed = 0;
    this._done = false;
    this._glitchTimer = 0;
    this._glitchIntensity = 0;
  }

  /** Called when scene becomes active */
  enter() {
    this._elapsed = 0;
    this._done = false;
    this._glitchTimer = 0;
    this._glitchIntensity = 0;
  }

  /** Called when scene is deactivated */
  exit() {
    this._elapsed = 0;
    this._done = false;
  }

  /**
   * Update loading progress.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this._done) return;

    this._elapsed += dt * 1000;

    if (this._elapsed >= this._loadDuration) {
      this._done = true;
      this._onSceneChange(SCENES.TITLE);
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

  /**
   * Render loading screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    const fw = Number(w);
    const fh = Number(h);
    const cx = fw / 2;
    const cy = fh / 2;
    if (!isFinite(fw) || !isFinite(fh) || !isFinite(cx) || !isFinite(cy) || fw < 1 || fh < 1) {
     // console.log('[BootScene] Invalid dims:', w, h, cx, cy);
      return;
    }

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, fw, fh);

    // Subtle vignette
    const maxDim = Math.max(fw, fh);
    const innerR = maxDim * 0.3;
    const outerR = maxDim * 0.7;
    if (!isFinite(innerR) || !isFinite(outerR)) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, fw, fh);
      return;
    }
    const gradient = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Title
    const fontSize = Math.min(36, h * 0.05);
    ctx.fillStyle = '#8b0000';
    ctx.font = `bold ${fontSize}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i18n.t('gameTitle'), w / 2, h * 0.35);

    // Loading label
    const fontSizeSmall = Math.min(16, h * 0.022);
    ctx.fillStyle = '#666';
    ctx.font = `${fontSizeSmall}px Courier New`;
    ctx.fillText(i18n.t('bootLoading'), w / 2, h * 0.48);

    // Progress bar background
    const barWidth = w * 0.4;
    const barHeight = Math.max(6, h * 0.008);
    const barX = (w - barWidth) / 2;
    const barY = h * 0.55;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    const progress = Math.min(this._elapsed / this._loadDuration, 1);
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Progress percentage
    const fontSizeTiny = Math.max(12, h * 0.017);
    ctx.fillStyle = '#444';
    ctx.font = `${fontSizeTiny}px Courier New`;
    ctx.fillText(`${Math.floor(progress * 100)}%`, w / 2, barY + barHeight + 20);

    // Scanline effect
    this._drawScanlines(ctx, w, h);

    if (this._glitchIntensity > 0) {
      this._drawGlitch(ctx, w, h);
    }
  }

  /** Draw subtle scanline overlay for atmosphere */
  _drawScanlines(ctx, w, h) {
    const spacing = Math.max(3, h * 0.004);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < h; y += spacing) {
      ctx.fillRect(0, y, w, 1);
    }
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
