/**
 * YandexSDK — wrapper for Yandex Games SDK v2.
 * Provides graceful fallback to mock when SDK is unavailable.
 */
export class YandexSDK {
  constructor() {
    this._sdk = null;
    this._player = null;
    this._leaderboard = null;
    this._initialized = false;
    this._mockData = {};
  }

  /** Initialize the Yandex SDK */
  async init() {
    try {
      if (window.YaGames) {
        this._sdk = await YaGames.init();
        this._player = await this._sdk.getPlayer();
        this._leaderboard = this._sdk.getLeaderboards();
        this._initialized = true;
        console.log('[YandexSDK] Initialized');
      } else {
        console.warn('[YandexSDK] SDK not available, using mock');
      }
    } catch (e) {
      console.warn('[YandexSDK] Init failed, using mock:', e);
    }
    return this;
  }

  /** @returns {boolean} Whether real SDK is available */
  get isAvailable() { return this._initialized; }

  /** @returns {Object|null} Raw SDK player instance */
  get player() { return this._player; }

  /** @returns {Object|null} Raw SDK leaderboard instance */
  get leaderboard() { return this._leaderboard; }

  /** Prompt user for data access */
  async requestPlayerDataAccess() {
    if (this._player) {
      return this._player.getDataAccess?.();
    }
    return 'ok';
  }

  /** Get game data from cloud */
  async getData() {
    if (this._player) {
      try { return await this._player.getData(); } catch (e) { /* fallback */ }
    }
    return { ...this._mockData };
  }

  /** Save game data to cloud */
  async setData(data) {
    if (this._player) {
      try { await this._player.setData(data); } catch (e) { /* fallback */ }
    }
    this._mockData = { ...data };
  }

  /** Show fullscreen ad */
  async showFullscreenAdv() {
    if (this._sdk) {
      try {
        await this._sdk.adv.showFullscreenAdv();
        return true;
      } catch (e) { /* fallback */ }
    }
    return false;
  }

  /** Get platform info */
  getPlatformInfo() {
    if (this._sdk) {
      return {
        id: this._sdk.deviceInfo?.type || 'unknown',
        language: this._sdk.environment?.i18n?.lang || 'en',
      };
    }
    return { id: 'desktop', language: 'en' };
  }

  /** Signal gameplay start (for ad timing) */
  gameplayStart() {
    this._sdk?.features?.GameplayAPI?.start();
  }

  /** Signal gameplay stop (for ad timing) */
  gameplayStop() {
    this._sdk?.features?.GameplayAPI?.stop();
  }
}

/** Singleton instance */
export const yandexSDK = new YandexSDK();
