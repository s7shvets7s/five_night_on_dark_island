/**
 * Global game configuration.
 * All tunable values live here — never hardcode magic numbers.
 * Dynamic scaling is handled at runtime based on viewport.
 */

/** Debug and development flags */
export const CONFIG = {
  DEBUG: false,
  USE_PLACEHOLDER_ASSETS: true,
  AUTO_WIN_FOR_TEST: false,
  DISABLE_ADS: true,
  GOD_MODE: false,
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
  NIGHT: 'NightScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
  PAUSE: 'PauseScene',
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
