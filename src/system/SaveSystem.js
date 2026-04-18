/**
 * SaveSystem — cloud save/load via YandexPlayer.
 * Handles persistence of game progress (unlocked nights, completed nights, settings).
 */
import { gameState } from '../config/gameConfig.js';

/** Key used for cloud storage */
const SAVE_KEY = 'island_night_watch_save';

export class SaveSystem {
  /**
   * @param {Object} player - YandexPlayer instance
   * @param {Object} [audioManager] - AudioManager instance
   * @param {Object} [sfxManager] - SFXManager instance
   */
  constructor(player, audioManager = null, sfxManager = null) {
    this._player = player;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._saveData = {
      unlockedNight: 1,
      completedNights: [],
      volume: 0.7,
      sfxVolume: 0.8,
      musicVolume: 0.5,
      locale: 'ru',
    };
    this._dirty = false;
    this._saveTimer = 0;
    this._autoSaveDelay = 2.0; // seconds before auto-save
  }

  /** Load data from cloud and apply to gameState */
  async load() {
    if (!this._player) {
      console.log('[SaveSystem] No player available, using defaults');
      return false;
    }

    try {
      const data = await this._player.load();
      const saved = data?.[SAVE_KEY];

      if (saved) {
        this._saveData = { ...this._saveData, ...saved };
        this._applyToGameState();
        console.log('[SaveSystem] Loaded:', this._saveData);
        return true;
      }

      console.log('[SaveSystem] No save data found');
      return false;
    } catch (e) {
      console.warn('[SaveSystem] Load failed, using defaults:', e);
      return false;
    }
  }

  /** Mark data as dirty — will be saved on next auto-save cycle */
  markDirty() {
    this._dirty = true;
  }

  /**
   * Force save immediately.
   * @returns {Promise<boolean>} Whether save succeeded
   */
  async save() {
    if (!this._player) {
      console.log('[SaveSystem] No player available, skipping save');
      return false;
    }

    this._syncFromGameState();

    if (this._audioManager) this._audioManager.pauseAll();
    if (this._sfxManager) this._sfxManager.mute();

    try {
      await this._player.save({ [SAVE_KEY]: this._saveData });
      this._dirty = false;
      console.log('[SaveSystem] Saved:', this._saveData);
    } catch (e) {
      console.warn('[SaveSystem] Save failed:', e);
    }

    if (this._audioManager) this._audioManager.resumeAll();
    if (this._sfxManager) this._sfxManager.unmute();

    return true;
  }

  /** Update auto-save timer. Call every frame from game loop. */
  update(dt) {
    if (!this._dirty) return;

    this._saveTimer += dt;
    if (this._saveTimer >= this._autoSaveDelay) {
      this._saveTimer = 0;
      this.save();
    }
  }

  /** Sync save data from current gameState */
  _syncFromGameState() {
    this._saveData = {
      unlockedNight: gameState.getUnlockedNight(),
      completedNights: Array.from(gameState._completedNights),
      volume: gameState.getVolume(),
      sfxVolume: gameState.getSFXVolume(),
      musicVolume: gameState.getMusicVolume(),
      locale: gameState.getLocale(),
    };
  }

  /** Apply loaded save data to gameState */
  _applyToGameState() {
    gameState._unlockedNight = this._saveData.unlockedNight || 1;
    gameState._completedNights = new Set(this._saveData.completedNights || []);
    gameState._volume = this._saveData.volume ?? 0.7;
    gameState._sfxVolume = this._saveData.sfxVolume ?? 0.8;
    gameState._musicVolume = this._saveData.musicVolume ?? 0.5;
    gameState._locale = this._saveData.locale || 'ru';
  }

  /** @returns {Object} Current save data (for debugging) */
  getDebugData() {
    return { ...this._saveData, dirty: this._dirty };
  }
}
