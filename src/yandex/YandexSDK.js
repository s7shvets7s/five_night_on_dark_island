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

  /** @returns {Object|null} Raw SDK instance */
  get sdk() { return this._sdk; }

  /** @returns {Object|null} Raw SDK player instance */
  get player() { return this._player; }

  /** Subscribe to SDK event */
  on(eventName, callback) {
    if (this._sdk?.on) {
      this._sdk.on(eventName, callback);
    } else if (this._initialized === false) {
      console.warn('[YandexSDK] Cannot subscribe, SDK not initialized');
    }
  }

  /** Unsubscribe from SDK event */
  off(eventName, callback) {
    if (this._sdk?.off) {
      this._sdk.off(eventName, callback);
    }
  }

  /** Dispatch SDK event */
  dispatchEvent(eventName, detail) {
    if (this._sdk?.dispatchEvent) {
      return this._sdk.dispatchEvent(eventName, detail);
    }
  }

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

/** Show fullscreen ad with proper callbacks per Yandex requirements */
  async showFullscreenAdv(audioManager = null, sfxManager = null, onCloseCallback = null) {
    if (audioManager) audioManager.pauseAll();
    if (sfxManager) sfxManager.mute();

    let adShown = false;
    if (this._sdk?.adv) {
      try {
        const result = await new Promise((resolve, reject) => {
          this._sdk.adv.showFullscreenAdv({
            callbacks: {
              onOpen: () => { /* ad opened - keep audio paused */ },
              onClose: (wasShown) => { resolve(wasShown); },
              onError: (err) => { reject(err); }
            }
          });
        });
        adShown = result ?? false;
      } catch (e) {
        console.warn('[YandexSDK] Fullscreen ad error:', e);
      }
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }

    if (audioManager) audioManager.resumeAll();
    if (sfxManager) sfxManager.unmute();

    if (onCloseCallback) onCloseCallback(adShown);
    return adShown;
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

  /** Signal that loading is complete and game is ready to play */
  ready() {
    try {
      if (this._sdk?.features?.LoadingAPI) {
        this._sdk.features.LoadingAPI.ready();
        console.log('[YandexSDK] LoadingAPI.ready() called');
      } else if (window.YaGames?.features?.LoadingAPI) {
        window.YaGames.features.LoadingAPI.ready();
        console.log('[YandexSDK] LoadingAPI.ready() called (window)');
      } else {
        console.log('[YandexSDK] LoadingAPI not available, skipping');
      }
    } catch (e) {
      console.warn('[YandexSDK] LoadingAPI.ready() failed:', e);
    }
  }

  /** Check if can show review prompt */
  async canReview() {
    if (this._sdk?.feedback?.canReview) {
      return await this._sdk.feedback.canReview();
    }
    return { value: false, reason: 'SDK_NOT_AVAILABLE' };
  }

  /** Request review from user */
  async requestReview() {
    if (this._sdk?.feedback?.requestReview) {
      return await this._sdk.feedback.requestReview();
    }
    return { feedbackSent: false };
  }

  /** Check if can show shortcut prompt */
  async canShowShortcut() {
    if (this._sdk?.shortcut?.canShowPrompt) {
      return await this._sdk.shortcut.canShowPrompt();
    }
    return { canShow: false };
  }

  /** Show shortcut prompt */
  async showShortcut() {
    if (this._sdk?.shortcut?.showPrompt) {
      return await this._sdk.shortcut.showPrompt();
    }
    return { outcome: 'unavailable' };
  }
}

/** Singleton instance */
export const yandexSDK = new YandexSDK();
