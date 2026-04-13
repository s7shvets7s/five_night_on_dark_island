/**
 * NightScene — main gameplay scene.
 * Manages office view, camera system, all game systems integration.
 */
import { SCENES, COLORS, UI, CONFIG, gameState, POWER_DRAIN_MULTIPLIERS, RANDOM_AD_CHANCE } from '../config/gameConfig.js';
import { ENEMY_CONFIG, ENEMY_MAP, DOOR_POSITIONS_PERCENT, DOOR_IMAGE_SIZE, ENEMY_STATES } from '../config/enemyConfig.js';
import { PowerSystem } from '../systems/PowerSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { ClockSystem } from '../systems/ClockSystem.js';
import { OfficeSystem } from '../systems/OfficeSystem.js';
import { JumpscareSystem } from '../systems/JumpscareSystem.js';
import { HUDSystem } from '../systems/HUDSystem.js';
import { CameraGlitchMiniGame } from '../systems/CameraGlitchMiniGame.js';
import { GeneratorMiniGame } from '../systems/GeneratorMiniGame.js';
import { Enemy } from '../entities/Enemy.js';
import { EnemyAI } from '../ai/EnemyAI.js';
import { ROOM_MAP } from '../data/rooms.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';
import { eventBus } from '../engine/EventBus.js';
import { Renderer } from '../engine/Renderer.js';
import { i18n } from '../i18n/index.js';

export class NightScene {
  /**
   * @param {Object} deps
   * @param {Function} deps.onSceneChange
   * @param {Function} [deps.onPause]
   * @param {Object} deps.inputManager
   * @param {Object} [deps.audioManager]
   * @param {Object} [deps.sfxManager]
   * @param {Object} [deps.assetLoader]
   * @param {Object} [deps.ads]
   * @param {number} [deps.nightId]
   */
  constructor({ onSceneChange, onPause, inputManager, audioManager, sfxManager, assetLoader, ads, nightId }) {
    this._onSceneChange = onSceneChange;
    this._onPause = onPause;
    this._inputManager = inputManager;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._assetLoader = assetLoader;
    this._ads = ads;
    this._adShowing = false;

    this._powerSystem = new PowerSystem({ eventBus });
    this._cameraSystem = new CameraSystem({ eventBus, assetLoader: this._assetLoader });
    this._clockSystem = new ClockSystem({ eventBus });
    this._officeSystem = new OfficeSystem({ eventBus });
    this._jumpscareSystem = new JumpscareSystem({ eventBus, assetLoader: this._assetLoader });
    this._hudSystem = new HUDSystem({ eventBus });
    this._enemyAI = new EnemyAI({ eventBus });
    this._glitchMiniGame = new CameraGlitchMiniGame({
      eventBus,
      onSolve: () => {},
      onFail: () => this._onGlitchFail(),
    });
    this._generatorMiniGame = new GeneratorMiniGame({
      eventBus,
      onSuccess: () => this._powerSystem.add(CONFIG.GENERATOR_SUCCESS_BONUS),
      onFail: (reason) => this._powerSystem.drain(CONFIG.GENERATOR_FAIL_PENALTY),
    });

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

    this._maskActive = false;
    this._maskOxygen = 0;
    this._maskCooldown = 0;
  }

  enter() {
    // Clear stale handlers — prevents duplicates on restart from pause menu
    this._unbindSFX();
    this._inputManager.clearAll();
    this._adShowing = false;

    this._paused = false;
    this._gameOver = false;
    this._victory = false;
    this._powerOut = false;
    this._officePanX = 0;
    this._officePanTarget = 0;
    this._isPanning = false;

    this._powerSystem.reset();
    const nightMultiplier = POWER_DRAIN_MULTIPLIERS[this._nightId] || 1.0;
    this._powerSystem.setDrainMultiplier(nightMultiplier);
    this._clockSystem.reset(this._nightConfig.durationMs);
    this._officeSystem.reset();
    this._cameraSystem.close();
    this._audioManager?.stopCameraStaticNoise();

    this._enemies = [];
    this._enemyStartHours = new Map();

    this._maskActive = false;
    this._maskOxygen = 0;
    this._maskCooldown = 0;

    this._glitchMiniGame.init(this._nightId);

    this._generatorMiniGame.reset();

    for (const spawn of this._nightConfig.spawns) {
      const def = ENEMY_MAP[spawn.enemyId];
      if (!def) continue;

      const enemy = new Enemy({
        id: spawn.enemyId,
        startRoom: spawn.startRoom,
        aggression: spawn.aggression,
      });
      this._enemies.push(enemy);
      this._enemyStartHours.set(enemy.id, spawn.startHour);
    }

    this._bindInput();
    this._bindSFX();
    this._updateHUD();
  }

  /** Called when returning to this scene (e.g. after pause pop). */
  resume() {
    this._paused = false;
  }

  exit() {
    this._unbindSFX();
    this._audioManager?.stopAll();
    this._inputManager.clearAll();
  }

  /** Bind SFX playback to game events via EventBus. */
  _bindSFX() {
    if (!this._sfxManager) return;

    // Door sounds
    eventBus.on('door:toggle', this._onDoorToggleSFX);
    // Light sounds
    eventBus.on('light:toggle', this._onLightToggleSFX);
    // Camera sounds
    eventBus.on('camera:switch', this._onCameraSwitchSFX);
    eventBus.on('camera:glitch', this._onCameraGlitchSFX);
    eventBus.on('camera:glitch:fail', this._onCameraGlitchFailSFX);
    // Jumpscare
    eventBus.on('jumpscare:trigger', this._onJumpscareSFX);
    // Generator
    eventBus.on('generator:active', this._onGeneratorActiveSFX);
    eventBus.on('generator:success', this._onGeneratorSuccessSFX);
    eventBus.on('generator:fail', this._onGeneratorFailSFX);
    // Enemy movement (sparse, atmospheric)
    eventBus.on('enemy:move', this._onEnemyMoveSFX);
    eventBus.on('enemy:return', this._onEnemyReturnSFX);
  }

  /** Unbind SFX event listeners. */
  _unbindSFX() {
    if (!this._sfxManager) return;

    eventBus.off('door:toggle', this._onDoorToggleSFX);
    eventBus.off('light:toggle', this._onLightToggleSFX);
    eventBus.off('camera:switch', this._onCameraSwitchSFX);
    eventBus.off('camera:glitch', this._onCameraGlitchSFX);
    eventBus.off('camera:glitch:fail', this._onCameraGlitchFailSFX);
    eventBus.off('jumpscare:trigger', this._onJumpscareSFX);
    eventBus.off('generator:active', this._onGeneratorActiveSFX);
    eventBus.off('generator:success', this._onGeneratorSuccessSFX);
    eventBus.off('generator:fail', this._onGeneratorFailSFX);
    eventBus.off('enemy:move', this._onEnemyMoveSFX);
    eventBus.off('enemy:return', this._onEnemyReturnSFX);
  }

  // ==================== SFX Event Handlers ====================

  _onDoorToggleSFX = ({ isOpen }) => {
    this._sfxManager?.play(isOpen ? 'doorOpen' : 'doorClose');
  };

  _onLightToggleSFX = ({ isOn }) => {
    this._sfxManager?.play(isOn ? 'lightOn' : 'lightOff');
  };

  _onCameraSwitchSFX = () => {
    this._sfxManager?.play('cameraSwitch');
  };

  _onCameraGlitchSFX = ({ active }) => {
    if (active) this._sfxManager?.play('cameraGlitchStart');
  };

  _onCameraGlitchFailSFX = () => {
    this._sfxManager?.play('cameraGlitchFail');
  };

  _onJumpscareSFX = () => {
    this._sfxManager?.play('enemyJumpscare');
  };

  _onGeneratorActiveSFX = () => {
    this._sfxManager?.play('generatorStart');
  };

  _onGeneratorSuccessSFX = () => {
    this._sfxManager?.play('generatorSuccess');
  };

  _onGeneratorFailSFX = () => {
    this._sfxManager?.play('generatorFail');
  };

  _onEnemyMoveSFX = () => {
    this._sfxManager?.play('enemyMove');
  };

  _onEnemyReturnSFX = () => {
    this._sfxManager?.play('enemyReturn');
  };

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

    this._glitchMiniGame.update(dt, this._cameraSystem.currentCamera);

    this._generatorMiniGame.update(dt);

    if (!this._powerOut && !this._jumpscareSystem.isActive) {
      const currentHour = this._clockSystem.currentHour;
      for (const enemy of this._enemies) {
        if (enemy.isDefeated) continue;
        const startHour = this._enemyStartHours.get(enemy.id) ?? 0;
        if (currentHour < startHour) continue;

        // Progressive aggression: +1 aggression per hour active, max +5
        const hoursActive = currentHour - startHour;
        const spawnConfig = this._nightConfig.spawns.find(s => s.enemyId === enemy.id);
        if (spawnConfig) {
          const bonusAggression = hoursActive > 0 ? Math.min(5, hoursActive) : 0;
          enemy.setAggression(spawnConfig.aggression + bonusAggression);
        }

        const result = this._enemyAI.update(enemy, dtMs, this._officeSystem, this._maskActive);
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

    if (this._maskActive) {
      this._maskOxygen -= dt;
      if (this._maskOxygen <= 0) {
        this._maskActive = false;
        this._maskOxygen = 0;
        this._maskCooldown = CONFIG.MASK_COOLDOWN;
        this._sfxManager?.play('maskOff');
      }
    } else if (this._maskCooldown > 0) {
      this._maskCooldown -= dt;
      if (this._maskCooldown < 0) this._maskCooldown = 0;
    }

    // Power-low warning
    this._sfxManager?.playPowerLow(this._powerSystem.getPowerPercent());

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

      if (this._glitchMiniGame.isActive && this._glitchMiniGame.glitchedCamera === this._cameraSystem.currentCamera) {
        this._glitchMiniGame.render(ctx, w, h);
      }
    } else if (this._powerOut) {
      this._renderPowerOut(ctx, w, h);
    } else {
      this._renderOffice(ctx, w, h);
    }

    this._hudSystem.render(ctx, w, h);

    if (this._maskActive) {
      this._hudSystem.renderMaskOverlay(ctx, w, h);
      this._hudSystem.renderOxygenBar(ctx, w, h, this._maskOxygen);
    }
    this._hudSystem.renderMaskButton(ctx, w, h, this._maskActive, this._maskCooldown);

    Renderer.vignette(ctx, w, h, 'rgba(0, 0, 0, 0.4)');
    Renderer.scanlines(ctx, w, h);

    if (this._cameraSystem.isActive) {
      this._hudSystem.renderCameraMap(ctx, w, h, ROOM_MAP, this._cameraSystem.currentCamera, this._enemies);
    }

    this._renderDoorButtons(ctx, w, h);
    this._renderLightButtons(ctx, w, h);
    this._renderGeneratorButton(ctx, w, h);

    if (this._generatorMiniGame.isShowingMenu) {
      this._renderGeneratorMenu(ctx, w, h);
    }
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

    const leftClosed = !this._officeSystem.leftDoorOpen;
    const rightClosed = !this._officeSystem.rightDoorOpen;

    if (this._officeSystem.leftLightOn) {
      this._renderLightEffect(ctx, 'left', officeX, w, h);
    }
    if (this._officeSystem.rightLightOn) {
      this._renderLightEffect(ctx, 'right', officeX, w, h);
    }

    let bgKey = 'office_bg';
    if (leftClosed && rightClosed) {
      bgKey = 'office_bg_all_dors_close';
    } else if (leftClosed) {
      bgKey = 'office_bg_left_dor_close';
    } else if (rightClosed) {
      bgKey = 'office_bg_right_dor_slose';
    }

    const bgImage = this._assetLoader?.getImage(bgKey);
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      ctx.drawImage(bgImage, officeX, 0, officeW, h);
    } else {
      ctx.fillStyle = '#222';
      ctx.fillRect(officeX, 0, officeW, h);
    }

    this._renderDoorEnemies(ctx, officeX, w, h, leftClosed, rightClosed);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('◄ ►', w / 2, h - 8);

    ctx.restore();
  }

  _renderDoorEnemies(ctx, officeX, w, h, leftClosed, rightClosed) {
    const leftDoorRoom = 'dock';
    const rightDoorRoom = 'generator';

    for (const enemy of this._enemies) {
      if (enemy.isDefeated || enemy.isInTransit) continue;
      // Only render enemy at door when in AT_DOOR state (not just patrolling the room)
      if (enemy.state !== ENEMY_STATES.AT_DOOR) continue;

      if (enemy.currentRoom === leftDoorRoom && !leftClosed) {
        const lightOn = this._officeSystem.leftLightOn;
        this._renderEnemyAtDoor(ctx, 'left', officeX, w, h, lightOn);
      }
      if (enemy.currentRoom === rightDoorRoom && !rightClosed) {
        const lightOn = this._officeSystem.rightLightOn;
        this._renderEnemyAtDoor(ctx, 'right', officeX, w, h, lightOn);
      }
    }
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
    const doorPos = side === 'left' ? DOOR_POSITIONS_PERCENT.left : DOOR_POSITIONS_PERCENT.right;
    const x = doorPos.x * w;
    const y = doorPos.y * h;
    const radius = Math.max(w, h) * 0.3;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Render enemy at door if light reveals one.
   * Light ON → bright sprite. Light OFF → dark silhouette + noise.
   * @param {CanvasRenderingContext2D} ctx
   * @param {'left'|'right'} side
   * @param {number} officeX
   * @param {number} w
   * @param {number} h
   * @param {boolean} [lightOn]
   */
  _renderEnemyAtDoor(ctx, side, officeX, w, h, lightOn = false) {
    const doorRoom = side === 'left' ? 'dock' : 'generator';
    const enemy = this._enemies.find(e => e.currentRoom === doorRoom && !e.isDefeated && e.state === ENEMY_STATES.AT_DOOR);
    if (!enemy) return;

    const doorPos = side === 'left' ? DOOR_POSITIONS_PERCENT.left : DOOR_POSITIONS_PERCENT.right;
    const enemyOffset = enemy.doorOffset;

    const x = (doorPos.x * w) + (enemyOffset.x * w / DOOR_IMAGE_SIZE.width);
    const y = (doorPos.y * h) + (enemyOffset.y * h / DOOR_IMAGE_SIZE.height);
    const size = w * 0.07;

    if (lightOn) {
      // Light ON — render bright sprite
      const enemyConfig = ENEMY_CONFIG[enemy.id];
      const spriteFilename = enemyConfig?.sprites?.atDoor;
      const spriteKey = spriteFilename ? `enemies_${spriteFilename.replace('.png', '')}` : null;
      const sprite = spriteKey ? this._assetLoader?.getImage(spriteKey) : null;

      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx.drawImage(sprite, x, y, size, size);
      } else {
        this._renderDoorPlaceholder(ctx, enemy, x, y, size);
      }
    } else {
      // Light OFF — dark silhouette + noise (camera-like effect)
      this._renderEnemySilhouette(ctx, enemy, x, y, size, w, h);
    }
  }

  /**
   * Render enemy silhouette with noise when light is OFF.
   */
  _renderEnemySilhouette(ctx, enemy, x, y, size, w, h) {
    // Dark body
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size * 0.85, size * 0.4, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faint eyes — barely visible
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Static noise overlay (like camera effect)
    const noiseCount = Math.floor(size * 0.3);
    ctx.fillStyle = 'rgba(100, 100, 100, 0.15)';
    for (let i = 0; i < noiseCount; i++) {
      const nx = x + Math.random() * size;
      const ny = y + Math.random() * size;
      ctx.fillRect(nx, ny, 1, 1);
    }
  }

  /**
   * Render placeholder enemy at door (no sprite available).
   */
  _renderDoorPlaceholder(ctx, enemy, x, y, size) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size * 0.8, size * 0.4, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = enemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size * 0.35, y + size * 0.35, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + size * 0.65, y + size * 0.35, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size * 0.65, size * 0.15, 0, Math.PI);
    ctx.fill();

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
      ctx.fillText(isClosed ? i18n.t('hudDoor') : i18n.t('hudDoorOpen'), bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
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
      ctx.fillText(i18n.t('hudLight'), bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    }
  }

  _renderGeneratorButton(ctx, w, h) {
    const bounds = this._hudSystem.getGeneratorButtonBounds(w, h);
    const isActive = this._generatorMiniGame.isActive;
    const isShowingMenu = this._generatorMiniGame.isShowingMenu;

    let bgColor = COLORS.UI_BG;
    let textColor = COLORS.TEXT_PRIMARY;
    let text = i18n.t('hudGenerator');
    let borderColor = COLORS.UI_BORDER;
    let lineWidth = 2;

    if (isShowingMenu) {
      bgColor = '#44aa44';
      textColor = '#000000';
      text = i18n.t('hudGeneratorRotate');
      borderColor = '#44ff44';
      lineWidth = 3;
    } else if (isActive) {
      const blinkRate = CONFIG.GENERATOR_BLINK_RATE;
      const blink = Math.sin(Date.now() / 1000 * Math.PI * 2 * blinkRate) > 0;
      bgColor = blink ? '#ffaa00' : COLORS.UI_BG;
      textColor = blink ? '#000000' : '#ffaa00';
      text = i18n.t('hudGeneratorTap');
      borderColor = '#ffaa00';
      lineWidth = 3;
    } else {
      text = i18n.t('hudGeneratorOk');
      textColor = '#44aa44';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

    ctx.fillStyle = textColor;
    ctx.font = `bold ${UI.FONT_BODY}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
  }

  _renderGeneratorMenu(ctx, w, h) {
    const center = this._getGeneratorMenuCenter(w, h);
    const radius = 80;
    const progress = this._generatorMiniGame.progress;
    const direction = this._generatorMiniGame.direction;
    const timeLeft = this._generatorMiniGame.timeLeft;
    const rotationsNeeded = CONFIG.GENERATOR_ROTATIONS_NEEDED;
    const isCharged = this._generatorMiniGame.isCharged;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (isCharged) {
      ctx.fillStyle = '#44ff44';
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i18n.t('hudGeneratorFull'), center.x, center.y - 20);
      ctx.fillText(i18n.t('hudGeneratorCharge'), center.x, center.y + 10);

      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#888888';
      ctx.font = '14px Courier New';
      ctx.fillText(i18n.t('hudGeneratorClickClose'), center.x, center.y + radius + 30);
      return;
    }

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 8;
    ctx.stroke();

    const progressRad = (progress / (360 * rotationsNeeded)) * Math.PI * 2;
    const startAngle = -Math.PI / 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, startAngle + progressRad);
    ctx.strokeStyle = direction === 'CW' ? '#44ff44' : '#ff8844';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center.x + radius * 0.7 * Math.cos(startAngle + progressRad), 
               center.y + radius * 0.7 * Math.sin(startAngle + progressRad));
    ctx.lineTo(center.x + radius * 1.1 * Math.cos(startAngle + progressRad), 
               center.y + radius * 1.1 * Math.sin(startAngle + progressRad));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(direction === 'CW' ? i18n.t('hudGeneratorClockwise') : i18n.t('hudGeneratorCounterCw'), center.x, center.y - radius - 25);

    ctx.fillStyle = timeLeft < 1.5 ? '#ff4444' : '#ffffff';
    ctx.font = 'bold 24px Courier New';
    ctx.fillText(Math.ceil(timeLeft).toString(), center.x, center.y + radius + 25);

    ctx.fillStyle = '#888888';
    ctx.font = '12px Courier New';
    const currentRotation = progress > 0 ? Math.floor((progress - 1) / 360) + 1 : 0;
    ctx.fillText(currentRotation > 0 ? `${currentRotation}/${rotationsNeeded}` : 'START', center.x, center.y);
  }

  _getGeneratorMenuCenter(w, h) {
    const btnBounds = this._hudSystem.getGeneratorButtonBounds(w, h);
    return {
      x: btnBounds.x + btnBounds.w / 2,
      y: btnBounds.y - 100,
    };
  }

  _updateHUD() {
    this._hudSystem.updateState({
      powerPercent: this._powerSystem.getPowerPercent(),
      currentTime: this._clockSystem.displayTime,
      cameraActive: this._cameraSystem.isActive,
      glitchedCamera: this._glitchMiniGame.glitchedCamera,
    });
  }

  _onPowerOut() {
    this._powerOut = true;
    this._officeSystem.reset();
    this._cameraSystem.close();
    this._audioManager?.stopCameraStaticNoise();
    this._sfxManager?.play('powerOut');
  }

  async _onJumpscare(enemy) {
    // Rare event: show ad instead of jumpscare — enemy "escapes"
    if (!this._adShowing && Math.random() < RANDOM_AD_CHANCE) {
      this._adShowing = true;
      enemy.setState(ENEMY_STATES.PATROL);
      enemy.setAggression(Math.max(0, enemy.aggression - 5));
      // Move enemy back one room so it doesn't instantly attack again
      if (enemy.pathIndex > 0) {
        enemy.startTransitBackward(2000);
      }
      try {
        await this._ads?.showInterstitial();
      } finally {
        this._adShowing = false;
      }
      return; // No jumpscare, game continues
    }

    this._jumpscareSystem.trigger(enemy, () => {
      this._gameOver = true;
      eventBus.emit('game:over', { nightId: this._nightId });
      this._onSceneChange(SCENES.GAME_OVER);
    });
  }

  _onVictory() {
    gameState.markNightCompleted(this._nightId);
    eventBus.emit('game:victory', { night: this._nightId });
    setTimeout(() => {
      this._onSceneChange(SCENES.VICTORY);
    }, 1000);
  }

  _onGlitchFail() {
    this._powerSystem.drain(CONFIG.CAMERA_GLITCH_POWER_PENALTY);
  }

  _bindInput() {
    this._inputManager.on('pointerdown', (x, y) => {
      if (this._paused || this._gameOver || this._victory) return;

      const pos = { x, y };
      const w = this._inputManager.gameWidth;
      const h = this._inputManager.gameHeight;

      // Close generator menu if clicking outside
      if (this._generatorMiniGame.isShowingMenu) {
        const generatorBounds = this._hudSystem.getGeneratorButtonBounds(w, h);
        if (!this._isInRect(pos, generatorBounds)) {
          this._generatorMiniGame.closeInteraction();
          return;
        }
      }

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
          this._audioManager?.stopCameraStaticNoise();
          this._sfxManager?.play('cameraClose');
        } else {
          this._glitchMiniGame.onReturnToCamera();
          this._cameraSystem.open();
          this._audioManager?.startCameraStaticNoise(0.1);
          this._sfxManager?.play('cameraOpen');
        }
        return;
      }

      // Mask toggle
      const maskBounds = this._hudSystem.getMaskToggleBounds(w, h);
      if (this._isInRect(pos, maskBounds)) {
        if (this._maskCooldown > 0) {
          return;
        }
        if (this._maskActive) {
          this._maskActive = false;
          this._maskOxygen = 0;
          this._sfxManager?.play('maskOff');
        } else {
          this._maskActive = true;
          this._maskOxygen = 10;
          this._sfxManager?.play('maskOn');
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

      // Generator button
      const generatorBounds = this._hudSystem.getGeneratorButtonBounds(w, h);
      if (this._isInRect(pos, generatorBounds)) {
        if (this._generatorMiniGame.isShowingMenu) {
          this._generatorMiniGame.closeInteraction();
        } else if (this._generatorMiniGame.isActive) {
          this._generatorMiniGame.startInteraction();
        }
        return;
      }

      // Camera map nodes - can always switch cameras (leaves glitched camera)
      if (this._cameraSystem.isActive) {
        // Always try glitch click first
        const clickedNumber = this._glitchMiniGame.handleClick(x / w, y / h, w, h, this._cameraSystem.currentCamera);
        if (clickedNumber) {
          return;
        }

        const nodes = this._hudSystem.getCameraMapNodes(w, h, ROOM_MAP);
        for (const node of nodes) {
          const dx = pos.x - node.x;
          const dy = pos.y - node.y;
          if (dx * dx + dy * dy <= node.r * node.r) {
            this._cameraSystem.switchTo(node.id);
            if (this._glitchMiniGame.isActive && this._glitchMiniGame.glitchedCamera === this._cameraSystem.currentCamera) {
              this._glitchMiniGame.onReturnToCamera();
            }
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
      if (this._generatorMiniGame.isShowingMenu) {
        const w = this._inputManager.gameWidth;
        const h = this._inputManager.gameHeight;
        const menuCenter = this._getGeneratorMenuCenter(w, h);
        this._generatorMiniGame.handleMouseMove(x, y, menuCenter.x, menuCenter.y);
      }

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
