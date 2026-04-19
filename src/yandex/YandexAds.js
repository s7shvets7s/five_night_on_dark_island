/**
 * YandexAds — ad management wrapper.
 * Handles interstitial and rewarded ads with fallback.
 * Fixed: audio pause/resume ONLY in callbacks (per Yandex requirements).
 */
export class YandexAds {
  /**
   * @param {Object} sdk - YandexSDK instance
   * @param {Object} audioManager - AudioManager for muting during ads
   * @param {Object} sfxManager - SFXManager for muting during ads
   * @param {Object} yandexSDK - YandexSDK wrapper for gameplay markup
   * @param {Object} inputManager - InputManager to restart after ads
   */
  constructor(sdk, audioManager = null, sfxManager = null, yandexSDK = null, inputManager = null) {
    this._sdk = sdk;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._yandexSDK = yandexSDK;
    this._inputManager = inputManager;
    this._adPending = false;
  }


  /** Update audio manager reference */
  setAudioManager(audioManager) {
    this._audioManager = audioManager;
  }


  /** Update SFX manager reference */
  setSFXManager(sfxManager) {
    this._sfxManager = sfxManager;
  }


  /** Update YandexSDK reference */
  setYandexSDK(yandexSDK) {
    this._yandexSDK = yandexSDK;
  }


  /** Update InputManager reference */
  setInputManager(inputManager) {
    this._inputManager = inputManager;
  }


  /**
   * Show interstitial ad.
   * Accepts either a plain callback function OR an options object { onClose, onError }.
   *
   * @param {Function|Object} options - callback function OR { onClose, onError }
   */
  showInterstitial(options) {
    // Поддержка обоих форматов вызова:
    // showInterstitial((wasShown) => {})          — старый формат
    // showInterstitial({ onClose, onError })       — новый формат
    const onClose = typeof options === 'function' ? options : options?.onClose;
    const onError = typeof options === 'function' ? null   : options?.onError;

    if (this._adPending) {
      console.warn('[YandexAds] Ad already pending, skipping');
      onClose?.(false);
      return;
    }

    this._adPending = true;

    if (this._sdk?.isAvailable && this._sdk._sdk) {
      this._sdk._sdk.adv.showFullscreenAdv({
        callbacks: {
          onOpen: () => {
            console.log('[YandexAds] Interstitial opened');
          },
          onClose: (wasShown) => {
            console.log('[YandexAds] Interstitial closed, wasShown:', wasShown);
            this._cleanupAfterAd();
            onClose?.(wasShown);
          },
          onError: (error) => {
            console.error('[YandexAds] Interstitial error:', error);
            this._cleanupAfterAd();
            // Если передан onError — вызываем его, иначе fallback на onClose
            if (onError) {
              onError(error);
            } else {
              onClose?.(false);
            }
          },
        },
      });
    } else {
      console.warn('[YandexAds] SDK not available, using mock');
      setTimeout(() => {
        this._cleanupAfterAd();
        onClose?.(false);
      }, 1000);
    }
  }


  _cleanupAfterAd() {
    if (this._audioManager) this._audioManager.resumeAll();
    if (this._sfxManager) this._sfxManager.unmute();
    if (this._inputManager) this._inputManager.resetPointer();
    this._adPending = false;
  }


  /** Show rewarded ad - uses ONLY callbacks for pause/resume */
  showRewarded(onReward) {
    if (!onReward) {
      console.warn('[YandexAds] showRewarded requires onReward callback');
      return;
    }

    if (this._adPending) {
      console.warn('[YandexAds] Ad already pending, skipping');
      onReward(false);
      return;
    }

    this._adPending = true;
    this._yandexSDK?.gameplayStop();

    if (this._sdk?.isAvailable && this._sdk._sdk) {
      this._sdk._sdk.adv.showRewardedVideo({
        callbacks: {
          onOpen: () => {
            console.log('[YandexAds] Rewarded opened');
          },
          onRewarded: () => {
            console.log('[YandexAds] Rewarded completed - reward granted');
            this._cleanupAfterAd();
            onReward(true);
          },
          onClose: () => {
            console.log('[YandexAds] Rewarded closed without reward');
            this._cleanupAfterAd();
            onReward(false);
          },
          onError: (error) => {
            console.error('[YandexAds] Rewarded error:', error);
            this._cleanupAfterAd();
            onReward(false);
          },
        },
      });
    } else {
      console.warn('[YandexAds] SDK not available, using mock');
      setTimeout(() => {
        this._cleanupAfterAd();
        onReward(false);
      }, 1000);
    }
  }
}