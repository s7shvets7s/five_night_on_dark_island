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

  let currentNightId = 1;

  function createNightScene(nightId) {
    return new NightScene({
      onSceneChange: (name) => game.sceneManager.change(name),
      onPause: () => game.sceneManager.push(SCENES.PAUSE),
      inputManager: game.inputManager,
      audioManager,
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
