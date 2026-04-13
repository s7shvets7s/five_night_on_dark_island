/**
 * JumpscareSystem — handles jumpscare triggers and animation.
 * Renders enemy attack sprite with screen shake and flash effects.
 */
import { ENEMY_CONFIG } from '../config/enemyConfig.js';

export class JumpscareSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   * @param {AssetLoader} [deps.assetLoader]
   */
  constructor({ eventBus, assetLoader }) {
    this._eventBus = eventBus;
    this._assetLoader = assetLoader || null;
    this._isActive = false;
    this._currentEnemy = null;
    this._elapsed = 0;
    this._duration = 2000;
    this._onComplete = null;
  }

  /**
   * Trigger a jumpscare.
   * @param {Object} enemy - Enemy instance { id, name, color }
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
   * Render jumpscare with enemy attack sprite.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  render(ctx, w, h) {
    if (!this._isActive || !this._currentEnemy) return;

    const progress = Math.min(this._elapsed / this._duration, 1);
    const shake = Math.sin(this._elapsed * 0.05) * 20 * (1 - progress);

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    // Flash background
    const flash = Math.sin(this._elapsed * 0.02) > 0;
    ctx.fillStyle = flash ? '#1a0000' : '#000000';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Scale effect — enemy zooms in
    const scale = 1 + progress * 0.5;

    // Try to render attack sprite
    const spriteRendered = this._renderAttackSprite(ctx, w, h, cx, cy, scale);

    // Fallback to placeholder if sprite not available
    if (!spriteRendered) {
      this._renderPlaceholder(ctx, w, h, cx, cy, scale);
    }

    // Enemy name at bottom
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this._currentEnemy.name || '', cx, h - 30);

    // Vignette overlay for horror effect
    const maxDim = Math.max(w, h);
    const gradient = ctx.createRadialGradient(cx, cy, maxDim * 0.1, cx, cy, maxDim * 0.8);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }

  /**
   * Try to render the enemy attack sprite.
   * @returns {boolean} Whether sprite was rendered
   */
  _renderAttackSprite(ctx, w, h, cx, cy, scale) {
    if (!this._currentEnemy || !this._assetLoader) return false;

    const config = ENEMY_CONFIG[this._currentEnemy.id];
    if (!config || !config.sprites || !config.sprites.attack) return false;

    const spriteKey = `enemies_${config.sprites.attack.replace('.png', '')}`;
    const sprite = this._assetLoader.getImage(spriteKey);

    if (!sprite || !sprite.complete || sprite.naturalWidth === 0) return false;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const size = Math.max(w, h) * 0.8;
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);

    ctx.restore();
    return true;
  }

  /**
   * Render placeholder jumpscare (colored circle with scary face).
   */
  _renderPlaceholder(ctx, w, h, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const enemyColor = this._currentEnemy.color || '#ff0000';

    // Body
    ctx.fillStyle = enemyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-35, -20, 25, 0, Math.PI * 2);
    ctx.arc(35, -20, 25, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-35, -20, 12, 0, Math.PI * 2);
    ctx.arc(35, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 30, 50, 0, Math.PI);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#ffffff';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(i * 14 - 5, 30, 10, 15);
    }

    ctx.restore();
  }

  /** @returns {boolean} */
  get isActive() { return this._isActive; }
}
