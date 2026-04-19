import { Game } from './engine/Game.js';
import { SCENES, GAME_VERSION } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { NightSelectScene } from './scenes/NightSelectScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { BestiaryScene } from './scenes/BestiaryScene.js';
import { NightScene } from './scenes/NightScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ConfirmExitScene } from './scenes/ConfirmExitScene.js';
import { AudioManager } from './engine/AudioManager.js?v=14';
import { SFXManager } from './engine/SFXManager.js';
import { SFX } from './config/sfxConfig.js';
import { eventBus } from './engine/EventBus.js';
import { i18n } from './i18n/index.js';
import { gameState } from './config/gameConfig.js';
import { yandexSDK } from './yandex/YandexSDK.js';
import { YandexAds } from './yandex/YandexAds.js';
import { YandexPlayer } from './yandex/YandexPlayer.js';
import { SaveSystem } from './system/SaveSystem.js';

/**
 * Wait for Yandex SDK to load before initializing.
 * SDK loads asynchronously via iframe, so we need to poll for it.
 * @returns {Promise<boolean>} True if SDK loaded, false on timeout
 */
async function waitForYaGames(timeout = 15000) {
  const start = Date.now();
  console.log('[Bootstrap] Waiting for YaGames SDK...');
  
  while (!window.YaGames) {
    if (Date.now() - start > timeout) {
      console.warn('[Bootstrap] YaGames SDK timeout - using mock');
      return false;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('[Bootstrap] YaGames SDK detected');
  return true;
}

/**
 * Application bootstrap.
 * Creates the Game instance, registers scenes, and starts the loop.
 */
async function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('[Bootstrap] Canvas element not found');
    return;
  }

  // Force landscape orientation on mobile devices
  await lockOrientation();

  // Wait for Yandex SDK to load (it loads asynchronously via iframe)
  await waitForYaGames();

  // Initialize Yandex SDK first
  await yandexSDK.init();

  const game = new Game(canvas);
  const audioManager = new AudioManager();
  const sfxManager = new SFXManager(audioManager);
  sfxManager.loadAll(SFX);
  sfxManager.enableRandom(true);

  // Initialize Yandex player and save system
  const player = new YandexPlayer(yandexSDK);
  const saveSystem = new SaveSystem(player, audioManager, sfxManager);
  await saveSystem.load();

  // Auto-detect language from SDK if available
  if (yandexSDK.isAvailable) {
    const platformInfo = yandexSDK.getPlatformInfo();
    const sdkLang = platformInfo.language;
    if (sdkLang === 'ru' || sdkLang === 'en') {
      gameState.setLocale(sdkLang);
      console.log(`[Bootstrap] Language detected: ${sdkLang}`);
    }
  }

  i18n.setLocale(gameState.getLocale());

  // Apply loaded volume settings
  audioManager.setMusicVolume(gameState.getMusicVolume());
  audioManager.setMasterSFXVolume(gameState.getSFXVolume());

  // Setup SDK pause/resume handling
  setupSdkPauseHandling(game, audioManager, sfxManager);

  // Initialize Yandex ads
  const ads = new YandexAds(yandexSDK, audioManager, sfxManager, yandexSDK, game.inputManager);

  const imageManifest = {
    menusbackground: 'scenes/menusbackground.png',
    cameras_helipad: 'cameras/helipad.png',
    cameras_golden_temple: 'cameras/golden_temple.png',
    cameras_staff_quarters: 'cameras/staff_quarters.png',
    cameras_guest_house: 'cameras/guest_house.png',
    cameras_greenhouse: 'cameras/greenhouse.png',
    cameras_beach_house: 'cameras/beach_house.png',
    cameras_dock: 'cameras/dock.png',
    cameras_generator: 'cameras/generator.png',
    cameras_pool: 'cameras/pool.png',
    cameras_tunnel: 'cameras/tunnel.png',
    cameras_bunker: 'cameras/bunker.png',
    cameras_central_street: 'cameras/central_street.png',
    office_bg: 'office/office_bg.png',
    office_bg_left_dor_close: 'office/office_bg_left_dor_close.png',
    office_bg_right_dor_slose: 'office/office_bg_right_dor_slose.png',
    office_bg_all_dors_close: 'office/office_bg_all_dors_close.png',
    enemies_millioner: 'enemies/millioner.png',
    enemies_president: 'enemies/president.png',
    enemies_since: 'enemies/since.png',
    enemies_fake_millioner: 'enemies/fake_millioner.png',
    enemies_micro: 'enemies/micro.png',
    enemies_dancer: 'enemies/dancer.png',
    enemies_millioner_attack: 'enemies/millioner_attack.png',
    enemies_president_attack: 'enemies/president_attack.png',
    enemies_since_attack: 'enemies/since_attack.png',
    enemies_fake_millioner_attack: 'enemies/fake_millioner_attack.png',
    enemies_micro_attack: 'enemies/micro_attack.png',
    enemies_dancer_attack: 'enemies/dancer_attack.png',
  };
  game.assetLoader.queueImages(imageManifest);

  let currentNightId = gameState.getUnlockedNight();

  function createNightScene(nightId) {
    return new NightScene({
      onSceneChange: (name) => game.sceneManager.change(name),
      onPause: () => game.sceneManager.push(SCENES.PAUSE),
      inputManager: game.inputManager,
      audioManager,
      sfxManager,
      assetLoader: game.assetLoader,
      ads,
      nightId,
    });
  }

  const sceneDeps = {
    onSceneChange: (name) => game.sceneManager.change(name),
    onPause: () => {
      yandexSDK.gameplayStop();
      game.sceneManager.push(SCENES.PAUSE);
    },
    onResume: () => {
      yandexSDK.gameplayStart();
      game.sceneManager.pop();
    },
    inputManager: game.inputManager,
    audioManager,
    sfxManager,
    assetLoader: game.assetLoader,
    ads,
    yandexSDK,
    nightId: currentNightId,
  };

  game.registerScene(SCENES.BOOT, new BootScene(sceneDeps));
  game.registerScene(SCENES.TITLE, new TitleScene(sceneDeps));
  game.registerScene(SCENES.NIGHT_SELECT, new NightSelectScene(sceneDeps));
  game.registerScene(SCENES.SETTINGS, new SettingsScene(sceneDeps));
  game.registerScene(SCENES.BESTIARY, new BestiaryScene(sceneDeps));
  game.registerScene(SCENES.GAME_OVER, new GameOverScene(sceneDeps));
  game.registerScene(SCENES.PAUSE, new PauseScene(sceneDeps));
  game.registerScene(SCENES.CONFIRM_EXIT, new ConfirmExitScene(sceneDeps));

  game.registerScene(SCENES.NIGHT, createNightScene(currentNightId));
  game.registerScene(SCENES.VICTORY, new VictoryScene(sceneDeps));

  eventBus.on('game:night-change', ({ nightId }) => {
    currentNightId = nightId;
    game.registerScene(SCENES.NIGHT, createNightScene(currentNightId));
  });

  const originalPop = game.sceneManager.pop.bind(game.sceneManager);
  game.sceneManager.pop = () => {
    const top = game.sceneManager._stack[game.sceneManager._stack.length - 1];
    if (top?.scene?.resume) {
      top.scene.resume();
    }
    originalPop();
  };

  try {
    await game.assetLoader.loadAll();
    console.log('[Bootstrap] Assets loaded');
  } catch (e) {
    console.log('[Bootstrap] Assets load error (using placeholders)');
  }

const musicTracks = [
    'assets/audio/music/toybox.ogg',
    'assets/audio/music/smallheart.ogg',
    'assets/audio/music/monster.ogg',
    'assets/audio/music/eyes-piercing-shadow.ogg',
    'assets/audio/music/as-the-light-fades.ogg',
  ];
  audioManager.setPlaylist(musicTracks);

  // Start music on first user interaction
  let firstInteraction = true;
  const startMusic = () => {
    if (firstInteraction) {
      firstInteraction = false;
      audioManager.init();
      audioManager.playMusic();
      if (window._gameStarted) {
        window._gameStarted.started = true;
      }
    }
  };
  document.addEventListener('click', startMusic, { once: true });
  document.addEventListener('touchstart', startMusic, { once: true });

  game.start();
  console.log(`[Bootstrap] ${i18n.t('gameTitle')} v${GAME_VERSION} started`);

  // Subscribe to TV back button (HISTORY_BACK) - shows exit confirmation
  if (yandexSDK.isAvailable && yandexSDK.sdk?.EVENTS) {
    yandexSDK.on(yandexSDK.sdk.EVENTS.HISTORY_BACK, () => {
      game.sceneManager.push(SCENES.CONFIRM_EXIT);
    });
  }

  // Signal to Yandex that the game is ready to play
  yandexSDK.ready();

  // Start save system auto-save cycle
  setupSaveSystem(game, saveSystem);

  // Hook into gameState changes for auto-save
  setupGameStateSaveHooks(saveSystem);
}

/**
 * Setup SDK pause/resume event handlers.
 * Follows Yandex SDK requirements for gameplay markup exactly.
 * Handles startup ad - game starts ONLY after resume.
 * Ref: https://yandex.ru/dev/games/doc/ru/sdk/sdk-events#startup-ad-example
 */
function setupSdkPauseHandling(game, audioManager, sfxManager) {
  let gameStarted = false;
  let isPaused = false;
  const isPausedRef = { value: false };

  const pauseGame = () => {
    isPausedRef.value = true;
    audioManager?.pauseAll();
    sfxManager?.mute();
    yandexSDK.gameplayStop();
  };

  const resumeGame = () => {
    isPausedRef.value = false;
    if (!gameStarted) {
      gameStarted = true;
      if (window._gameStarted) {
        window._gameStarted.started = true;
      }
      yandexSDK.gameplayStart();
    }
    audioManager?.resumeAll();
    sfxManager?.unmute();
  };

  const handlePause = () => {
    console.log('[Yandex] game_api_pause received');
    isPaused = true;
    pauseGame();
  };

  const handleResume = () => {
    console.log('[Yandex] game_api_resume received');
    isPaused = false;
    if (!gameStarted) {
      gameStarted = true;
      if (window._gameStarted) {
        window._gameStarted.started = true;
      }
      console.log('[Yandex] Game starting after startup ad');
    }
    resumeGame();
  };

  const doPause = () => {
    if (isPaused) return;
    isPaused = true;
    pauseGame();
  };

  const doResume = () => {
    if (!isPaused) return;
    isPaused = false;
    if (gameStarted) {
      resumeGame();
    }
  };

  // Subscribe to Yandex SDK pause/resume events (for startup ad, tab switching, etc.)
  if (yandexSDK.isAvailable && yandexSDK.sdk) {
    yandexSDK.on('game_api_pause', handlePause);
    yandexSDK.on('game_api_resume', handleResume);
    console.log('[Yandex] Subscribed to game_api_pause/game_api_resume');
  }

  // If no startup ad (isPaused = false), game can start immediately
  // If there was startup ad, game will start when game_api_resume fires
  if (!isPaused) {
    gameStarted = true;
    if (window._gameStarted) {
      window._gameStarted.started = true;
    }
    console.log('[Yandex] Game ready to start (no startup ad)');
  }

  // 1. Visibility API — сработает при сворачивании/переключении вкладок
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' || document.hidden) {
      doPause();
    } else {
      doResume();
    }
  });

  // NOTE: Убран window blur/focus - Yandex SDK сам обрабатывает game_api_pause/game_api_resume
}

/**
 * Integrate save system into game loop for auto-save.
 * Uses setInterval instead of hooking gameLoop.update
 * to avoid issues with private fields and restarts.
 */
function setupSaveSystem(game, saveSystem) {
  const SAVE_INTERVAL_MS = 2000;

  setInterval(() => {
    saveSystem.update(SAVE_INTERVAL_MS / 1000);
  }, SAVE_INTERVAL_MS);
}

/**
 * Subscribe to game events that should trigger saves.
 */
function setupGameStateSaveHooks(saveSystem) {
  // Save when night is completed
  eventBus.on('game:victory', () => {
    saveSystem.markDirty();
    console.log('[Bootstrap] Save marked dirty (victory)');
  });

  // Save when settings change
  eventBus.on('settings:change', () => {
    saveSystem.markDirty();
    console.log('[Bootstrap] Save marked dirty (settings)');
  });
}

/**
 * Lock screen orientation to landscape on mobile devices.
 * Uses Screen Orientation API (browser-level, not Yandex SDK).
 * Note: Yandex Games SDK doesn't have orientation lock —
 * orientation is set in the developer console draft.
 */
async function lockOrientation() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
      console.log('[Bootstrap] Orientation locked to landscape (Screen Orientation API)');
      return;
    }
  } catch (e) {
    console.log('[Bootstrap] Orientation lock not supported:', e.message);
  }
  console.log('[Bootstrap] Orientation lock skipped — set in Yandex Games draft instead');
}

bootstrap();
