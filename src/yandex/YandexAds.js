/**
 * YandexAds — ad management wrapper.
 * Handles interstitial and rewarded ads with fallback.
 */
export class YandexAds {
  /**
   * @param {Object} sdk - YandexSDK instance
   * @param {Object} audioManager - AudioManager for muting during ads
   * @param {Object} sfxManager - SFXManager for muting during ads
   * @param {Object} yandexSDK - YandexSDK wrapper for gameplay markup
   */
  constructor(sdk, audioManager = null, sfxManager = null, yandexSDK = null) {
    this._sdk = sdk;
    this._audioManager = audioManager;
    this._sfxManager = sfxManager;
    this._yandexSDK = yandexSDK;
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

  /** Show interstitial ad */
  async showInterstitial() {
    this._yandexSDK?.gameplayStop();
    if (this._audioManager) this._audioManager.pauseAll();
    if (this._sfxManager) this._sfxManager.mute();

    let adShown = false;
    if (this._sdk?.isAvailable) {
      try {
        adShown = await this._sdk.showFullscreenAdv(this._audioManager, this._sfxManager);
      } catch (e) {
        console.warn('[YandexAds] Interstitial failed, using mock');
      }
    } else {
      await new Promise(r => setTimeout(r, 1000));
    }

    if (this._audioManager) this._audioManager.resumeAll();
    if (this._sfxManager) this._sfxManager.unmute();
    this._yandexSDK?.gameplayStart();
    return adShown;
  }

  /**
   * Show rewarded ad.
   * @param {Function} onReward - Called when reward is granted
   */
  async showRewarded(onReward) {
    this._yandexSDK?.gameplayStop();
    if (this._audioManager) this._audioManager.pauseAll();
    if (this._sfxManager) this._sfxManager.mute();

    let rewarded = false;
    if (this._sdk?.isAvailable && this._sdk._sdk) {
      try {
        await this._sdk._sdk.adv.showRewardedVideo({
          onRewarded: () => {
            rewarded = true;
            onReward?.();
          },
        });
      } catch (e) {
        console.warn('[YandexAds] Rewarded failed, using mock');
        onReward?.();
      }
    } else {
      onReward?.();
    }

    if (this._audioManager) this._audioManager.resumeAll();
    if (this._sfxManager) this._sfxManager.unmute();
    this._yandexSDK?.gameplayStart();
    return rewarded;
  }
}
