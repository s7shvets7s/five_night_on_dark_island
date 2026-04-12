/**
 * YandexAds — ad management wrapper.
 * Handles interstitial and rewarded ads with fallback.
 */
export class YandexAds {
  /**
   * @param {Object} sdk - YandexSDK instance
   */
  constructor(sdk) {
    this._sdk = sdk;
  }

  /** Show interstitial ad */
  async showInterstitial() {
    if (this._sdk?.isAvailable) {
      return this._sdk.showFullscreenAdv();
    }
    return false;
  }

  /**
   * Show rewarded ad.
   * @param {Function} onReward - Called when reward is granted
   */
  async showRewarded(onReward) {
    if (this._sdk?.isAvailable && this._sdk._sdk) {
      try {
        await this._sdk._sdk.adv.showRewardedVideo({
          onRewarded: () => onReward?.(),
        });
        return true;
      } catch (e) { /* fallback */ }
    }
    // Mock: grant reward immediately
    onReward?.();
    return false;
  }
}
