# Design: Parallel Development — Island Night Watch

## Date: 2026-04-03

## Overview
Complete all missing game systems, scenes, data, audio, and Yandex SDK integration using 5 parallel subagent streams.

## Agent Breakdown

### Agent 1: Data + AudioManager + Yandex SDK
- `src/data/rooms.js` — room definitions, camera positions, connections
- `src/data/nights.js` — night schedules, timing, difficulty scaling
- `src/data/enemies.js` — enemy parameters, paths, aggression levels
- `src/engine/AudioManager.js` — audio playback, volume control, background loops
- `src/yandex/YandexSDK.js` — SDK initialization, mock fallback
- `src/yandex/YandexAds.js` — interstitial/rewarded ads
- `src/yandex/YandexPlayer.js` — cloud save/load
- `src/yandex/YandexLeaderboard.js` — score submission, leaderboards

### Agent 2: All 6 Game Systems
- `src/systems/PowerSystem.js` — power drain, emergency mode
- `src/systems/CameraSystem.js` — camera switching, camera rendering
- `src/systems/ClockSystem.js` — game time, night phases
- `src/systems/OfficeSystem.js` — doors, lights, ventilation
- `src/systems/JumpscareSystem.js` — triggers, animation, game over
- `src/systems/HUDSystem.js` — UI overlay, indicators, notifications

### Agent 3: Enemy + EnemyAI
- `src/entities/Enemy.js` — enemy entity, state, position
- `src/ai/EnemyAI.js` — behavior logic, pathfinding, aggression

### Agent 4: NightScene (main gameplay)
- `src/scenes/NightScene.js` — office, cameras, interaction, system updates
- Integration with InputManager, EventBus, all systems

### Agent 5: GameOverScene + VictoryScene + PauseScene
- `src/scenes/GameOverScene.js` — game over screen, restart
- `src/scenes/VictoryScene.js` — victory screen, next night
- `src/scenes/PauseScene.js` — pause menu, settings

## EventBus Interface (fixed contract)
- `power:change` — `{ current, max, percent }`
- `camera:switch` — `{ cameraId }`
- `door:toggle` — `{ side, isOpen }`
- `light:toggle` — `{ side, isOn }`
- `enemy:move` — `{ enemyId, from, to }`
- `jumpscare:trigger` — `{ enemyId }`
- `clock:tick` — `{ hour, progress }`
- `game:over` — `{ reason }`
- `game:victory` — `{ night }`

## Architecture Rules
- All systems use EventBus for cross-communication
- No direct system-to-system coupling
- All tunable values in gameConfig.js or data files
- No localStorage — use Yandex SDK or in-memory
- Graceful fallback for missing assets
- 2-space indentation, semicolons, trailing commas
- JSDoc on public methods

## Integration Plan
After all 5 agents complete: verify no conflicts, run game, fix integration issues.
