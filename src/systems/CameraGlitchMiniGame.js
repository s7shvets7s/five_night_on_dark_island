/**
 * CameraGlitchMiniGame — manages camera malfunction mini-game.
 * Player must click numbers in order (ascending or descending).
 * Glitch is per-camera, not global.
 */
import { CAMERA_GLITCH, CONFIG } from '../config/gameConfig.js';

export class CameraGlitchMiniGame {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   * @param {Function} deps.onSolve - called when player solves the puzzle
   * @param {Function} deps.onFail - called when player clicks wrong number
   */
  constructor({ eventBus, onSolve, onFail }) {
    this._eventBus = eventBus;
    this._onSolve = onSolve;
    this._onFail = onFail;

    this._glitchedCamera = null;
    this._numbers = [];
    this._currentIndex = 0;
    this._ascending = true;
    this._circles = [];
    this._started = false;
    this._nightId = 1;
  }

  /**
   * Initialize glitch for a specific night.
   * @param {number} nightId
   */
  init(nightId) {
    this._nightId = nightId;
    this._breakChance = CAMERA_GLITCH.BREAK_CHANCE[nightId] || 0.15;
    this._numbersCount = CAMERA_GLITCH.NUMBERS_COUNT[nightId] || 3;
    this._checkTimer = this._randomInterval();
    this._lastCheck = 0;
    this._glitchedCamera = null;
  }

  /**
   * Update glitch check timer.
   * @param {number} dt - delta time in seconds
   * @param {string|null} currentCamera - currently viewed camera
   */
  update(dt, currentCamera) {
    if (this._glitchedCamera) return;

    this._lastCheck += dt;
    if (this._lastCheck >= this._checkTimer) {
      this._lastCheck = 0;
      this._checkTimer = this._randomInterval();

      if (Math.random() < this._breakChance && currentCamera) {
        this._activate(currentCamera);
      }
    }
  }

  /**
   * Activate glitch for a specific camera.
   * @param {string} cameraId
   */
  _activate(cameraId) {
    this._glitchedCamera = cameraId;
    this._started = false;
    this._currentIndex = 0;
    this._ascending = Math.random() > 0.5;
    this._generateNumbers();
    this._generateCirclePositions();
    this._eventBus.emit('camera:glitch', { active: true, cameraId });
  }

  /**
   * Generate random numbers for the puzzle.
   */
  _generateNumbers() {
    const count = this._numbersCount;
    const numbers = [];
    const used = new Set();

    while (numbers.length < count) {
      const num = Math.floor(Math.random() * 9) + 1;
      if (!used.has(num)) {
        used.add(num);
        numbers.push(num);
      }
    }

    if (this._ascending) {
      numbers.sort((a, b) => a - b);
    } else {
      numbers.sort((a, b) => b - a);
    }

    this._numbers = numbers;
  }

  /**
   * Generate random positions for circles within camera view area.
   */
  _generateCirclePositions() {
    const count = this._numbersCount;
    const circles = [];
    const minDist = 0.06;

    const camX = 0.15;
    const camY = 0.2;
    const camW = 0.7;
    const camH = 0.6;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let valid = false;
      let x, y;

      while (!valid && attempts < 50) {
        x = camX + 0.08 + Math.random() * (camW - 0.16);
        y = camY + 0.15 + Math.random() * (camH - 0.3);
        valid = true;

        for (const other of circles) {
          const dx = x - other.x;
          const dy = y - other.y;
          if (Math.sqrt(dx * dx + dy * dy) < minDist) {
            valid = false;
            break;
          }
        }
        attempts++;
      }

      circles.push({
        x: x,
        y: y,
        value: this._numbers[i],
        r: 0.018,
      });
    }

    this._circles = circles;
  }

  /**
   * Handle click on mini-game.
   * @param {number} x - click x (normalized 0-1)
   * @param {number} y - click y (normalized 0-1)
   * @param {number} w - canvas width
   * @param {number} h - canvas height
   * @param {string} currentCamera - currently viewed camera ID
   * @returns {boolean} true if click was on a circle
   */
  handleClick(x, y, w, h, currentCamera) {
    if (!this._glitchedCamera || this._glitchedCamera !== currentCamera) return false;

    this._started = true;

    // Camera view area (normalized 0-1)
    const camX = 0.15;
    const camY = 0.2;
    const camW = 0.7;
    const camH = 0.6;

    // Check if click is within camera view area
    if (x < camX || x > camX + camW || y < camY || y > camY + camH) {
      return false;
    }

    // Try each circle with generous hitbox
    for (const circle of this._circles) {
      const cx = circle.x;
      const cy = circle.y;
      const r = circle.r;

      // Simple box hit detection first
      const hitBox = 0.15;
      if (x >= cx - hitBox && x <= cx + hitBox && y >= cy - hitBox && y <= cy + hitBox) {
        const expectedValue = this._numbers[this._currentIndex];
        if (circle.value === expectedValue) {
          this._currentIndex++;
          if (this._currentIndex >= this._numbers.length) {
            this._solve();
          } else {
            this._circles = this._circles.filter(c => c.value !== circle.value);
          }
          return true;
        } else {
          this._fail();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Player solved the puzzle.
   */
  _solve() {
    this._glitchedCamera = null;
    this._started = false;
    this._eventBus.emit('camera:glitch', { active: false, cameraId: null });
    if (this._onSolve) this._onSolve();
  }

  /**
   * Player clicked wrong number.
   */
  _fail() {
    this._currentIndex = 0;
    this._generateNumbers();
    this._generateCirclePositions();
    this._eventBus.emit('camera:glitch:fail');
    if (this._onFail) this._onFail();
  }

  /**
   * Called when switching cameras. If leaving glitched camera without solving, 
   * the glitch stays (player can return later).
   * @param {string} newCameraId
   */
  onCameraSwitch(newCameraId) {
    // Glitch stays on the camera, player can return to fix it
    // No penalty for leaving, but no reset either
  }

  /**
   * Refresh numbers when returning to glitched camera.
   */
  onReturnToCamera() {
    if (this._glitchedCamera) {
      this._currentIndex = 0;
      this._generateNumbers();
      this._generateCirclePositions();
    }
  }

  /**
   * @returns {boolean}
   */
  get isActive() { return !!this._glitchedCamera; }

  /**
   * @returns {string|null}
   */
  get glitchedCamera() { return this._glitchedCamera; }

  /**
   * @returns {boolean}
   */
  get wasStarted() { return this._started; }

  /**
   * Render mini-game inside camera frame.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  render(ctx, w, h) {
    if (!this._glitchedCamera) return;

    // Camera view area (normalized 0-1)
    const camX = 0.15;
    const camY = 0.2;
    const camW = 0.7;
    const camH = 0.6;

    const viewX = camX * w;
    const viewY = camY * h;
    const viewW = camW * w;
    const viewH = camH * h;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(viewX, viewY, viewW, viewH);

    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('CAMERA MALFUNCTION', w / 2, h * 0.08);

    const instruction = this._ascending
      ? 'Click numbers in ASCENDING order'
      : 'Click numbers in DESCENDING order';
    ctx.fillStyle = this._ascending ? '#44ff44' : '#ff4444';
    ctx.font = '14px Courier New';
    ctx.fillText(instruction, w / 2, h * 0.13);

    for (const circle of this._circles) {
      const cx = circle.x * w;
      const cy = circle.y * h;
      const r = circle.r * w;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = this._ascending ? '#228822' : '#882222';
      ctx.fill();
      ctx.strokeStyle = this._ascending ? '#44ff44' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(circle.value.toString(), cx, cy);
    }
  }

  /**
   * @returns {number} Random interval between min and max
   */
  _randomInterval() {
    return CAMERA_GLITCH.CHECK_INTERVAL_MIN
      + Math.random() * (CAMERA_GLITCH.CHECK_INTERVAL_MAX - CAMERA_GLITCH.CHECK_INTERVAL_MIN);
  }
}
