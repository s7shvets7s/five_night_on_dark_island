/**
 * CameraSystem — manages camera switching and state.
 */
import { Renderer } from '../engine/Renderer.js';

export class CameraSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
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
    if (room) {
      this._drawRoom(ctx, w, h, room, rooms);
      ctx.fillStyle = '#44aa44';
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`CAM: ${room.name}`, 20, 20);
    }

    if (enemies) {
      for (const enemy of enemies) {
        if (enemy.currentRoom === cameraId) {
          this._drawEnemyIndicator(ctx, w, h, enemy, room);
        }
      }
    }

    this._drawStatic(ctx, w, h);
  }

  _drawRoom(ctx, w, h, room, allRooms) {
    const cx = w * 0.5;
    const cy = h * 0.55;

    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.6);

    ctx.strokeStyle = '#2a4a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.15, h * 0.2, w * 0.7, h * 0.6);

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

  _drawStatic(ctx, w, h) {
    // Horizontal scan lines for CRT effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < h; y += 4) {
      if (Math.random() > 0.5) {
        ctx.fillRect(0, y, w, 1);
      }
    }

    // Occasional full-frame static burst
    if (Math.random() < 0.03) {
      Renderer.noise(ctx, w, h, 0.15);
    }

    // Light ambient noise
    Renderer.noise(ctx, w, h, 0.04);

    // Horizontal glitch lines
    const glitchCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < glitchCount; i++) {
      const y = Math.random() * h;
      const lineH = Math.random() * 6 + 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.08})`;
      ctx.fillRect(0, y, w, lineH);
    }

    // Vignette overlay
    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.5)');
  }

  _drawEnemyIndicator(ctx, w, h, enemy, room) {
    // Stable position based on room layout
    const roomX = room?.x ?? 0;
    const roomY = room?.y ?? 0;

    // Map room position to screen position
    const baseX = w * 0.3 + (roomX + 0.5) * w * 0.4;
    const baseY = h * 0.35 + (roomY + 0.5) * h * 0.35;

    // Subtle idle animation — slow breathing
    const breathe = Math.sin(Date.now() * 0.003) * 3;

    const x = baseX + breathe;
    const y = baseY + breathe;
    const size = 35;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.6, size * 0.5, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = enemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
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

    // Name label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(enemy.name, x, y + size * 0.5 + 5);
  }
}
