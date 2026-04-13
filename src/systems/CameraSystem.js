/**
 * CameraSystem — manages camera switching and state.
 */
import { Renderer } from '../engine/Renderer.js';
import { ENEMY_CONFIG, ENEMY_STATES } from '../config/enemyConfig.js';
import { CONFIG } from '../config/gameConfig.js';

export class CameraSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   * @param {Object} [deps.assetLoader] - AssetLoader instance for camera images
   */
  constructor({ eventBus, assetLoader }) {
    this._eventBus = eventBus;
    this._assetLoader = assetLoader;
    this._isActive = false;
    this._currentCamera = null;
    this._staticNoise = 0.3;
  }

  /** Open camera system */
  open() {
    this._isActive = true;
    // Auto-select first camera if none is active
    if (!this._currentCamera) {
      this._currentCamera = 'helipad';
    }
  }

  /** Close camera system */
  close() {
    this._isActive = false;
    this._currentCamera = null;
  }

  /**
   * Switch to a specific camera.
   * @param {string} cameraId
   */
  switchTo(cameraId) {
    if (!this._isActive) return;
    this._currentCamera = cameraId;
    this._eventBus.emit('camera:switch', { cameraId });
  }

  /**
   * Switch to next camera.
   * @param {string[]} cameraIds - List of all camera IDs
   */
  nextCamera(cameraIds) {
    if (!this._isActive || !cameraIds?.length) return;
    const idx = cameraIds.indexOf(this._currentCamera);
    const nextIdx = (idx + 1) % cameraIds.length;
    this.switchTo(cameraIds[nextIdx]);
  }

  /**
   * Switch to previous camera.
   * @param {string[]} cameraIds - List of all camera IDs
   */
  prevCamera(cameraIds) {
    if (!this._isActive || !cameraIds?.length) return;
    const idx = cameraIds.indexOf(this._currentCamera);
    const prevIdx = (idx - 1 + cameraIds.length) % cameraIds.length;
    this.switchTo(cameraIds[prevIdx]);
  }

  /** @returns {boolean} */
  get isActive() { return this._isActive; }

  /** @returns {string|null} */
  get currentCamera() { return this._currentCamera; }

  /** @returns {number} Static noise intensity (0-1) */
  get staticNoise() { return this._staticNoise; }

  /**
   * Render camera view.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {Object} options
   * @param {string} options.cameraId
   * @param {Array} options.enemies - Current enemy positions
   * @param {Object} options.rooms - Room definitions
   */
  render(ctx, w, h, { cameraId, enemies, rooms }) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const room = rooms?.[cameraId];
    const cameraImageKey = `cameras_${cameraId}`;
    const cameraImage = this._assetLoader?.getImage(cameraImageKey);

    const camX = w * 0.15;
    const camY = h * 0.2;
    const camW = w * 0.7;
    const camH = h * 0.6;

    if (cameraImage && cameraImage.complete && cameraImage.naturalWidth > 0) {
      ctx.drawImage(cameraImage, camX, camY, camW, camH);

      // Draw enemies BEFORE noise so they appear behind static
      // Hide enemy if in AT_DOOR state (they're at the office door now)
      if (enemies) {
        for (const enemy of enemies) {
          if (enemy.currentRoom === cameraId && !enemy.isInTransit && enemy.state !== ENEMY_STATES.AT_DOOR) {
            this._drawEnemyIndicator(ctx, w, h, enemy, room);
          }
        }
      }

      const enemyCount = enemies ? enemies.filter(e => e.currentRoom === cameraId).length : 0;
      this._drawCameraNoise(ctx, camX, camY, camW, camH, enemyCount);
    } else if (room) {
      this._drawRoom(ctx, camX, camY, camW, camH, room, rooms);
    }

    ctx.fillStyle = '#44aa44';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`CAM: ${room?.name || cameraId}`, 20, 20);

    const enemyCount = enemies ? enemies.filter(e => e.currentRoom === cameraId).length : 0;
    this._drawStatic(ctx, w, h, enemyCount);
  }

  _drawCameraNoise(ctx, x, y, w, h, enemyCount = 0) {
    const noiseMultiplier = 1 + (enemyCount || 0) * 0.5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    const scanlineCount = Math.floor(15 * noiseMultiplier);
    for (let i = 0; i < scanlineCount; i++) {
      const ny = y + Math.random() * h;
      const nh = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.15 * noiseMultiplier})`;
      ctx.fillRect(x, ny, w, nh);
    }

    if (Math.random() < 0.08 * noiseMultiplier) {
      const glitchY = y + Math.random() * h;
      const glitchH = Math.random() * 20 + 5;
      const offset = (Math.random() - 0.5) * 30;
      ctx.drawImage(ctx.canvas, x, glitchY, w, glitchH, x + offset, glitchY, w, glitchH);
    }

    if (Math.random() < 0.05 * noiseMultiplier) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,0,255'}, ${Math.random() * 0.1 * noiseMultiplier})`;
      ctx.fillRect(x + Math.random() * w * 0.5, y + Math.random() * h * 0.5, w * 0.3, h * 0.2);
    }

    ctx.restore();
  }

  _drawRoom(ctx, x, y, w, h, room, allRooms) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#2a4a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#335533';
    ctx.font = '14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.name, cx, cy);

    const connections = room.connections || [];
    ctx.fillStyle = '#2a3a2a';
    ctx.font = '11px Courier New';
    connections.forEach((connId, i) => {
      const connRoom = allRooms?.[connId];
      const label = connRoom ? connRoom.name : connId;
      ctx.fillText(`→ ${label}`, cx, cy + 25 + i * 16);
    });
  }

  _drawStatic(ctx, w, h, enemyCount = 0) {
    const noiseMultiplier = 1 + (enemyCount || 0) * 0.5;

    // Horizontal scan lines for CRT effect
    const scanLineChance = Math.min(1, 0.5 * noiseMultiplier);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.03 * noiseMultiplier})`;
    for (let y = 0; y < h; y += 4) {
      if (Math.random() > (1 - scanLineChance)) {
        ctx.fillRect(0, y, w, 1);
      }
    }

    // Occasional full-frame static burst
    if (Math.random() < 0.03 * noiseMultiplier) {
      Renderer.noise(ctx, w, h, 0.15 * noiseMultiplier);
    }

    // Light ambient noise
    Renderer.noise(ctx, w, h, 0.04 * noiseMultiplier);

    // Horizontal glitch lines
    const glitchCount = Math.floor(Math.random() * 3 * noiseMultiplier);
    for (let i = 0; i < glitchCount; i++) {
      const y = Math.random() * h;
      const lineH = Math.random() * 6 + 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08 * noiseMultiplier})`;
      ctx.fillRect(0, y, w, lineH);
    }

    // Vignette overlay
    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.5)');
  }

  _drawEnemyIndicator(ctx, w, h, enemy, room) {
    const x = (enemy.cameraX ?? 0.5) * w;

    const enemyY = room?.enemyY ?? 0.5;
    const y = enemyY * h;

    const enemyScale = room?.enemyScale ?? 1.0;
    const size = 35 * enemyScale;

    const enemyConfig = ENEMY_CONFIG[enemy.id];
    const spriteFilename = enemyConfig?.sprites?.idle;
    const spriteKey = spriteFilename ? `enemies_${spriteFilename.replace('.png', '')}` : null;
    const sprite = spriteKey ? this._assetLoader?.getImage(spriteKey) : null;

    const drawSize = size * 2;

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      const brightness = CONFIG.CAMERA_ENEMY_BRIGHTNESS;
      const saturation = CONFIG.CAMERA_ENEMY_SATURATION;
      ctx.filter = `brightness(${brightness}) saturate(${saturation}%)`;
      ctx.drawImage(sprite, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.6, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = enemy.color || '#ff0000';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - 6, y - 5, 4, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 5, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x - 5, y - 5, 2, 0, Math.PI * 2);
      ctx.arc(x + 7, y - 5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(enemy.name, x, y + size * 0.5 + 5);
    }
  }
}
