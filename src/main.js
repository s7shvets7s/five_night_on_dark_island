import { Game } from './engine/Game.js';
import { SCENES, GAME_TITLE, GAME_VERSION } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { NightScene } from './scenes/NightScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { AudioManager } from './engine/AudioManager.js';
import { eventBus } from './engine/EventBus.js';

/**
 * Application bootstrap.
 * Creates the Game instance, registers scenes, and starts the loop.
 */
function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('[Bootstrap] Canvas element not found');
    return;
  }

  const game = new Game(canvas);
  const audioManager = new AudioManager();

  const imageManifest = {
    cameras_helipad: 'cameras/helipad.png',
    cameras_golden_temple: 'cameras/golden_temple.png',
    cameras_staff_quarters: 'cameras/staff_quarters.png',
    cameras_guest_house: 'cameras/guest_house.png',
    cameras_greenhouse: 'cameras/greenhouse.png',
    cameras_beach_house: 'cameras/beach_house.png',
    cameras_dock: 'cameras/dock.png',
    cameras_central_street: 'cameras/central_street.png',
    office_bg: 'office/office_bg.png',
    office_bg_left_dor_close: 'office/office_bg_left_dor_close.png',
    office_bg_right_dor_slose: 'office/office_bg_right_dor_slose.png',
    office_bg_all_dors_close: 'office/office_bg_all_dors_close.png',
    enemies_millioner: 'enemies/millioner.png',
    enemies_president: 'enemies/president.png',
    enemies_since: 'enemies/since.png',
    enemies_bonnie_door: 'enemies/bonnie_door.png',
    enemies_chica_door: 'enemies/chica_door.png',
    enemies_foxy_door: 'enemies/foxy_door.png',
    enemies_freddy_door: 'enemies/freddy_door.png',
    enemies_bonnie_attack: 'enemies/bonnie_attack.png',
    enemies_chica_attack: 'enemies/chica_attack.png',
    enemies_foxy_attack: 'enemies/foxy_attack.png',
    enemies_freddy_attack: 'enemies/freddy_attack.png',
  };
  game.assetLoader.queueImages(imageManifest);
  game.assetLoader.loadAll().then(() => {
    console.log('[Bootstrap] Assets loaded');
  }).catch(() => {
    console.log('[Bootstrap] Assets load error (using placeholders)');
  });

  let currentNightId = 1;

  function createNightScene(nightId) {
    return new NightScene({
      onSceneChange: (name) => game.sceneManager.change(name),
      onPause: () => game.sceneManager.push(SCENES.PAUSE),
      inputManager: game.inputManager,
      audioManager,
      assetLoader: game.assetLoader,
      nightId,
    });
  }

  const sceneDeps = {
    onSceneChange: (name) => game.sceneManager.change(name),
    onPause: () => game.sceneManager.push(SCENES.PAUSE),
    onResume: () => game.sceneManager.pop(),
    inputManager: game.inputManager,
  };

  game.registerScene(SCENES.BOOT, new BootScene(sceneDeps));
  game.registerScene(SCENES.TITLE, new TitleScene(sceneDeps));
  game.registerScene(SCENES.GAME_OVER, new GameOverScene(sceneDeps));
  game.registerScene(SCENES.PAUSE, new PauseScene(sceneDeps));

  game.registerScene(SCENES.NIGHT, createNightScene(currentNightId));
  game.registerScene(SCENES.VICTORY, new VictoryScene(sceneDeps));

  eventBus.on('game:night-change', ({ nightId }) => {
    currentNightId = nightId;
    game.registerScene(SCENES.NIGHT, createNightScene(currentNightId));
  });

  // Hook into scene pop to resume the NightScene
  const originalPop = game.sceneManager.pop.bind(game.sceneManager);
  game.sceneManager.pop = () => {
    const top = game.sceneManager._stack[game.sceneManager._stack.length - 1];
    if (top?.scene?.resume) {
      top.scene.resume();
    }
    originalPop();
  };

  game.start();

  console.log(`[Bootstrap] ${GAME_TITLE} v${GAME_VERSION} started`);
}

bootstrap();
