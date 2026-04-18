/**
 * YandexLeaderboard — leaderboard wrapper.
 */
export class YandexLeaderboard {
  /**
   * @param {Object} sdk - YandexSDK instance (the sdk property, not wrapper)
   */
  constructor(sdk) {
    this._sdk = sdk;
  }

  /**
   * Submit a score.
   * @param {string} leaderboardName - Leaderboard identifier
   * @param {number} score - Score value
   */
  async submit(leaderboardName, score) {
    if (this._sdk?.leaderboards) {
      try {
        await this._sdk.leaderboards.setScore(leaderboardName, score);
        return true;
      } catch (e) { /* fallback */ }
    }
    return false;
  }

  /**
   * Get top entries.
   * @param {string} leaderboardName
   * @param {number} count - Number of entries
   * @returns {Array} Top entries
   */
  async getTop(leaderboardName, count = 10) {
    if (this._sdk?.leaderboards) {
      try {
        const result = await this._sdk.leaderboards.getEntries(leaderboardName, { quantityTop: count });
        return result?.entries || [];
      } catch (e) { /* fallback */ }
    }
    return [];
  }
}
