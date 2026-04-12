/**
 * JumpscareSystem — handles jumpscare triggers and animation.
 */
export class JumpscareSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._isActive = false;
    this._currentEnemy = null;
    this._elapsed = 0;
    this._duration = 2000;
    this._onComplete = null;
  }

  /**
   * Trigger a jumpscare.
   * @param {Object} enemy - Enemy data { id, name, color }
   * @param {Function} onComplete - Callback after jumpscare animation
   */
  trigger(enemy, onComplete) {
    this._isActive = true;
    this._currentEnemy = enemy;
    this._elapsed = 0;
    this._onComplete = onComplete;
    this._eventBus.emit('jumpscare:trigger', { enemyId: enemy.id });
  }

  /**
   * Update jumpscare animation.
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    if (!this._isActive) return;

    this._elapsed += dt;

    if (this._elapsed >= this._duration) {
      this._isActive = false;
      this._onComplete?.();
    }
  }

  /**
   * Render jumpscare.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  render(ctx, w, h) {
    if (!this._isActive || !this._currentEnemy) return;

    const progress = this._elapsed / this._duration;
    const shake = Math.sin(this._elapsed * 0.05) * 20 * (1 - progress);

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    const flash = Math.sin(this._elapsed * 0.02) > 0;
    ctx.fillStyle = flash ? '#1a0000' : '#000000';
    ctx.fillRect(0, 0, w, h);

    const scale = 1 + progress * 0.5;
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.fillStyle = this._currentEnemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-35, -20, 25, 0, Math.PI * 2);
    ctx.arc(35, -20, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-35, -20, 12, 0, Math.PI * 2);
    ctx.arc(35, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 30, 50, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(i * 14 - 5, 30, 10, 15);
    }

    ctx.restore();

    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this._currentEnemy.name, cx, h - 30);

    ctx.restore();
  }

  /** @returns {boolean} */
  get isActive() { return this._isActive; }
}
