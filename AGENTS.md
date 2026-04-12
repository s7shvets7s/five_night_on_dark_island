# AGENTS.md — Island Night Watch

## Project Overview

FNAF-like HTML5 survival horror game for Yandex Games. Pure vanilla JS with no frameworks, no bundlers, no TypeScript.

## Tech Stack

- **HTML5** / **CSS3** / **Vanilla JavaScript (ES Modules)**
- **Canvas 2D API** for rendering
- **Web Audio API** for sound
- **Yandex Games SDK v2** for platform integration
- **No** React/Vue/Svelte/TypeScript/Vite/Webpack/Phaser/localStorage

## Commands

```bash
# Local development — serve from project root
npx serve .
# or
python -m http.server 8000

# No build step, no linter, no test runner configured.
# Open index.html directly in a browser for quick testing.
```

## Project Structure

```
/index.html
/style.css
/src/main.js
/src/config/gameConfig.js
/src/engine/          # Game, GameLoop, SceneManager, InputManager, AssetLoader, AudioManager, Renderer
/src/scenes/          # BootScene, TitleScene, NightScene, GameOverScene, VictoryScene, PauseScene
/src/systems/         # CameraSystem, PowerSystem, ClockSystem, OfficeSystem, JumpscareSystem, HUDSystem
/src/ai/              # EnemyAI
/src/entities/        # Enemy
/src/data/            # rooms.js, nights.js, enemies.js
/src/yandex/          # YandexSDK, YandexAds, YandexPlayer, YandexLeaderboard
/assets/              # images, audio (with placeholder fallbacks)
```

## Code Style

### Modules
- Use ES module syntax: `export class`, `export function`, `import ... from '...'`
- All paths relative; no bare specifiers
- One class per file; file name matches class name (PascalCase)

### Naming Conventions
- **Classes**: PascalCase (`NightScene`, `EnemyAI`, `PowerSystem`)
- **Functions/variables**: camelCase (`handleInput`, `currentPower`)
- **Constants/Config**: UPPER_SNAKE_CASE (`MAX_POWER`, `DEBUG_MODE`)
- **Files**: camelCase matching class name (`gameConfig.js`, `cameraSystem.js`)

### Imports
- Group imports: engine → systems → scenes → data → yandex
- Use relative paths: `import { EventBus } from '../engine/EventBus.js'`
- Always include `.js` extension in import paths

### Formatting
- 2-space indentation
- Semicolons required
- Trailing commas in multi-line objects/arrays
- Max line length ~120 chars

### Types & JSDoc
- No TypeScript; use JSDoc for key classes and public methods
```js
/**
 * Manages power drain and emergency mode.
 * @param {number} maxPower - Maximum power units
 */
class PowerSystem {
  /**
   * @returns {number} Current power as percentage (0-100)
   */
  getPowerPercent() { ... }
}
```

### Error Handling
- Never crash on missing assets — use placeholder rendering
- Audio: silently skip if file not found; never break game flow
- Yandex SDK: all calls wrapped in adapters with graceful fallback to mock/in-memory
- No `localStorage`/`sessionStorage` — use SDK `getData/setData` or in-memory fallback

### Config & Magic Numbers
- All tunable values in `gameConfig.js` or data files (`nights.js`, `enemies.js`)
- Never hardcode timings, drain rates, or AI aggression inline

### Debug Flags (in `gameConfig.js`)
```js
export const CONFIG = {
  DEBUG: false,
  USE_PLACEHOLDER_ASSETS: true,
  AUTO_WIN_FOR_TEST: false,
  DISABLE_ADS: true,
  GOD_MODE: false,
};
```

### Architecture Rules
- **No global variables** except the single app bootstrap in `main.js`
- **EventBus** for cross-system communication — don't couple systems directly
- **Separation of concerns**: render / update / input are logically separate
- **No SDK calls** scattered through game code — all through `src/yandex/` wrappers
- **Delta time** in game loop; never assume fixed frame rate

### Performance
- 60 FPS target with `requestAnimationFrame`
- Cache offscreen renders where useful
- Minimize allocations inside `update()` / `render()` loops
- Preload assets before scene activation

### Mobile / Touch
- Minimum 44x44px interactive targets
- No hover-only logic — all interactions work via click/touch
- Landscape-first, adaptive layout

### Git / Commits
- Commit after each completed development stage
- Message format: `Stage N: brief description`
