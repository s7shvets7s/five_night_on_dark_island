/**
 * NightScene — main gameplay scene.
 * Manages office view, camera system, all game systems integration.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { PowerSystem } from '../systems/PowerSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { ClockSystem } from '../systems/ClockSystem.js';
import { OfficeSystem } from '../systems/OfficeSystem.js';
import { JumpscareSystem } from '../systems/JumpscareSystem.js';
import { HUDSystem } from '../systems/HUDSystem.js';
import { Enemy } from '../entities/Enemy.js';
import { EnemyAI } from '../ai/EnemyAI.js';
import { ENEMY_MAP } from '../data/enemies.js';
import { ROOM_MAP } from '../data/rooms.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';
import { eventBus } from '../engine/EventBus.js';
import { Renderer } from '../engine/Renderer.js';

export class NightScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Function} [deps.onPause]
   * @param {Object} deps.inputManager
   * @param {Object} [deps.audioManager]
   * @param {number} [deps.nightId]
   */
  constructor({ onSceneChange, onPause, inputManager, audioManager, nightId }) {
    this._onSceneChange = onSceneChange;
    this._onPause = onPause;
    this._inputManager = inputManager;
    this._audioManager = audioManager;

    this._powerSystem = new PowerSystem({ eventBus });
    this._cameraSystem = new CameraSystem({ eventBus });
    this._clockSystem = new ClockSystem({ eventBus });
    this._officeSystem = new OfficeSystem({ eventBus });
    this._jumpscareSystem = new JumpscareSystem({ eventBus });
    this._hudSystem = new HUDSystem({ eventBus });
    this._enemyAI = new EnemyAI({ eventBus });

    this._enemies = [];
    this._enemyStartHours = new Map();

    this._nightId = nightId || DEFAULT_NIGHT_ID;
    this._nightConfig = NIGHT_MAP[this._nightId] || NIGHT_MAP[DEFAULT_NIGHT_ID];

    this._paused = false;
    this._gameOver = false;
    this._victory = false;
    this._powerOut = false;

    this._officePanX = 0;
    this._officePanTarget = 0;
    this._panMaxOffset = 120;
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartOffset = 0;
  }

  enter() {
    this._paused = false;
    this._gameOver = false;
    this._victory = false;
    this._powerOut = false;
    this._officePanX = 0;
    this._officePanTarget = 0;
    this._isPanning = false;

    this._powerSystem.reset();
    this._clockSystem.reset(this._nightConfig.durationMs);
    this._officeSystem.reset();
    this._cameraSystem.close();

    this._enemies = [];
    this._enemyStartHours = new Map();

    for (const spawn of this._nightConfig.spawns) {
      const def = ENEMY_MAP[spawn.enemyId];
      if (!def) continue;

      const enemy = new Enemy({
        id: def.id,
        name: def.name,
        color: def.color,
        startRoom: spawn.startRoom,
      });
      enemy.setAggression(spawn.aggression);
      this._enemies.push(enemy);
      this._enemyStartHours.set(enemy.id, spawn.startHour);
    }

    this._bindInput();
    this._updateHUD();
  }

  /** Called when returning to this scene (e.g. after pause pop). */
  resume() {
    this._paused = false;
  }

  exit() {
    this._inputManager.clearAll();
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (this._paused || this._gameOver || this._victory) return;

    const dtMs = dt * 1000;

    const panSpeed = 8;
    const panDiff = this._officePanTarget - this._officePanX;
    if (Math.abs(panDiff) > 0.5) {
      this._officePanX += panDiff * panSpeed * dt;
    } else {
      this._officePanX = this._officePanTarget;
    }

    this._clockSystem.update(dtMs);
    if (this._clockSystem.isComplete) {
      this._victory = true;
      this._onVictory();
      return;
    }

    this._powerSystem.setActiveDoors(this._officeSystem.activeDoors);
    this._powerSystem.setActiveLights(this._officeSystem.activeLights);
    this._powerSystem.setCameraActive(this._cameraSystem.isActive);
    this._powerSystem.update(dt);
    if (this._powerSystem.isDepleted && !this._powerOut) {
      this._onPowerOut();
    }

    if (!this._powerOut && !this._jumpscareSystem.isActive) {
      const currentHour = this._clockSystem.currentHour;
      for (const enemy of this._enemies) {
        if (enemy.isDefeated) continue;
        const startHour = this._enemyStartHours.get(enemy.id) ?? 0;
        if (currentHour < startHour) continue;

        const def = ENEMY_MAP[enemy.id];
        if (!def) continue;

        const result = this._enemyAI.update(enemy, def, dtMs, this._officeSystem);
        if (result === 'attacked') {
          enemy.defeat();
          this._onJumpscare(enemy);
          return;
        }
      }
    }

    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.update(dtMs);
    }

    this._updateHUD();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.render(ctx, w, h);
      return;
    }

    if (this._cameraSystem.isActive) {
      this._renderCameraView(ctx, w, h);
    } else if (this._powerOut) {
      this._renderPowerOut(ctx, w, h);
    } else {
      this._renderOffice(ctx, w, h);
    }

    this._hudSystem.render(ctx, w, h);

    if (this._cameraSystem.isActive) {
      this._hudSystem.renderCameraMap(ctx, w, h, ROOM_MAP, this._cameraSystem.currentCamera, this._enemies);
    }

    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.4)');
    Renderer.scanlines(ctx, w, h);

    this._renderDoorButtons(ctx, w, h);
    this._renderLightButtons(ctx, w, h);
  }

  /** Called when returning to this scene (e.g. after pause pop). */
  resume() {
    this._paused = false;
  }

  exit() {
    this._inputManager.clearAll();
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (this._paused || this._gameOver || this._victory) return;

    const dtMs = dt * 1000;

    const panSpeed = 8;
    const panDiff = this._officePanTarget - this._officePanX;
    if (Math.abs(panDiff) > 0.5) {
      this._officePanX += panDiff * panSpeed * dt;
    } else {
      this._officePanX = this._officePanTarget;
    }

    this._clockSystem.update(dtMs);
    if (this._clockSystem.isComplete) {
      this._victory = true;
      this._onVictory();
      return;
    }

    this._powerSystem.setActiveDoors(this._officeSystem.activeDoors);
    this._powerSystem.setActiveLights(this._officeSystem.activeLights);
    this._powerSystem.setCameraActive(this._cameraSystem.isActive);
    this._powerSystem.update(dt);
    if (this._powerSystem.isDepleted && !this._powerOut) {
      this._onPowerOut();
    }

    if (!this._powerOut && !this._jumpscareSystem.isActive) {
      const currentHour = this._clockSystem.currentHour;
      for (const enemy of this._enemies) {
        if (enemy.isDefeated) continue;
        const startHour = this._enemyStartHours.get(enemy.id) ?? 0;
        if (currentHour < startHour) continue;

        const def = ENEMY_MAP[enemy.id];
        if (!def) continue;

        const result = this._enemyAI.update(enemy, def, dtMs, this._officeSystem);
        if (result === 'attacked') {
          enemy.defeat();
          this._onJumpscare(enemy);
          return;
        }
      }
    }

    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.update(dtMs);
    }

    this._updateHUD();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.render(ctx, w, h);
      return;
    }

    if (this._cameraSystem.isActive) {
      this._renderCameraView(ctx, w, h);
    } else if (this._powerOut) {
      this._renderPowerOut(ctx, w, h);
    } else {
      this._renderOffice(ctx, w, h);
    }

    this._hudSystem.render(ctx, w, h);

    if (this._cameraSystem.isActive) {
      this._hudSystem.renderCameraMap(ctx, w, h, ROOM_MAP, this._cameraSystem.currentCamera, this._enemies);
    }

    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.4)');
    Renderer.scanlines(ctx, w, h);

    this._renderDoorButtons(ctx, w, h);
    this._renderLightButtons(ctx, w, h);
  }

  _renderOffice(ctx, w, h) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    const panX = this._officePanX;
    const expandW = Math.max(0, Math.abs(panX));
    ctx.fillStyle = '#1a1a1a';
    if (panX > 0) {
      ctx.fillRect(0, 0, panX, h);
    } else if (panX < 0) {
      ctx.fillRect(w + panX, 0, -panX, h);
    }

    ctx.save();
    ctx.translate(-panX, 0);

    const officeW = w * 1.3;
    const officeX = (w - officeW) / 2;

    ctx.fillStyle = '#222';
    ctx.fillRect(officeX + w * 0.05, h * 0.08, officeW * 0.9, h * 0.72);

    ctx.fillStyle = '#333';
    ctx.fillRect(officeX + w * 0.3, h * 0.5, officeW * 0.4, h * 0.15);

    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(officeX + w * 0.5, h * 0.45, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#555';
    ctx.fillRect(officeX + w * 0.35, h * 0.48, 8, 12);
    ctx.fillRect(officeX + w * 0.55, h * 0.47, 6, 14);

    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(officeX + w * 0.65, h * 0.42, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(officeX + w * 0.65, h * 0.42);
    ctx.lineTo(officeX + w * 0.65, h * 0.3);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.fillRect(officeX + w * 0.02, h * 0.15, w * 0.08, h * 0.55);
    ctx.fillRect(officeX + w * 0.9, h * 0.15, w * 0.08, h * 0.55);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.strokeRect(officeX + w * 0.02, h * 0.15, w * 0.08, h * 0.55);
    ctx.strokeRect(officeX + w * 0.9, h * 0.15, w * 0.08, h * 0.55);

    this._renderDoorState(ctx, 'left', officeX, w, h);
    this._renderDoorState(ctx, 'right', officeX, w, h);

    if (this._officeSystem.leftLightOn) {
      this._renderLightEffect(ctx, 'left', officeX, w, h);
      this._renderEnemyAtDoor(ctx, 'left', officeX, w, h);
    }
    if (this._officeSystem.rightLightOn) {
      this._renderLightEffect(ctx, 'right', officeX, w, h);
      this._renderEnemyAtDoor(ctx, 'right', officeX, w, h);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('◄ ►', w / 2, h - 8);

    ctx.restore();
  }

  _renderDoorState(ctx, side, officeX, w, h) {
    const x = side === 'left' ? officeX + w * 0.07 : officeX + w * 0.92;
    const y = h * 0.2;
    const doorW = w * 0.06;
    const doorH = h * 0.5;

    const isOpen = side === 'left' ? this._officeSystem.leftDoorOpen : this._officeSystem.rightDoorOpen;

    ctx.fillStyle = isOpen ? '#111' : '#333';
    ctx.fillRect(x, y, doorW, doorH);

    ctx.strokeStyle = isOpen ? '#444' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, doorW, doorH);
  }

  _renderLightEffect(ctx, side, officeX, w, h) {
    const x = side === 'left' ? officeX + w * 0.15 : officeX + w * 0.75;
    const maxDim = Math.max(w, h);
    const gradient = ctx.createRadialGradient(x, h * 0.4, 0, x, h * 0.4, maxDim * 0.25);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.2)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Render enemy at door if light reveals one.
   * @param {CanvasRenderingContext2D} ctx
   * @param {'left'|'right'} side
   * @param {number} officeX
   * @param {number} w
   * @param {number} h
   */
  _renderEnemyAtDoor(ctx, side, officeX, w, h) {
    const doorRoom = side === 'left' ? 'dock' : 'generator';
    const enemy = this._enemies.find(e => e.currentRoom === doorRoom && !e.isDefeated);
    if (!enemy) return;

    const x = side === 'left' ? officeX + w * 0.04 : officeX + w * 0.88;
    const y = h * 0.25;
    const size = w * 0.07;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size * 0.8, size * 0.4, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = enemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — glowing white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.65, size * 0.15, 0, Math.PI);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#ffffff';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(x + size / 2 + i * size * 0.1 - 2, y + size * 0.65, 4, 5);
    }
  }

  _renderCameraView(ctx, w, h) {
    const cameraId = this._cameraSystem.currentCamera;
    this._cameraSystem.render(ctx, w, h, {
      cameraId,
      enemies: this._enemies,
      rooms: ROOM_MAP,
    });
  }

  _renderPowerOut(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    if (Math.random() < 0.02) {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderDoorButtons(ctx, w, h) {
    for (const side of ['left', 'right']) {
      const bounds = this._hudSystem.getDoorButtonBounds(side, w, h);
      const isClosed = side === 'left' ? !this._officeSystem.leftDoorOpen : !this._officeSystem.rightDoorOpen;

      ctx.fillStyle = isClosed ? COLORS.ACCENT_RED : COLORS.UI_BG;
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isClosed ? 'DOOR' : 'OPEN', bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    }
  }

  _renderLightButtons(ctx, w, h) {
    for (const side of ['left', 'right']) {
      const bounds = this._hudSystem.getLightButtonBounds(side, w, h);
      const isOn = side === 'left' ? this._officeSystem.leftLightOn : this._officeSystem.rightLightOn;

      ctx.fillStyle = isOn ? '#ffffaa' : COLORS.UI_BG;
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

      ctx.fillStyle = isOn ? '#000000' : COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIGHT', bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    }
  }

  _updateHUD() {
    this._hudSystem.updateState({
      powerPercent: this._powerSystem.getPowerPercent(),
      currentTime: this._clockSystem.displayTime,
      cameraActive: this._cameraSystem.isActive,
    });
  }

  _onPowerOut() {
    this._powerOut = true;
    this._officeSystem.reset();
    this._cameraSystem.close();
  }

  _onJumpscare(enemy) {
    this._jumpscareSystem.trigger(enemy, () => {
      this._gameOver = true;
      eventBus.emit('game:over', { nightId: this._nightId });
      this._onSceneChange(SCENES.GAME_OVER);
    });
  }

  _onVictory() {
    const nextNight = Math.min(this._nightId + 1, 7);
    eventBus.emit('game:victory', { night: this._nightId });
    eventBus.emit('game:night-change', { nightId: nextNight });
    setTimeout(() => {
      this._onSceneChange(SCENES.VICTORY);
    }, 1000);
  }

  _bindInput() {
    this._inputManager.on('pointerdown', (x, y) => {
      if (this._paused || this._gameOver || this._victory) return;

      const pos = { x, y };
      const w = this._inputManager.gameWidth;
      const h = this._inputManager.gameHeight;

      // Pause button (top-right)
      const pauseBounds = this._hudSystem.getPauseButtonBounds(w, h);
      if (this._isInRect(pos, pauseBounds) && this._onPause) {
        this._paused = true;
        this._onPause();
        return;
      }

      // Camera toggle
      const toggleBounds = this._hudSystem.getCameraToggleBounds(w, h);
      if (this._isInRect(pos, toggleBounds)) {
        if (this._cameraSystem.isActive) {
          this._cameraSystem.close();
        } else {
          this._cameraSystem.open();
        }
        return;
      }

      // Door buttons
      for (const side of ['left', 'right']) {
        const bounds = this._hudSystem.getDoorButtonBounds(side, w, h);
        if (this._isInRect(pos, bounds)) {
          this._officeSystem.toggleDoor(side);
          return;
        }
      }

      // Light buttons
      for (const side of ['left', 'right']) {
        const bounds = this._hudSystem.getLightButtonBounds(side, w, h);
        if (this._isInRect(pos, bounds)) {
          this._officeSystem.toggleLight(side);
          return;
        }
      }

      // Camera map nodes
      if (this._cameraSystem.isActive) {
        const nodes = this._hudSystem.getCameraMapNodes(w, h, ROOM_MAP);
        for (const node of nodes) {
          const dx = pos.x - node.x;
          const dy = pos.y - node.y;
          if (dx * dx + dy * dy <= node.r * node.r) {
            this._cameraSystem.switchTo(node.id);
            return;
          }
        }
      }

      // Office pan
      if (!this._cameraSystem.isActive) {
        this._isPanning = true;
        this._panStartX = x;
        this._panStartOffset = this._officePanTarget;
      }
    });

    this._inputManager.on('pointermove', (x, y) => {
      if (!this._isPanning || this._cameraSystem.isActive) return;

      const dx = x - this._panStartX;
      const newOffset = Math.max(-this._panMaxOffset, Math.min(this._panMaxOffset, this._panStartOffset + dx));
      this._officePanTarget = newOffset;
    });

    this._inputManager.on('pointerup', () => {
      this._isPanning = false;
    });
  }

  _isInRect(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.w
      && pos.y >= rect.y && pos.y <= rect.y + rect.h;
  }
}
