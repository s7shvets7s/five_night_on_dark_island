/**
 * Global game configuration.
 * All tunable values live here — never hardcode magic numbers.
 * Dynamic scaling is handled at runtime based on viewport.
 */

/** Debug and development flags */
export const CONFIG = {
  DEBUG: false,
  DEBUG_ENEMY_AT_DOOR: false,
  USE_PLACEHOLDER_ASSETS: false,
  AUTO_WIN_FOR_TEST: false,
  DISABLE_ADS: false,
  GOD_MODE: false,
  MASK_DURATION: 10,
  MASK_COOLDOWN: 30,
  CAMERA_GLITCH_POWER_PENALTY: 4,
  GENERATOR_INTERVAL: 50,
  GENERATOR_TIMEOUT: 10,
  GENERATOR_TIME_LIMIT: 3,
  GENERATOR_SUCCESS_BONUS: 3,
  GENERATOR_FAIL_PENALTY: 12,
  GENERATOR_BLINK_RATE: 0.5,
  GENERATOR_ROTATIONS_NEEDED: 2,
  CAMERA_ENEMY_BRIGHTNESS: 0.4,
  CAMERA_ENEMY_SATURATION: 0,
};

/** Power drain multipliers per night — scaling difficulty */
export const POWER_DRAIN_MULTIPLIERS = {
  1: 0.85,
  2: 0.95,
  3: 1.0,
  4: 1.10,
  5: 1.20,
  6: 1.35,
  7: 1.50,
};

/** Chance of showing ad instead of jumpscare (rare event) */
export const RANDOM_AD_CHANCE = 0.03;

export const CAMERA_GLITCH = {
  CHECK_INTERVAL_MIN: 3,
  CHECK_INTERVAL_MAX: 8,
  BREAK_CHANCE: {
    1: 0.15,
    2: 0.15,
    3: 0.20,
    4: 0.25,
    5: 0.30,
    6: 0.35,
    7: 0.40,
  },
  NUMBERS_COUNT: {
    1: 3,
    2: 3,
    3: 4,
    4: 4,
    5: 5,
    6: 5,
    7: 5,
  },
};

/** Game identity */
export const GAME_TITLE = 'Island Night Watch';
export const GAME_VERSION = '0.1.0';

/** Base resolution — used as reference for proportional UI scaling */
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

/** Target framerate for fixed-step game loop */
export const TARGET_FPS = 60;

/** Scene identifiers */
export const SCENES = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  NIGHT_SELECT: 'NightSelectScene',
  SETTINGS: 'SettingsScene',
  BESTIARY: 'BestiaryScene',
  NIGHT: 'NightScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
  PAUSE: 'PauseScene',
  CONFIRM_EXIT: 'ConfirmExitScene',
};

/** Starting scene on launch */
export const START_SCENE = SCENES.BOOT;

/** Color palette — horror / surveillance theme */
export const COLORS = {
  BACKGROUND: '#0a0a0a',
  BACKGROUND_DARK: '#050505',
  ACCENT_RED: '#8b0000',
  ACCENT_RED_BRIGHT: '#cc2222',
  TEXT_PRIMARY: '#e0e0e0',
  TEXT_SECONDARY: '#888888',
  TEXT_DIM: '#444444',
  UI_BORDER: '#2a2a2a',
  UI_BG: '#111111',
  WARNING: '#ff4400',
  POWER_LOW: '#ff6600',
  POWER_OK: '#44aa44',
  SCANLINE: 'rgba(0, 0, 0, 0.04)',
};

/** UI layout constants — relative to base resolution */
export const UI = {
  PADDING: 20,
  FONT_TITLE: 48,
  FONT_SUBTITLE: 18,
  FONT_BODY: 14,
  FONT_SMALL: 11,
  BAR_HEIGHT: 6,
  INTERACTIVE_MIN: 44, // minimum touch target px
};

/** Scaling config — canvas adapts to viewport dynamically */
export const SCALING = {
  /** How the game fills the screen: 'stretch' fills entirely, 'contain' fits with letterbox, 'cover' crops to fill */
  FIT_MODE: 'stretch',
  /** Pixel ratio cap to prevent over-rendering on high-DPR devices */
  MAX_DPR: 2,
  /** Minimum logical width before scaling becomes problematic */
  MIN_WIDTH: 640,
  /** Minimum logical height */
  MIN_HEIGHT: 360,
};

/** Game state — persists for session, reset on page reload */
export const gameState = {
  _unlockedNight: 1,
  _completedNights: new Set(),
  _volume: 0.7,
  _sfxVolume: 0.8,
  _musicVolume: 0.2,
  _locale: 'ru',

  getUnlockedNight() {
    return this._unlockedNight;
  },

  setUnlockedNight(nightId) {
    if (nightId > this._unlockedNight) {
      this._unlockedNight = nightId;
    }
  },

  isNightUnlocked(nightId) {
    return nightId <= this._unlockedNight;
  },

  isNightCompleted(nightId) {
    return this._completedNights.has(nightId);
  },

  markNightCompleted(nightId) {
    this._completedNights.add(nightId);
    this.setUnlockedNight(nightId + 1);
  },

  getVolume() {
    return this._volume;
  },

  setVolume(vol) {
    this._volume = Math.max(0, Math.min(1, vol));
  },

  getMusicVolume() {
    return this._musicVolume;
  },

  setMusicVolume(vol) {
    this._musicVolume = Math.max(0, Math.min(1, vol));
  },

  getSFXVolume() {
    return this._sfxVolume;
  },

  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  },

  getLocale() {
    return this._locale;
  },

  setLocale(locale) {
    if (locale === 'ru' || locale === 'en') {
      this._locale = locale;
    }
  },
};
