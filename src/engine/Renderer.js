/**
 * Renderer — shared visual effect utilities.
 * All effects work with base coordinates and are resolution-independent.
 */
export class Renderer {
  /**
   * Draw scanline overlay.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {number} [opacity=0.04]
   * @param {number} [spacing=3]
   */
  static scanlines(ctx, w, h, opacity = 0.04, spacing = 3) {
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    for (let y = 0; y < h; y += spacing) {
      ctx.fillRect(0, y, w, 1);
    }
  }

  /**
   * Draw radial vignette.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {string} [color='rgba(0,0,0,0.6)']
   */
  static vignette(ctx, w, h, color = 'rgba(0, 0, 0, 0.6)') {
    const maxDim = Math.max(w, h);
    const innerR = maxDim * 0.25;
    const outerR = maxDim * 0.7;
    const gradient = ctx.createRadialGradient(w / 2, h / 2, innerR, w / 2, h / 2, outerR);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Draw static/noise effect (lightweight — random rectangles, not per-pixel).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {number} [intensity=0.08]
   * @param {number} [seed=0] - Optional seed for deterministic noise
   */
  static noise(ctx, w, h, intensity = 0.08, seed = 0) {
    const count = Math.floor(w * h * intensity / 100);
    ctx.fillStyle = 'rgba(200, 200, 200, 0.05)';

    let s = seed || Date.now();
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };

    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const sw = rand() * 4 + 1;
      const sh = 1;
      ctx.fillRect(x, y, sw, sh);
    }
  }

  /**
   * Draw a placeholder rectangle with label (for missing assets).
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} label
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  static placeholder(ctx, label, x, y, w, h) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#555';
    ctx.font = '12px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
  }

  /**
   * Draw a filled rectangle with rounded corners.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} radius
   */
  static roundRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
