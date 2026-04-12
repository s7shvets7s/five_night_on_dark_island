/**
 * HUDSystem — renders the game HUD overlay.
 */
import { COLORS, UI } from '../config/gameConfig.js';

export class HUDSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._powerPercent = 100;
    this._currentTime = '12 AM';
    this._cameraActive = false;
    this._showCameraMap = false;
  }

  /**
   * Update HUD state.
   * @param {Object} state
   */
  updateState(state) {
    if (state.powerPercent !== undefined) this._powerPercent = state.powerPercent;
    if (state.currentTime !== undefined) this._currentTime = state.currentTime;
    if (state.cameraActive !== undefined) this._cameraActive = state.cameraActive;
    if (state.showCameraMap !== undefined) this._showCameraMap = state.showCameraMap;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUG FIX: render() was missing — NightScene called this method every frame,
  // throwing TypeError: this._hudSystem.render is not a function which crashed
  // the entire render pipeline (power bar, clock, buttons all disappeared).
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Render all persistent HUD elements.
   * Called every frame by NightScene.render().
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w - Current game width
   * @param {number} h - Current game height
   */
  render(ctx, w, h) {
    this._drawPowerBar(ctx, w, h);
    this._drawClock(ctx, w, h);
    this._drawCameraToggle(ctx, w, h);
    this._drawPauseButton(ctx, w, h);
  }

  /**
   * Render mask button (called from NightScene).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {boolean} maskActive
   * @param {number} cooldown - seconds remaining on cooldown
   */
  renderMaskButton(ctx, w, h, maskActive, cooldown) {
    this._drawMaskButton(ctx, w, h, maskActive, cooldown);
  }

  /**
   * Render oxygen bar (called from NightScene).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {number} oxygenLevel - seconds remaining (0-10)
   */
  renderOxygenBar(ctx, w, h, oxygenLevel) {
    this._drawOxygenBar(ctx, w, h, oxygenLevel);
  }

  /**
   * Render mask overlay on screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  renderMaskOverlay(ctx, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, w, h);

    const eyeWidth = radius * 0.35;
    const eyeHeight = radius * 0.5;
    const eyeY = centerY - radius * 0.15;
    const leftEyeX = centerX - radius * 0.35;
    const rightEyeX = centerX + radius * 0.35;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY, eyeWidth * 0.7, eyeHeight * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rightEyeX, eyeY, eyeWidth * 0.7, eyeHeight * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render camera map overlay — FNAF 2 style: nodes + corridor lines.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {Object} rooms - Room definitions
   * @param {string} selectedCamera - Currently selected camera ID
   * @param {Array} [enemies] - Enemy array for presence indicators
   */
  renderCameraMap(ctx, w, h, rooms, selectedCamera, enemies) {
    if (!rooms) return;

    const mapW = w * 0.24;
    const mapH = h * 0.5;
    const mapX = w - mapW - UI.PADDING - 80;
    const mapY = h * 0.15;

    const toMapX = (rx) => mapX + UI.PADDING + rx * (mapW - UI.PADDING * 2);
    const toMapY = (ry) => mapY + UI.PADDING + ry * (mapH - UI.PADDING * 2 - 24);

    const roomsArr = Object.values(rooms).filter(r => !r.isOffice);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    ctx.fillStyle = '#2a5a2a';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CAMERAS', mapX + UI.PADDING, mapY + 5);

    const drawn = new Set();

    for (const room of roomsArr) {
      const cx = toMapX(room.x);
      const cy = toMapY(room.y);

      if (!room.connections) continue;

      for (const connId of room.connections) {
        const conn = rooms[connId];
        if (!conn) continue;

        const edgeKey = [room.id, connId].sort().join('-');
        if (drawn.has(edgeKey)) continue;
        drawn.add(edgeKey);

        const nx = toMapX(conn.x);
        const ny = toMapY(conn.y);

        const isHighlighted = room.id === selectedCamera || connId === selectedCamera;
        ctx.strokeStyle = isHighlighted ? 'rgba(139, 0, 0, 0.7)' : 'rgba(60, 120, 60, 0.3)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    }

    const office = rooms['office'];
    if (office) {
      const ox = toMapX(office.x);
      const oy = toMapY(office.y);

      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath();
      ctx.arc(ox, oy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a4a6a';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#8888aa';
      ctx.font = 'bold 8px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('OFFICE', ox, oy + 16);
    }

    for (const room of roomsArr) {
      const cx = toMapX(room.x);
      const cy = toMapY(room.y);
      const isSelected = room.id === selectedCamera;
      const hasEnemy = enemies?.some(e => e.currentRoom === room.id && !e.isDefeated);

      const nodeR = 12;

      if (isSelected) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        ctx.strokeStyle = `rgba(204, 34, 34, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, nodeR + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isSelected ? '#3a1010' : hasEnemy ? '#2a2a10' : '#0a1a0a';
      ctx.beginPath();
      ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#cc2222' : hasEnemy ? '#aa8800' : '#3a7a3a';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
      ctx.stroke();

      if (hasEnemy) {
        const blink = Math.sin(Date.now() * 0.008) > 0;
        if (blink) {
          ctx.fillStyle = '#ff4400';
          ctx.beginPath();
          ctx.arc(cx + nodeR - 2, cy - nodeR + 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = isSelected ? '#ffffff' : '#88aa88';
      ctx.font = `${isSelected ? 'bold ' : ''}8px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const words = room.name.split(' ');
      const lineH = 10;
      const labelY = cy + nodeR + 3;
      if (words.length > 1) {
        ctx.fillText(words[0], cx, labelY);
        ctx.fillText(words.slice(1).join(' '), cx, labelY + lineH);
      } else {
        ctx.fillText(room.name, cx, labelY);
      }
    }
  }

  _drawPowerBar(ctx, w, h) {
    const barW = w * 0.2;
    const barH = UI.BAR_HEIGHT;
    const x = UI.PADDING;
    const y = h - UI.PADDING - barH - 30;

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${UI.FONT_SMALL}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Power', x, y - 4);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, barW, barH);

    const color = this._powerPercent > 30 ? COLORS.POWER_OK : COLORS.POWER_LOW;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW * (this._powerPercent / 100), barH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.floor(this._powerPercent)}%`, x, y + barH + 4);
  }

  _drawClock(ctx, w, h) {
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${UI.FONT_SUBTITLE}px Courier New`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this._currentTime, w - UI.PADDING, UI.PADDING);
  }

  _drawCameraToggle(ctx, w, h) {
    const btnW = 120;
    const btnH = 44;
    const x = (w - btnW) / 2;
    const y = h - btnH - UI.PADDING;

    ctx.fillStyle = this._cameraActive ? COLORS.ACCENT_RED : COLORS.UI_BG;
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnW, btnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._cameraActive ? 'Close Camera' : 'Open Camera', x + btnW / 2, y + btnH / 2);
  }

  _drawMaskButton(ctx, w, h, maskActive, cooldown) {
    const bounds = this.getMaskButtonBounds(w, h);
    const { x, y, w: btnW, h: btnH } = bounds;

    let bgColor = COLORS.UI_BG;
    let text = 'MASK';

    if (maskActive) {
      bgColor = '#00aa00';
      text = 'REMOVE';
    } else if (cooldown > 0) {
      bgColor = '#666666';
      text = `WAIT ${Math.ceil(cooldown)}`;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnW, btnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + btnW / 2, y + btnH / 2);
  }

  _drawOxygenBar(ctx, w, h, oxygenLevel) {
    const barW = w * 0.6;
    const barH = 12;
    const barX = (w - barW) / 2;
    const barY = 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barW, barH);

    const oxygenWidth = (oxygenLevel / 10) * barW;
    let barColor = '#00ff00';
    if (oxygenLevel < 3) barColor = '#ff0000';
    else if (oxygenLevel < 6) barColor = '#ffaa00';

    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, oxygenWidth, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OXYGEN', w / 2, barY + barH / 2);
  }

  _drawPauseButton(ctx, w, h) {
    const btnW = 44;
    const btnH = 44;
    const x = w - UI.PADDING - btnW;
    const y = UI.PADDING + 30;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnW, btnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = 'bold 18px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('||', x + btnW / 2, y + btnH / 2);
  }

  /**
   * Get camera toggle button bounds for hit testing.
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getCameraToggleBounds(w, h) {
    return this.getCameraButtonBounds(w, h);
  }

  getMaskToggleBounds(w, h) {
    return this.getMaskButtonBounds(w, h);
  }

  /**
   * Get door button bounds.
   * @param {'left'|'right'} side
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getDoorButtonBounds(side, w, h) {
    const btnW = 60;
    const btnH = 44;
    const x = side === 'left' ? UI.PADDING : w - UI.PADDING - btnW;
    const y = h * 0.4;
    return { x, y, w: btnW, h: btnH };
  }

  /**
   * Get light button bounds.
   * @param {'left'|'right'} side
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getLightButtonBounds(side, w, h) {
    const btnW = 60;
    const btnH = 44;
    const x = side === 'left' ? UI.PADDING : w - UI.PADDING - btnW;
    const y = h * 0.4 + UI.INTERACTIVE_MIN + 10;
    return { x, y, w: btnW, h: btnH };
  }

  /**
   * Get mask button bounds (next to camera button).
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getMaskButtonBounds(w, h) {
    const btnW = 120;
    const btnH = 44;
    const x = w - btnW - 20;
    const y = h - btnH - 20;
    return { x, y, w: btnW, h: btnH };
  }

  /**
   * Get camera button bounds.
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getCameraButtonBounds(w, h) {
    const btnW = 120;
    const btnH = 44;
    const x = (w - btnW) / 2;
    const y = h - btnH - UI.PADDING;
    return { x, y, w: btnW, h: btnH };
  }

  getPauseButtonBounds(w, h) {
    const btnW = 44;
    const btnH = 44;
    const x = w - UI.PADDING - btnW;
    const y = UI.PADDING + 30;
    return { x, y, w: btnW, h: btnH };
  }

  /**
   * Get camera map node screen positions for hit testing.
   * @param {number} w
   * @param {number} h
   * @param {Object} rooms - Room definitions
   * @returns {Array<{id: string, x: number, y: number, r: number}>}
   */
  getCameraMapNodes(w, h, rooms) {
    if (!rooms) return [];

    const mapW = w * 0.24;
    const mapH = h * 0.5;
    const mapX = w - mapW - UI.PADDING - 80;
    const mapY = h * 0.15;

    const toMapX = (rx) => mapX + UI.PADDING + rx * (mapW - UI.PADDING * 2);
    const toMapY = (ry) => mapY + UI.PADDING + ry * (mapH - UI.PADDING * 2 - 24);

    const nodes = [];
    console.log('[HUDSystem] Rooms for map:', Object.keys(rooms));
    for (const room of Object.values(rooms)) {
      if (room.isOffice) continue;
      nodes.push({
        id: room.id,
        x: toMapX(room.x),
        y: toMapY(room.y),
        r: 18,
      });
    }
    console.log('[HUDSystem] Map nodes:', nodes.map(n => n.id));
    return nodes;
  }
}
