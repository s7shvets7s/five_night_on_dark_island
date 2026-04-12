/**
 * YandexPlayer — cloud save/load wrapper.
 */
export class YandexPlayer {
  /**
   * @param {Object} sdk - YandexSDK instance
   */
  constructor(sdk) {
    this._sdk = sdk;
    this._cache = {};
  }

  /** Load saved data */
  async load() {
    try {
      const data = await this._sdk.getData();
      this._cache = data || {};
    } catch (e) {
      this._cache = {};
    }
    return this._cache;
  }

  /** Save data */
  async save(data) {
    this._cache = { ...this._cache, ...data };
    await this._sdk.setData(this._cache);
  }

  /** Get a value from cache */
  get(key, defaultValue) {
    return this._cache[key] ?? defaultValue;
  }

  /** Set a value in cache (call save() to persist) */
  set(key, value) {
    this._cache[key] = value;
  }
}
