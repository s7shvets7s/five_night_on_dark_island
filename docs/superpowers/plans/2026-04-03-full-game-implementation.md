# Island Night Watch — Full Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all missing game systems, scenes, data, audio, and Yandex SDK integration to create a playable FNAF-like horror game.

**Architecture:** 5 parallel subagent streams working on independent modules, coordinated through fixed EventBus interfaces. Each stream produces working, testable code. Final integration step wires everything together.

**Tech Stack:** Vanilla JavaScript (ES Modules), Canvas 2D API, Web Audio API, Yandex Games SDK v2

---

## File Structure

### Stream 1: Data + AudioManager + Yandex SDK
| File | Responsibility |
|------|---------------|
| `src/data/rooms.js` | Room definitions, camera positions, connections map |
| `src/data/nights.js` | Night schedules, enemy spawn rules, difficulty scaling |
| `src/data/enemies.js` | Enemy parameters, movement paths, aggression levels |
| `src/engine/AudioManager.js` | Audio playback engine, volume control, background loops |
| `src/yandex/YandexSDK.js` | SDK init, mock fallback, platform detection |
| `src/yandex/YandexAds.js` | Interstitial/rewarded ad wrapper |
| `src/yandex/YandexPlayer.js` | Cloud save/load wrapper |
| `src/yandex/YandexLeaderboard.js` | Score submission, leaderboard queries |

### Stream 2: Game Systems
| File | Responsibility |
|------|---------------|
| `src/systems/PowerSystem.js` | Power drain calculation, emergency mode |
| `src/systems/CameraSystem.js` | Camera switching, camera state, rendering |
| `src/systems/ClockSystem.js` | Game time progression, hour tracking |
| `src/systems/OfficeSystem.js` | Door/light state management, power costs |
| `src/systems/JumpscareSystem.js` | Jumpscare triggers, animation, game over callback |
| `src/systems/HUDSystem.js` | HUD rendering: power bar, clock, camera buttons |

### Stream 3: Enemy + EnemyAI
| File | Responsibility |
|------|---------------|
| `src/entities/Enemy.js` | Enemy entity: position, state, movement |
| `src/ai/EnemyAI.js` | AI brain: pathfinding, aggression, decision making |

### Stream 4: NightScene
| File | Responsibility |
|------|---------------|
| `src/scenes/NightScene.js` | Main gameplay: office view, camera system, all system integration |

### Stream 5: Game Over + Victory + Pause
| File | Responsibility |
|------|---------------|
| `src/scenes/GameOverScene.js` | Game over screen with jumpscare aftermath |
| `src/scenes/VictoryScene.js` | Night complete screen, next night progression |
| `src/scenes/PauseScene.js` | Pause menu with resume/quit/settings |

## EventBus Contract (Fixed — All Streams)

```js
// PowerSystem emits:
eventBus.emit('power:change', { current, max, percent });

// CameraSystem emits:
eventBus.emit('camera:switch', { cameraId });

// OfficeSystem emits:
eventBus.emit('door:toggle', { side: 'left'|'right', isOpen: boolean });
eventBus.emit('light:toggle', { side: 'left'|'right', isOn: boolean });

// EnemyAI emits:
eventBus.emit('enemy:move', { enemyId, from: roomId, to: roomId });

// JumpscareSystem emits:
eventBus.emit('jumpscare:trigger', { enemyId });

// ClockSystem emits:
eventBus.emit('clock:tick', { hour: 0-6, progress: 0-1 });

// NightScene emits:
eventBus.emit('game:over', { reason: 'power'|'jumpscare' });
eventBus.emit('game:victory', { night: number });
```

---

## STREAM 1: Data + AudioManager + Yandex SDK

### Task 1.1: Room Definitions

**Files:**
- Create: `src/data/rooms.js`

- [ ] **Step 1: Create rooms.js with room definitions**

```js
/**
 * Room definitions for the island facility.
 * Each room has an ID, display name, and connections to other rooms.
 */

/**
 * @typedef {Object} Room
 * @property {string} id - Unique room identifier
 * @property {string} name - Display name
 * @property {string[]} connections - Adjacent room IDs
 * @property {number} x - Render position X (0-1 relative)
 * @property {number} y - Render position Y (0-1 relative)
 * @property {boolean} isOffice - Whether this is the office room
 * @property {boolean} isBlindSpot - Whether camera has limited visibility
 */

/** @type {Room[]} */
export const ROOMS = [
  { id: 'office', name: 'Office', connections: ['left_hall', 'right_hall', 'left_door', 'right_door'], x: 0.5, y: 0.5, isOffice: true, isBlindSpot: false },
  { id: 'left_hall', name: 'Left Hallway', connections: ['office', 'left_corner', 'supply_room'], x: 0.2, y: 0.5, isOffice: false, isBlindSpot: false },
  { id: 'right_hall', name: 'Right Hallway', connections: ['office', 'right_corner', 'kitchen'], x: 0.8, y: 0.5, isOffice: false, isBlindSpot: false },
  { id: 'left_door', name: 'Left Door', connections: ['office'], x: 0.15, y: 0.5, isOffice: false, isBlindSpot: true },
  { id: 'right_door', name: 'Right Door', connections: ['office'], x: 0.85, y: 0.5, isOffice: false, isBlindSpot: true },
  { id: 'left_corner', name: 'Left Corner', connections: ['left_hall'], x: 0.1, y: 0.3, isOffice: false, isBlindSpot: false },
  { id: 'right_corner', name: 'Right Corner', connections: ['right_hall'], x: 0.9, y: 0.3, isOffice: false, isBlindSpot: false },
  { id: 'supply_room', name: 'Supply Room', connections: ['left_hall', 'back_hall'], x: 0.15, y: 0.2, isOffice: false, isBlindSpot: false },
  { id: 'kitchen', name: 'Kitchen', connections: ['right_hall', 'back_hall'], x: 0.85, y: 0.2, isOffice: false, isBlindSpot: false },
  { id: 'back_hall', name: 'Back Hallway', connections: ['supply_room', 'kitchen', 'stage'], x: 0.5, y: 0.15, isOffice: false, isBlindSpot: false },
  { id: 'stage', name: 'Stage', connections: ['back_hall'], x: 0.5, y: 0.08, isOffice: false, isBlindSpot: false },
];

/** @type {Record<string, Room>} - Quick lookup by ID */
export const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r]));

/** Camera IDs — same as room IDs for simplicity */
export const CAMERA_IDS = ROOMS.filter(r => !r.isOffice).map(r => r.id);
```

### Task 1.2: Night Definitions

**Files:**
- Create: `src/data/nights.js`

- [ ] **Step 1: Create nights.js with night schedules**

```js
/**
 * Night definitions.
 * Each night defines duration, enemy spawns, and difficulty modifiers.
 */

/**
 * @typedef {Object} EnemySpawn
 * @property {string} enemyId - Which enemy to spawn
 * @property {number} aggression - AI level 0-20 (FNAF-style)
 * @property {number} startHour - Hour when enemy becomes active (0-6)
 * @property {string} startRoom - Initial room for this enemy
 */

/**
 * @typedef {Object} Night
 * @property {number} id - Night number
 * @property {string} name - Display name
 * @property {number} durationMs - Total night duration in ms (6 game hours)
 * @property {EnemySpawn[]} spawns - Enemy configurations for this night
 */

/** @type {Night[]} */
export const NIGHTS = [
  {
    id: 1,
    name: 'Night 1',
    durationMs: 180000, // 3 minutes for night 1 (easier)
    spawns: [
      { enemyId: 'bonnie', aggression: 3, startHour: 0, startRoom: 'stage' },
    ],
  },
  {
    id: 2,
    name: 'Night 2',
    durationMs: 210000, // 3.5 minutes
    spawns: [
      { enemyId: 'bonnie', aggression: 5, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 3, startHour: 1, startRoom: 'stage' },
    ],
  },
  {
    id: 3,
    name: 'Night 3',
    durationMs: 240000, // 4 minutes
    spawns: [
      { enemyId: 'bonnie', aggression: 7, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 5, startHour: 0, startRoom: 'stage' },
      { enemyId: 'freddy', aggression: 2, startHour: 2, startRoom: 'stage' },
    ],
  },
  {
    id: 4,
    name: 'Night 4',
    durationMs: 270000, // 4.5 minutes
    spawns: [
      { enemyId: 'bonnie', aggression: 10, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 8, startHour: 0, startRoom: 'stage' },
      { enemyId: 'freddy', aggression: 6, startHour: 1, startRoom: 'stage' },
    ],
  },
  {
    id: 5,
    name: 'Night 5',
    durationMs: 300000, // 5 minutes
    spawns: [
      { enemyId: 'bonnie', aggression: 13, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 12, startHour: 0, startRoom: 'stage' },
      { enemyId: 'freddy', aggression: 10, startHour: 0, startRoom: 'stage' },
    ],
  },
  {
    id: 6,
    name: 'Night 6',
    durationMs: 300000,
    spawns: [
      { enemyId: 'bonnie', aggression: 18, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 17, startHour: 0, startRoom: 'stage' },
      { enemyId: 'freddy', aggression: 15, startHour: 0, startRoom: 'stage' },
    ],
  },
  {
    id: 7,
    name: 'Night 7 (Custom)',
    durationMs: 300000,
    spawns: [
      { enemyId: 'bonnie', aggression: 20, startHour: 0, startRoom: 'stage' },
      { enemyId: 'chica', aggression: 20, startHour: 0, startRoom: 'stage' },
      { enemyId: 'freddy', aggression: 20, startHour: 0, startRoom: 'stage' },
    ],
  },
];

/** @type {Record<number, Night>} */
export const NIGHT_MAP = Object.fromEntries(NIGHTS.map(n => [n.id, n]));

/** Default night for first play */
export const DEFAULT_NIGHT_ID = 1;
```

### Task 1.3: Enemy Definitions

**Files:**
- Create: `src/data/enemies.js`

- [ ] **Step 1: Create enemies.js with enemy parameters**

```js
/**
 * Enemy definitions.
 * Each enemy has movement patterns, attack behavior, and visual properties.
 */

/**
 * @typedef {Object} EnemyDef
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} color - Primary color for placeholder rendering
 * @property {string[]} preferredPath - Preferred room path towards office
 * @property {number} moveIntervalMs - Base time between moves
 * @property {number} moveIntervalVariance - Random variance on move interval
 * @property {boolean} canAttackFromDoor - Whether enemy attacks from door position
 * @property {boolean} requiresLightCheck - Whether light reveals enemy at door
 * @property {string} attackRoom - Room from which enemy attacks (usually office)
 */

/** @type {EnemyDef[]} */
export const ENEMIES = [
  {
    id: 'bonnie',
    name: 'Bonnie',
    color: '#6644aa',
    preferredPath: ['stage', 'back_hall', 'supply_room', 'left_hall', 'left_corner', 'left_door'],
    moveIntervalMs: 8000,
    moveIntervalVariance: 4000,
    canAttackFromDoor: true,
    requiresLightCheck: true,
    attackRoom: 'office',
  },
  {
    id: 'chica',
    name: 'Chica',
    color: '#ccaa22',
    preferredPath: ['stage', 'back_hall', 'kitchen', 'right_hall', 'right_corner', 'right_door'],
    moveIntervalMs: 9000,
    moveIntervalVariance: 5000,
    canAttackFromDoor: true,
    requiresLightCheck: true,
    attackRoom: 'office',
  },
  {
    id: 'freddy',
    name: 'Freddy',
    color: '#885522',
    preferredPath: ['stage', 'back_hall', 'right_hall', 'right_corner', 'right_door'],
    moveIntervalMs: 12000,
    moveIntervalVariance: 6000,
    canAttackFromDoor: true,
    requiresLightCheck: false, // Freddy hides in shadows
    attackRoom: 'office',
  },
];

/** @type {Record<string, EnemyDef>} */
export const ENEMY_MAP = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
```

### Task 1.4: AudioManager

**Files:**
- Create: `src/engine/AudioManager.js`

- [ ] **Step 1: Create AudioManager**

```js
/**
 * AudioManager — handles audio playback, volume control, and background loops.
 * Uses Web Audio API with graceful fallback when assets are missing.
 */
export class AudioManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._sfxGain = null;
    this._ambienceGain = null;
    this._masterVolume = 0.7;
    this._sfxVolume = 0.8;
    this._ambienceVolume = 0.5;
    this._muted = false;
    this._activeLoops = new Map();
    this._initialized = false;
  }

  /** Initialize Web Audio context (call on first user interaction) */
  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = this._masterVolume;
      this._masterGain.connect(this._ctx.destination);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this._sfxVolume;
      this._sfxGain.connect(this._masterGain);

      this._ambienceGain = this._ctx.createGain();
      this._ambienceGain.gain.value = this._ambienceVolume;
      this._ambienceGain.connect(this._masterGain);

      this._initialized = true;
    } catch (e) {
      console.warn('[AudioManager] Web Audio not available:', e);
    }
  }

  /** Resume audio context (required after user gesture) */
  resume() {
    this._ctx?.resume();
  }

  /**
   * Play a sound effect.
   * @param {HTMLAudioElement|string} source - Audio element or asset key
   * @returns {boolean} Whether playback started
   */
  playSFX(source) {
    if (!this._initialized || this._muted) return false;
    try {
      if (source instanceof HTMLAudioElement) {
        source.volume = this._sfxVolume;
        source.currentTime = 0;
        source.play().catch(() => {});
        return true;
      }
    } catch (e) {
      // Silently fail — audio is non-critical
    }
    return false;
  }

  /**
   * Start a looping ambient sound.
   * @param {string} id - Unique loop identifier
   * @param {HTMLAudioElement} audio - Audio element
   */
  startLoop(id, audio) {
    if (!this._initialized || this._muted) return;
    try {
      if (this._activeLoops.has(id)) return;
      audio.loop = true;
      audio.volume = this._ambienceVolume;
      audio.play().catch(() => {});
      this._activeLoops.set(id, audio);
    } catch (e) {
      // Silently fail
    }
  }

  /** Stop a looping ambient sound by ID */
  stopLoop(id) {
    const audio = this._activeLoops.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this._activeLoops.delete(id);
    }
  }

  /** Stop all active loops */
  stopAllLoops() {
    for (const id of this._activeLoops.keys()) {
      this.stopLoop(id);
    }
  }

  /** Set master volume (0-1) */
  setMasterVolume(vol) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this._masterGain) {
      this._masterGain.gain.value = this._masterVolume;
    }
  }

  /** Set SFX volume (0-1) */
  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  }

  /** Set ambience volume (0-1) */
  setAmbienceVolume(vol) {
    this._ambienceVolume = Math.max(0, Math.min(1, vol));
    for (const audio of this._activeLoops.values()) {
      audio.volume = this._ambienceVolume;
    }
  }

  /** Toggle mute */
  toggleMute() {
    this._muted = !this._muted;
    if (this._masterGain) {
      this._masterGain.gain.value = this._muted ? 0 : this._masterVolume;
    }
  }

  /** @returns {boolean} */
  get isMuted() { return this._muted; }

  /** @returns {number} */
  get masterVolume() { return this._masterVolume; }
}
```

### Task 1.5: Yandex SDK Wrappers

**Files:**
- Create: `src/yandex/YandexSDK.js`
- Create: `src/yandex/YandexAds.js`
- Create: `src/yandex/YandexPlayer.js`
- Create: `src/yandex/YandexLeaderboard.js`

- [ ] **Step 1: Create YandexSDK.js**

```js
/**
 * YandexSDK — wrapper for Yandex Games SDK v2.
 * Provides graceful fallback to mock when SDK is unavailable.
 */
export class YandexSDK {
  constructor() {
    this._sdk = null;
    this._player = null;
    this._leaderboard = null;
    this._initialized = false;
    this._mockData = {};
  }

  /** Initialize the Yandex SDK */
  async init() {
    try {
      if (window.YaGames) {
        this._sdk = await YaGames.init();
        this._player = await this._sdk.getPlayer();
        this._leaderboard = this._sdk.getLeaderboards();
        this._initialized = true;
        console.log('[YandexSDK] Initialized');
      } else {
        console.warn('[YandexSDK] SDK not available, using mock');
      }
    } catch (e) {
      console.warn('[YandexSDK] Init failed, using mock:', e);
    }
    return this;
  }

  /** @returns {boolean} Whether real SDK is available */
  get isAvailable() { return this._initialized; }

  /** @returns {Object|null} Raw SDK player instance */
  get player() { return this._player; }

  /** @returns {Object|null} Raw SDK leaderboard instance */
  get leaderboard() { return this._leaderboard; }

  /** Prompt user for data access */
  async requestPlayerDataAccess() {
    if (this._player) {
      return this._player.getDataAccess?.();
    }
    return 'ok';
  }

  /** Get game data from cloud */
  async getData() {
    if (this._player) {
      try { return await this._player.getData(); } catch (e) { /* fallback */ }
    }
    return { ...this._mockData };
  }

  /** Save game data to cloud */
  async setData(data) {
    if (this._player) {
      try { await this._player.setData(data); } catch (e) { /* fallback */ }
    }
    this._mockData = { ...data };
  }

  /** Show fullscreen ad */
  async showFullscreenAdv() {
    if (this._sdk) {
      try {
        await this._sdk.adv.showFullscreenAdv();
        return true;
      } catch (e) { /* fallback */ }
    }
    return false;
  }

  /** Get platform info */
  getPlatformInfo() {
    if (this._sdk) {
      return {
        id: this._sdk.deviceInfo?.type || 'unknown',
        language: this._sdk.environment?.i18n?.lang || 'en',
      };
    }
    return { id: 'desktop', language: 'en' };
  }

  /** Signal gameplay start (for ad timing) */
  gameplayStart() {
    this._sdk?.features?.GameplayAPI?.start();
  }

  /** Signal gameplay stop (for ad timing) */
  gameplayStop() {
    this._sdk?.features?.GameplayAPI?.stop();
  }
}

/** Singleton instance */
export const yandexSDK = new YandexSDK();
```

- [ ] **Step 2: Create YandexAds.js**

```js
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
```

- [ ] **Step 3: Create YandexPlayer.js**

```js
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
```

- [ ] **Step 4: Create YandexLeaderboard.js**

```js
/**
 * YandexLeaderboard — leaderboard wrapper.
 */
export class YandexLeaderboard {
  /**
   * @param {Object} sdk - YandexSDK instance
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
    if (this._sdk?.leaderboard) {
      try {
        await this._sdk.leaderboard.setLeaderboardScore(leaderboardName, score);
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
    if (this._sdk?.leaderboard) {
      try {
        const result = await this._sdk.leaderboard.getLeaderboardEntries(leaderboardName, { quantityTop: count });
        return result?.entries || [];
      } catch (e) { /* fallback */ }
    }
    return [];
  }
}
```

---

## STREAM 2: Game Systems

### Task 2.1: PowerSystem

**Files:**
- Create: `src/systems/PowerSystem.js`

- [ ] **Step 1: Create PowerSystem**

```js
/**
 * PowerSystem — manages power drain and emergency mode.
 * Power drains based on active systems (doors, lights, cameras).
 */
export class PowerSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._maxPower = 100;
    this._currentPower = this._maxPower;
    this._drainRate = 0.15; // base drain per second
    this._doorDrain = 0.1; // per door per second
    this._lightDrain = 0.05; // per light per second
    this._cameraDrain = 0.08; // camera usage
    this._isDraining = true;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;
  }

  /** Reset power to full */
  reset() {
    this._currentPower = this._maxPower;
    this._activeDoors = 0;
    this._activeLights = 0;
    this._cameraActive = false;
    this._isDraining = true;
    this._emitChange();
  }

  /**
   * Set the number of active doors.
   * @param {number} count
   */
  setActiveDoors(count) {
    this._activeDoors = Math.max(0, count);
  }

  /**
   * Set the number of active lights.
   * @param {number} count
   */
  setActiveLights(count) {
    this._activeLights = Math.max(0, count);
  }

  /**
   * Set camera active state.
   * @param {boolean} active
   */
  setCameraActive(active) {
    this._cameraActive = active;
  }

  /**
   * Update power drain.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (!this._isDraining || this._currentPower <= 0) return;

    const totalDrain = this._drainRate
      + (this._activeDoors * this._doorDrain)
      + (this._activeLights * this._lightDrain)
      + (this._cameraActive ? this._cameraDrain : 0);

    this._currentPower = Math.max(0, this._currentPower - totalDrain * dt);

    if (this._currentPower <= 0) {
      this._isDraining = false;
    }

    this._emitChange();
  }

  /** @returns {number} Current power (0-100) */
  get currentPower() { return this._currentPower; }

  /** @returns {number} Max power */
  get maxPower() { return this._maxPower; }

  /** @returns {number} Power as percentage (0-100) */
  getPowerPercent() { return (this._currentPower / this._maxPower) * 100; }

  /** @returns {boolean} Whether power is depleted */
  get isDepleted() { return this._currentPower <= 0; }

  _emitChange() {
    this._eventBus.emit('power:change', {
      current: this._currentPower,
      max: this._maxPower,
      percent: this.getPowerPercent(),
    });
  }
}
```

### Task 2.2: CameraSystem

**Files:**
- Create: `src/systems/CameraSystem.js`

- [ ] **Step 1: Create CameraSystem**

```js
/**
 * CameraSystem — manages camera switching and state.
 */
export class CameraSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._isActive = false;
    this._currentCamera = null;
    this._staticNoise = 0.3; // visual static intensity
  }

  /** Open camera system */
  open() {
    this._isActive = true;
  }

  /** Close camera system */
  close() {
    this._isActive = false;
    this._currentCamera = null;
  }

  /**
   * Switch to a specific camera.
   * @param {string} cameraId
   */
  switchTo(cameraId) {
    if (!this._isActive) return;
    this._currentCamera = cameraId;
    this._eventBus.emit('camera:switch', { cameraId });
  }

  /** @returns {boolean} */
  get isActive() { return this._isActive; }

  /** @returns {string|null} */
  get currentCamera() { return this._currentCamera; }

  /** @returns {number} Static noise intensity (0-1) */
  get staticNoise() { return this._staticNoise; }

  /**
   * Render camera view.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {Object} options
   * @param {string} options.cameraId
   * @param {Array} options.enemies - Current enemy positions
   * @param {Object} options.rooms - Room definitions
   */
  render(ctx, w, h, { cameraId, enemies, rooms }) {
    // Dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const room = rooms?.[cameraId];
    if (room) {
      // Room label
      ctx.fillStyle = '#44aa44';
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`CAM: ${room.name}`, 20, 20);
    }

    // Static noise overlay
    this._drawStatic(ctx, w, h);

    // Enemy indicators
    if (enemies) {
      for (const enemy of enemies) {
        if (enemy.currentRoom === cameraId) {
          this._drawEnemyIndicator(ctx, w, h, enemy);
        }
      }
    }
  }

  _drawStatic(ctx, w, h) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 16) {
      const noise = Math.random() * 255 * this._staticNoise;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 30;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  _drawEnemyIndicator(ctx, w, h, enemy) {
    const x = w * 0.3 + Math.random() * w * 0.4;
    const y = h * 0.3 + Math.random() * h * 0.4;

    ctx.fillStyle = enemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.name, x, y);
  }
}
```

### Task 2.3: ClockSystem

**Files:**
- Create: `src/systems/ClockSystem.js`

- [ ] **Step 1: Create ClockSystem**

```js
/**
 * ClockSystem — manages game time progression.
 * 6 in-game hours per night.
 */
export class ClockSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._currentHour = 0; // 0 = 12AM, 6 = 6AM
    this._durationMs = 180000; // default 3 minutes
    this._elapsed = 0;
    this._hourDuration = this._durationMs / 6;
    this._isComplete = false;
  }

  /**
   * Reset clock for a new night.
   * @param {number} durationMs - Total night duration
   */
  reset(durationMs = 180000) {
    this._durationMs = durationMs;
    this._hourDuration = durationMs / 6;
    this._currentHour = 0;
    this._elapsed = 0;
    this._isComplete = false;
    this._emitTick();
  }

  /**
   * Update clock.
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    if (this._isComplete) return;

    this._elapsed += dt;

    const newHour = Math.min(6, Math.floor(this._elapsed / this._hourDuration));

    if (newHour !== this._currentHour) {
      this._currentHour = newHour;
      this._emitTick();
    }

    if (this._currentHour >= 6) {
      this._isComplete = true;
    }
  }

  /** @returns {number} Current hour (0-6) */
  get currentHour() { return this._currentHour; }

  /** @returns {string} Display time (e.g., "12 AM", "3 AM") */
  get displayTime() {
    if (this._currentHour === 0) return '12 AM';
    if (this._currentHour === 6) return '6 AM';
    return `${this._currentHour} AM`;
  }

  /** @returns {number} Progress through current hour (0-1) */
  get hourProgress() {
    const hourElapsed = this._elapsed % this._hourDuration;
    return hourElapsed / this._hourDuration;
  }

  /** @returns {number} Overall night progress (0-1) */
  get nightProgress() {
    return Math.min(1, this._elapsed / this._durationMs);
  }

  /** @returns {boolean} */
  get isComplete() { return this._isComplete; }

  _emitTick() {
    this._eventBus.emit('clock:tick', {
      hour: this._currentHour,
      progress: this.nightProgress,
    });
  }
}
```

### Task 2.4: OfficeSystem

**Files:**
- Create: `src/systems/OfficeSystem.js`

- [ ] **Step 1: Create OfficeSystem**

```js
/**
 * OfficeSystem — manages doors, lights, and ventilation.
 */
export class OfficeSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._leftDoor = false;
    this._rightDoor = false;
    this._leftLight = false;
    this._rightLight = false;
    this._fanOn = true;
  }

  /** Reset office state */
  reset() {
    this._leftDoor = false;
    this._rightDoor = false;
    this._leftLight = false;
    this._rightLight = false;
    this._fanOn = true;
  }

  /**
   * Toggle a door.
   * @param {'left'|'right'} side
   */
  toggleDoor(side) {
    if (side === 'left') {
      this._leftDoor = !this._leftDoor;
      this._eventBus.emit('door:toggle', { side: 'left', isOpen: !this._leftDoor });
    } else if (side === 'right') {
      this._rightDoor = !this._rightDoor;
      this._eventBus.emit('door:toggle', { side: 'right', isOpen: !this._rightDoor });
    }
  }

  /**
   * Toggle a light.
   * @param {'left'|'right'} side
   */
  toggleLight(side) {
    if (side === 'left') {
      this._leftLight = !this._leftLight;
      this._eventBus.emit('light:toggle', { side: 'left', isOn: this._leftLight });
    } else if (side === 'right') {
      this._rightLight = !this._rightLight;
      this._eventBus.emit('light:toggle', { side: 'right', isOn: this._rightLight });
    }
  }

  /** Toggle fan */
  toggleFan() {
    this._fanOn = !this._fanOn;
  }

  /** @returns {boolean} */
  get leftDoorOpen() { return !this._leftDoor; }

  /** @returns {boolean} */
  get rightDoorOpen() { return !this._rightDoor; }

  /** @returns {boolean} */
  get leftLightOn() { return this._leftLight; }

  /** @returns {boolean} */
  get rightLightOn() { return this._rightLight; }

  /** @returns {number} Number of closed doors */
  get activeDoors() {
    return (this._leftDoor ? 1 : 0) + (this._rightDoor ? 1 : 0);
  }

  /** @returns {number} Number of active lights */
  get activeLights() {
    return (this._leftLight ? 1 : 0) + (this._rightLight ? 1 : 0);
  }

  /**
   * Check if enemy is at a door (revealed by light).
   * @param {string} side - 'left' or 'right'
   * @param {Array} enemies - Enemy array
   * @returns {boolean}
   */
  isEnemyAtDoor(side, enemies) {
    const doorRoom = side === 'left' ? 'left_door' : 'right_door';
    return enemies.some(e => e.currentRoom === doorRoom);
  }
}
```

### Task 2.5: JumpscareSystem

**Files:**
- Create: `src/systems/JumpscareSystem.js`

- [ ] **Step 1: Create JumpscareSystem**

```js
/**
 * JumpscareSystem — handles jumpscare triggers and animation.
 */
export class JumpscareSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._isActive = false;
    this._currentEnemy = null;
    this._elapsed = 0;
    this._duration = 2000; // ms for full jumpscare
    this._onComplete = null;
  }

  /**
   * Trigger a jumpscare.
   * @param {Object} enemy - Enemy data { id, name, color }
   * @param {Function} onComplete - Callback after jumpscare animation
   */
  trigger(enemy, onComplete) {
    this._isActive = true;
    this._currentEnemy = enemy;
    this._elapsed = 0;
    this._onComplete = onComplete;
    this._eventBus.emit('jumpscare:trigger', { enemyId: enemy.id });
  }

  /**
   * Update jumpscare animation.
   * @param {number} dt - Delta time in milliseconds
   */
  update(dt) {
    if (!this._isActive) return;

    this._elapsed += dt;

    if (this._elapsed >= this._duration) {
      this._isActive = false;
      this._onComplete?.();
    }
  }

  /**
   * Render jumpscare.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  render(ctx, w, h) {
    if (!this._isActive || !this._currentEnemy) return;

    const progress = this._elapsed / this._duration;
    const shake = Math.sin(this._elapsed * 0.05) * 20 * (1 - progress);

    ctx.save();
    ctx.translate(shake, shake * 0.5);

    // Flashing background
    const flash = Math.sin(this._elapsed * 0.02) > 0;
    ctx.fillStyle = flash ? '#1a0000' : '#000000';
    ctx.fillRect(0, 0, w, h);

    // Enemy face
    const scale = 1 + progress * 0.5;
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Face shape
    ctx.fillStyle = this._currentEnemy.color || '#ff0000';
    ctx.beginPath();
    ctx.arc(0, 0, 120, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-35, -20, 25, 0, Math.PI * 2);
    ctx.arc(35, -20, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-35, -20, 12, 0, Math.PI * 2);
    ctx.arc(35, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 30, 50, 0, Math.PI);
    ctx.fill();

    // Teeth
    ctx.fillStyle = '#ffffff';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(i * 14 - 5, 30, 10, 15);
    }

    ctx.restore();

    // Name
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 36px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(this._currentEnemy.name, cx, h - 30);

    ctx.restore();
  }

  /** @returns {boolean} */
  get isActive() { return this._isActive; }
}
```

### Task 2.6: HUDSystem

**Files:**
- Create: `src/systems/HUDSystem.js`

- [ ] **Step 1: Create HUDSystem**

```js
/**
 * HUDSystem — renders the game HUD overlay.
 */
import { COLORS, UI } from '../config/gameConfig.js';

export class HUDSystem {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
    this._powerPercent = 100;
    this._currentTime = '12 AM';
    this._cameraActive = false;
    this._showCameraMap = false;
  }

  /**
   * Update HUD state.
   * @param {Object} state
   */
  updateState(state) {
    if (state.powerPercent !== undefined) this._powerPercent = state.powerPercent;
    if (state.currentTime !== undefined) this._currentTime = state.currentTime;
    if (state.cameraActive !== undefined) this._cameraActive = state.cameraActive;
    if (state.showCameraMap !== undefined) this._showCameraMap = state.showCameraMap;
  }

  /**
   * Render HUD overlay.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  render(ctx, w, h) {
    this._drawPowerBar(ctx, w, h);
    this._drawClock(ctx, w, h);
    this._drawCameraToggle(ctx, w, h);
  }

  /**
   * Render camera map overlay.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   * @param {Object} rooms - Room definitions
   * @param {string} selectedCamera - Currently selected camera ID
   */
  renderCameraMap(ctx, w, h, rooms, selectedCamera) {
    if (!rooms) return;

    const mapW = w * 0.35;
    const mapH = h * 0.5;
    const mapX = w - mapW - UI.PADDING;
    const mapY = h * 0.15;

    // Map background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    // Camera buttons
    const roomEntries = Object.values(rooms).filter(r => !r.isOffice);
    const btnW = mapW * 0.45;
    const btnH = 28;
    const gap = 4;
    const cols = 2;

    roomEntries.forEach((room, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = mapX + UI.PADDING + col * (btnW + gap);
      const by = mapY + UI.PADDING + row * (btnH + gap);
      const isSelected = room.id === selectedCamera;

      ctx.fillStyle = isSelected ? COLORS.ACCENT_RED : COLORS.UI_BG;
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.strokeStyle = isSelected ? COLORS.ACCENT_RED_BRIGHT : COLORS.UI_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, btnW, btnH);

      ctx.fillStyle = isSelected ? '#ffffff' : COLORS.TEXT_SECONDARY;
      ctx.font = '10px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(room.name, bx + btnW / 2, by + btnH / 2);
    });
  }

  _drawPowerBar(ctx, w, h) {
    const barW = w * 0.2;
    const barH = UI.BAR_HEIGHT;
    const x = UI.PADDING;
    const y = h - UI.PADDING - barH - 30;

    // Label
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${UI.FONT_SMALL}px Courier New`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Power', x, y - 4);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, barW, barH);

    // Fill
    const color = this._powerPercent > 30 ? COLORS.POWER_OK : COLORS.POWER_LOW;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW * (this._powerPercent / 100), barH);

    // Percentage
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.floor(this._powerPercent)}%`, x, y + barH + 4);
  }

  _drawClock(ctx, w, h) {
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${UI.FONT_SUBTITLE}px Courier New`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this._currentTime, w - UI.PADDING, UI.PADDING);
  }

  _drawCameraToggle(ctx, w, h) {
    const btnW = 120;
    const btnH = 44;
    const x = (w - btnW) / 2;
    const y = h - btnH - UI.PADDING;

    ctx.fillStyle = this._cameraActive ? COLORS.ACCENT_RED : COLORS.UI_BG;
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnW, btnH);

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._cameraActive ? 'Close Camera' : 'Open Camera', x + btnW / 2, y + btnH / 2);
  }

  /**
   * Get camera toggle button bounds for hit testing.
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getCameraToggleBounds(w, h) {
    const btnW = 120;
    const btnH = 44;
    return {
      x: (w - btnW) / 2,
      y: h - btnH - UI.PADDING,
      w: btnW,
      h: btnH,
    };
  }

  /**
   * Get door button bounds.
   * @param {'left'|'right'} side
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getDoorButtonBounds(side, w, h) {
    const btnW = 60;
    const btnH = 44;
    const x = side === 'left' ? UI.PADDING : w - UI.PADDING - btnW;
    const y = h * 0.4;
    return { x, y, w: btnW, h: btnH };
  }

  /**
   * Get light button bounds.
   * @param {'left'|'right'} side
   * @param {number} w
   * @param {number} h
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getLightButtonBounds(side, w, h) {
    const btnW = 60;
    const btnH = 44;
    const x = side === 'left' ? UI.PADDING : w - UI.PADDING - btnW;
    const y = h * 0.4 + UI.INTERACTIVE_MIN + 10;
    return { x, y, w: btnW, h: btnH };
  }
}
```

---

## STREAM 3: Enemy + EnemyAI

### Task 3.1: Enemy Entity

**Files:**
- Create: `src/entities/Enemy.js`

- [ ] **Step 1: Create Enemy entity**

```js
/**
 * Enemy — enemy entity with position, state, and rendering.
 */
export class Enemy {
  /**
   * @param {Object} deps
   * @param {string} deps.id - Enemy ID
   * @param {string} deps.name - Display name
   * @param {string} deps.color - Display color
   * @param {string} deps.startRoom - Starting room ID
   */
  constructor({ id, name, color, startRoom }) {
    this._id = id;
    this._name = name;
    this._color = color;
    this._currentRoom = startRoom;
    this._previousRoom = null;
    this._isMoving = false;
    this._moveTimer = 0;
    this._aggression = 0;
    this._isDefeated = false; // defeated by closing door
  }

  /** Reset enemy to start room */
  reset(startRoom) {
    this._currentRoom = startRoom;
    this._previousRoom = null;
    this._isMoving = false;
    this._moveTimer = 0;
    this._isDefeated = false;
  }

  /**
   * Set aggression level (0-20).
   * @param {number} level
   */
  setAggression(level) {
    this._aggression = Math.max(0, Math.min(20, level));
  }

  /**
   * Move enemy to a new room.
   * @param {string} roomId
   */
  moveTo(roomId) {
    this._previousRoom = this._currentRoom;
    this._currentRoom = roomId;
    this._isMoving = true;
  }

  /** Mark movement as complete */
  completeMove() {
    this._isMoving = false;
  }

  /** Defeat enemy (door blocked attack) */
  defeat() {
    this._isDefeated = true;
  }

  /** @returns {string} */
  get id() { return this._id; }

  /** @returns {string} */
  get name() { return this._name; }

  /** @returns {string} */
  get color() { return this._color; }

  /** @returns {string} */
  get currentRoom() { return this._currentRoom; }

  /** @returns {string|null} */
  get previousRoom() { return this._previousRoom; }

  /** @returns {boolean} */
  get isMoving() { return this._isMoving; }

  /** @returns {number} */
  get aggression() { return this._aggression; }

  /** @returns {boolean} */
  get isDefeated() { return this._isDefeated; }

  /** @returns {boolean} Whether enemy is at office door */
  get isAtOfficeDoor() {
    return this._currentRoom === 'left_door' || this._currentRoom === 'right_door';
  }

  /**
   * Render enemy placeholder.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} size
   */
  render(ctx, x, y, size = 60) {
    ctx.fillStyle = this._color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._name, x, y);
  }
}
```

### Task 3.2: EnemyAI

**Files:**
- Create: `src/ai/EnemyAI.js`

- [ ] **Step 1: Create EnemyAI**

```js
/**
 * EnemyAI — AI behavior for enemy movement and attacks.
 * Uses aggression level and randomness to determine movement timing.
 */
import { ROOM_MAP } from '../data/rooms.js';

export class EnemyAI {
  /**
   * @param {Object} deps
   * @param {EventBus} deps.eventBus
   */
  constructor({ eventBus }) {
    this._eventBus = eventBus;
  }

  /**
   * Update enemy AI logic.
   * @param {Enemy} enemy - Enemy entity
   * @param {Object} enemyDef - Enemy definition from enemies.js
   * @param {number} dt - Delta time in milliseconds
   * @param {Object} officeSystem - OfficeSystem instance
   * @returns {'moved'|'attacked'|'blocked'|null}
   */
  update(enemy, enemyDef, dt, officeSystem) {
    if (enemy.isDefeated || enemy.isMoving) return null;

    enemy._moveTimer += dt;

    // Calculate move interval based on aggression
    const aggressionFactor = enemy.aggression / 20; // 0-1
    const moveInterval = enemyDef.moveIntervalMs * (1 - aggressionFactor * 0.7)
      + Math.random() * enemyDef.moveIntervalVariance * (1 - aggressionFactor);

    if (enemy._moveTimer < moveInterval) return null;

    enemy._moveTimer = 0;

    // Check if enemy is at door
    if (enemy.isAtOfficeDoor && enemyDef.canAttackFromDoor) {
      return this._attemptAttack(enemy, enemyDef, officeSystem);
    }

    // Move towards office
    return this._moveTowardsOffice(enemy, enemyDef);
  }

  /**
   * Move enemy one step closer to office.
   * @param {Enemy} enemy
   * @param {Object} enemyDef
   * @returns {'moved'|null}
   */
  _moveTowardsOffice(enemy, enemyDef) {
    const path = enemyDef.preferredPath;
    const currentIndex = path.indexOf(enemy.currentRoom);

    if (currentIndex === -1) {
      // Enemy not on path, move to first room
      enemy.moveTo(path[0]);
      this._eventBus.emit('enemy:move', { enemyId: enemy.id, from: null, to: path[0] });
      return 'moved';
    }

    if (currentIndex >= path.length - 1) {
      return null; // Already at end of path (door)
    }

    // Aggression-based chance to move forward
    const moveChance = 0.3 + (enemy.aggression / 20) * 0.7;
    if (Math.random() > moveChance) return null;

    const nextRoom = path[currentIndex + 1];
    const from = enemy.currentRoom;
    enemy.moveTo(nextRoom);
    this._eventBus.emit('enemy:move', { enemyId: enemy.id, from, to: nextRoom });
    return 'moved';
  }

  /**
   * Attempt to attack from door.
   * @param {Enemy} enemy
   * @param {Object} enemyDef
   * @param {Object} officeSystem
   * @returns {'attacked'|'blocked'}
   */
  _attemptAttack(enemy, enemyDef, officeSystem) {
    const isLeftDoor = enemy.currentRoom === 'left_door';
    const doorClosed = isLeftDoor ? !officeSystem.leftDoorOpen : !officeSystem.rightDoorOpen;

    if (doorClosed) {
      enemy.defeat();
      return 'blocked';
    }

    return 'attacked';
  }
}
```

---

## STREAM 4: NightScene

### Task 4.1: NightScene (Main Gameplay)

**Files:**
- Create: `src/scenes/NightScene.js`
- Modify: `src/main.js` — replace placeholder with real import

- [ ] **Step 1: Create NightScene.js**

```js
/**
 * NightScene — main gameplay scene.
 * Manages office view, camera system, all game systems integration.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { PowerSystem } from '../systems/PowerSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { ClockSystem } from '../systems/ClockSystem.js';
import { OfficeSystem } from '../systems/OfficeSystem.js';
import { JumpscareSystem } from '../systems/JumpscareSystem.js';
import { HUDSystem } from '../systems/HUDSystem.js';
import { Enemy } from '../entities/Enemy.js';
import { EnemyAI } from '../ai/EnemyAI.js';
import { ENEMIES } from '../data/enemies.js';
import { ROOM_MAP } from '../data/rooms.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';
import { eventBus } from '../engine/EventBus.js';
import { Renderer } from '../engine/Renderer.js';

export class NightScene {
  /**
   * @param {Object} deps
   * @param {number} deps.baseWidth
   * @param {number} deps.baseHeight
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.inputManager
   * @param {Object} [deps.audioManager]
   * @param {number} [deps.nightId] - Which night to play
   */
  constructor({ baseWidth, baseHeight, onSceneChange, inputManager, audioManager, nightId }) {
    this._baseWidth = baseWidth;
    this._baseHeight = baseHeight;
    this._onSceneChange = onSceneChange;
    this._inputManager = inputManager;
    this._audioManager = audioManager;

    // Systems
    this._powerSystem = new PowerSystem({ eventBus });
    this._cameraSystem = new CameraSystem({ eventBus });
    this._clockSystem = new ClockSystem({ eventBus });
    this._officeSystem = new OfficeSystem({ eventBus });
    this._jumpscareSystem = new JumpscareSystem({ eventBus });
    this._hudSystem = new HUDSystem({ eventBus });
    this._enemyAI = new EnemyAI({ eventBus });

    // Enemies
    this._enemies = [];

    // Night config
    this._nightId = nightId || DEFAULT_NIGHT_ID;
    this._nightConfig = NIGHT_MAP[this._nightId] || NIGHT_MAP[DEFAULT_NIGHT_ID];

    // State
    this._paused = false;
    this._gameOver = false;
    this._victory = false;
    this._powerOut = false;
  }

  /** Called when scene becomes active */
  enter() {
    this._paused = false;
    this._gameOver = false;
    this._victory = false;
    this._powerOut = false;

    // Reset systems
    this._powerSystem.reset();
    this._clockSystem.reset(this._nightConfig.durationMs);
    this._officeSystem.reset();
    this._cameraSystem.close();

    // Initialize enemies
    this._enemies = [];
    for (const spawn of this._nightConfig.spawns) {
      const def = ENEMIES.find(e => e.id === spawn.enemyId);
      if (!def) continue;

      const enemy = new Enemy({
        id: def.id,
        name: def.name,
        color: def.color,
        startRoom: spawn.startRoom,
      });
      enemy.setAggression(spawn.aggression);
      this._enemies.push(enemy);
    }

    // Bind input
    this._bindInput();

    // Subscribe to events
    this._subscribeEvents();

    // Update HUD
    this._updateHUD();
  }

  /** Called when scene is deactivated */
  exit() {
    this._inputManager.clearAll();
    eventBus.clear();
  }

  /**
   * Update game logic.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this._paused || this._gameOver || this._victory) return;

    const dtMs = dt * 1000;

    // Update clock
    this._clockSystem.update(dtMs);
    if (this._clockSystem.isComplete) {
      this._victory = true;
      this._onVictory();
      return;
    }

    // Update power
    this._powerSystem.update(dt);
    if (this._powerSystem.isDepleted && !this._powerOut) {
      this._onPowerOut();
    }

    // Update office system power tracking
    this._powerSystem.setActiveDoors(this._officeSystem.activeDoors);
    this._powerSystem.setActiveLights(this._officeSystem.activeLights);
    this._powerSystem.setCameraActive(this._cameraSystem.isActive);

    // Update enemies
    if (!this._powerOut) {
      for (const enemy of this._enemies) {
        if (enemy.isDefeated) continue;
        const def = ENEMIES.find(e => e.id === enemy.id);
        if (!def) continue;

        const result = this._enemyAI.update(enemy, def, dtMs, this._officeSystem);

        if (result === 'attacked') {
          this._onJumpscare(enemy);
          return;
        }
      }
    }

    // Update jumpscare
    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.update(dtMs);
    }

    // Update HUD
    this._updateHUD();
  }

  /**
   * Render game scene.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const w = this._baseWidth;
    const h = this._baseHeight;

    if (this._jumpscareSystem.isActive) {
      this._jumpscareSystem.render(ctx, w, h);
      return;
    }

    if (this._cameraSystem.isActive) {
      this._renderCameraView(ctx, w, h);
    } else if (this._powerOut) {
      this._renderPowerOut(ctx, w, h);
    } else {
      this._renderOffice(ctx, w, h);
    }

    // HUD overlay
    this._hudSystem.render(ctx, w, h);

    // Camera map if camera is open
    if (this._cameraSystem.isActive) {
      this._hudSystem.renderCameraMap(ctx, w, h, ROOM_MAP, this._cameraSystem.currentCamera);
    }

    // Door and light buttons
    this._renderDoorButtons(ctx, w, h);
    this._renderLightButtons(ctx, w, h);

    // Vignette
    Renderer.vignette(ctx, w, h, 0.4);
    Renderer.scanlines(ctx, w, h);
  }

  _renderOffice(ctx, w, h) {
    // Office background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Office details
    ctx.fillStyle = '#222';
    ctx.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.7);

    // Desk
    ctx.fillStyle = '#333';
    ctx.fillRect(w * 0.3, h * 0.5, w * 0.4, h * 0.15);

    // Fan
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.45, 20, 0, Math.PI * 2);
    ctx.fill();

    // Door indicators
    this._renderDoorState(ctx, 'left', w, h);
    this._renderDoorState(ctx, 'right', w, h);

    // Light effects
    if (this._officeSystem.leftLightOn) {
      this._renderLightEffect(ctx, 'left', w, h);
    }
    if (this._officeSystem.rightLightOn) {
      this._renderLightEffect(ctx, 'right', w, h);
    }
  }

  _renderDoorState(ctx, side, w, h) {
    const x = side === 'left' ? w * 0.05 : w * 0.92;
    const y = h * 0.2;
    const doorW = w * 0.06;
    const doorH = h * 0.5;

    const isOpen = side === 'left' ? this._officeSystem.leftDoorOpen : this._officeSystem.rightDoorOpen;

    ctx.fillStyle = isOpen ? '#111' : '#333';
    ctx.fillRect(x, y, doorW, doorH);

    ctx.strokeStyle = isOpen ? '#444' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, doorW, doorH);
  }

  _renderLightEffect(ctx, side, w, h) {
    const x = side === 'left' ? w * 0.15 : w * 0.75;
    const gradient = ctx.createRadialGradient(x, h * 0.4, 0, x, h * 0.4, w * 0.2);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _renderCameraView(ctx, w, h) {
    const cameraId = this._cameraSystem.currentCamera;
    this._cameraSystem.render(ctx, w, h, {
      cameraId,
      enemies: this._enemies,
      rooms: ROOM_MAP,
    });
  }

  _renderPowerOut(ctx, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Occasional flicker
    if (Math.random() < 0.02) {
      ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.fillRect(0, 0, w, h);
    }
  }

  _renderDoorButtons(ctx, w, h) {
    for (const side of ['left', 'right']) {
      const bounds = this._hudSystem.getDoorButtonBounds(side, w, h);
      const isClosed = side === 'left' ? !this._officeSystem.leftDoorOpen : !this._officeSystem.rightDoorOpen;

      ctx.fillStyle = isClosed ? COLORS.ACCENT_RED : COLORS.UI_BG;
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isClosed ? 'DOOR' : 'OPEN', bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    }
  }

  _renderLightButtons(ctx, w, h) {
    for (const side of ['left', 'right']) {
      const bounds = this._hudSystem.getLightButtonBounds(side, w, h);
      const isOn = side === 'left' ? this._officeSystem.leftLightOn : this._officeSystem.rightLightOn;

      ctx.fillStyle = isOn ? '#ffffaa' : COLORS.UI_BG;
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

      ctx.fillStyle = isOn ? '#000000' : COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIGHT', bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
    }
  }

  _updateHUD() {
    this._hudSystem.updateState({
      powerPercent: this._powerSystem.getPowerPercent(),
      currentTime: this._clockSystem.displayTime,
      cameraActive: this._cameraSystem.isActive,
    });
  }

  _onPowerOut() {
    this._powerOut = true;
    this._officeSystem.reset();
    this._cameraSystem.close();
  }

  _onJumpscare(enemy) {
    this._jumpscareSystem.trigger(enemy, () => {
      this._gameOver = true;
      this._onSceneChange(SCENES.GAME_OVER);
    });
  }

  _onVictory() {
    eventBus.emit('game:victory', { night: this._nightId });
    setTimeout(() => {
      this._onSceneChange(SCENES.VICTORY);
    }, 1000);
  }

  _bindInput() {
    // Door buttons
    for (const side of ['left', 'right']) {
      this._inputManager.onPointerDown((pos) => {
        const bounds = this._hudSystem.getDoorButtonBounds(side, this._baseWidth, this._baseHeight);
        if (this._isInRect(pos, bounds)) {
          this._officeSystem.toggleDoor(side);
        }
      });
    }

    // Light buttons
    for (const side of ['left', 'right']) {
      this._inputManager.onPointerDown((pos) => {
        const bounds = this._hudSystem.getLightButtonBounds(side, this._baseWidth, this._baseHeight);
        if (this._isInRect(pos, bounds)) {
          this._officeSystem.toggleLight(side);
        }
      });
    }

    // Camera toggle
    this._inputManager.onPointerDown((pos) => {
      const bounds = this._hudSystem.getCameraToggleBounds(this._baseWidth, this._baseHeight);
      if (this._isInRect(pos, bounds)) {
        if (this._cameraSystem.isActive) {
          this._cameraSystem.close();
        } else {
          this._cameraSystem.open();
        }
      }
    });

    // Camera map buttons
    this._inputManager.onPointerDown((pos) => {
      if (!this._cameraSystem.isActive) return;

      const rooms = Object.values(ROOM_MAP).filter(r => !r.isOffice);
      const mapW = this._baseWidth * 0.35;
      const mapH = this._baseHeight * 0.5;
      const mapX = this._baseWidth - mapW - UI.PADDING;
      const mapY = this._baseHeight * 0.15;

      const btnW = mapW * 0.45;
      const btnH = 28;
      const gap = 4;
      const cols = 2;

      rooms.forEach((room, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = mapX + UI.PADDING + col * (btnW + gap);
        const by = mapY + UI.PADDING + row * (btnH + gap);

        if (pos.x >= bx && pos.x <= bx + btnW && pos.y >= by && pos.y <= by + btnH) {
          this._cameraSystem.switchTo(room.id);
        }
      });
    });
  }

  _subscribeEvents() {
    // Events are handled through system state updates
  }

  /**
   * Check if point is in rectangle.
   * @param {{x: number, y: number}} pos
   * @param {{x: number, y: number, w: number, h: number}} rect
   * @returns {boolean}
   */
  _isInRect(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.w
      && pos.y >= rect.y && pos.y <= rect.y + rect.h;
  }
}
```

---

## STREAM 5: Game Over + Victory + Pause

### Task 5.1: GameOverScene

**Files:**
- Create: `src/scenes/GameOverScene.js`

- [ ] **Step 1: Create GameOverScene**

```js
/**
 * GameOverScene — game over screen with jumpscare aftermath.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';

export class GameOverScene {
  /**
   * @param {Object} deps
   * @param {number} deps.baseWidth
   * @param {number} deps.baseHeight
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.canvas
   */
  constructor({ baseWidth, baseHeight, onSceneChange, canvas }) {
    this._baseWidth = baseWidth;
    this._baseHeight = baseHeight;
    this._onSceneChange = onSceneChange;
    this._canvas = canvas;
    this._elapsed = 0;
    this._canInteract = false;
  }

  enter() {
    this._elapsed = 0;
    this._canInteract = false;
    this._bindInput();
  }

  exit() {
    this._canvas.removeEventListener('pointerdown', this._handlePointer);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this._elapsed += dt * 1000;
    if (this._elapsed > 2000) {
      this._canInteract = true;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const w = this._baseWidth;
    const h = this._baseHeight;

    // Dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Static noise
    Renderer.noise(ctx, w, h, 0.15);

    // Game Over text
    const alpha = Math.min(1, this._elapsed / 1000);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = COLORS.ACCENT_RED;
    ctx.font = `bold ${UI.FONT_TITLE}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', w / 2, h * 0.35);

    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${UI.FONT_SUBTITLE}px Courier New`;
    ctx.fillText('The night was not kind to you.', w / 2, h * 0.48);

    // Retry prompt
    if (this._canInteract) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.fillText('Click to try again', w / 2, h * 0.65);
    }

    ctx.globalAlpha = 1;

    // Vignette
    Renderer.vignette(ctx, w, h, 0.5);
    Renderer.scanlines(ctx, w, h);
  }

  _bindInput() {
    this._handlePointer = () => {
      if (this._canInteract) {
        this._onSceneChange(SCENES.NIGHT);
      }
    };
    this._canvas.addEventListener('pointerdown', this._handlePointer);
  }
}
```

### Task 5.2: VictoryScene

**Files:**
- Create: `src/scenes/VictoryScene.js`

- [ ] **Step 1: Create VictoryScene**

```js
/**
 * VictoryScene — night complete screen.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';
import { NIGHT_MAP, DEFAULT_NIGHT_ID } from '../data/nights.js';

export class VictoryScene {
  /**
   * @param {Object} deps
   * @param {number} deps.baseWidth
   * @param {number} deps.baseHeight
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.canvas
   * @param {number} [deps.nightId]
   */
  constructor({ baseWidth, baseHeight, onSceneChange, canvas, nightId }) {
    this._baseWidth = baseWidth;
    this._baseHeight = baseHeight;
    this._onSceneChange = onSceneChange;
    this._canvas = canvas;
    this._nightId = nightId || DEFAULT_NIGHT_ID;
    this._elapsed = 0;
    this._canInteract = false;
  }

  enter() {
    this._elapsed = 0;
    this._canInteract = false;
    this._bindInput();
  }

  exit() {
    this._canvas.removeEventListener('pointerdown', this._handlePointer);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this._elapsed += dt * 1000;
    if (this._elapsed > 3000) {
      this._canInteract = true;
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const w = this._baseWidth;
    const h = this._baseHeight;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // 6 AM text
    const alpha = Math.min(1, this._elapsed / 1500);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${UI.FONT_TITLE}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('6 AM', w / 2, h * 0.3);

    // Night complete
    const nightName = NIGHT_MAP[this._nightId]?.name || `Night ${this._nightId}`;
    ctx.fillStyle = COLORS.POWER_OK;
    ctx.font = `${UI.FONT_SUBTITLE}px Courier New`;
    ctx.fillText(`${nightName} Complete!`, w / 2, h * 0.45);

    // Cheer
    ctx.fillStyle = COLORS.TEXT_SECONDARY;
    ctx.font = `${UI.FONT_BODY}px Courier New`;
    ctx.fillText('You survived another night.', w / 2, h * 0.55);

    // Continue prompt
    if (this._canInteract) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      const nextNight = Math.min(this._nightId + 1, 7);
      ctx.fillText(`Click for ${NIGHT_MAP[nextNight]?.name || 'Next Night'}`, w / 2, h * 0.7);
    }

    ctx.globalAlpha = 1;

    // Subtle vignette
    Renderer.vignette(ctx, w, h, 0.3);
  }

  _bindInput() {
    this._handlePointer = () => {
      if (this._canInteract) {
        const nextNight = Math.min(this._nightId + 1, 7);
        this._onSceneChange(SCENES.NIGHT);
      }
    };
    this._canvas.addEventListener('pointerdown', this._handlePointer);
  }
}
```

### Task 5.3: PauseScene

**Files:**
- Create: `src/scenes/PauseScene.js`

- [ ] **Step 1: Create PauseScene**

```js
/**
 * PauseScene — pause menu overlay.
 */
import { SCENES, COLORS, UI } from '../config/gameConfig.js';
import { Renderer } from '../engine/Renderer.js';

export class PauseScene {
  /**
   * @param {Object} deps
   * @param {number} deps.baseWidth
   * @param {number} deps.baseHeight
   * @param {Function} deps.onSceneChange
   * @param {Object} deps.canvas
   */
  constructor({ baseWidth, baseHeight, onSceneChange, canvas }) {
    this._baseWidth = baseWidth;
    this._baseHeight = baseHeight;
    this._onSceneChange = onSceneChange;
    this._canvas = canvas;
    this._buttons = [];
  }

  enter() {
    this._bindInput();
  }

  exit() {
    this._canvas.removeEventListener('pointerdown', this._handlePointer);
  }

  update() {}

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    const w = this._baseWidth;
    const h = this._baseHeight;

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    // Menu box
    const boxW = w * 0.4;
    const boxH = h * 0.5;
    const boxX = (w - boxW) / 2;
    const boxY = (h - boxH) / 2;

    ctx.fillStyle = COLORS.UI_BG;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title
    ctx.fillStyle = COLORS.TEXT_PRIMARY;
    ctx.font = `bold ${UI.FONT_SUBTITLE}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('PAUSED', w / 2, boxY + UI.PADDING);

    // Buttons
    this._buttons = [];
    const btnW = boxW * 0.7;
    const btnH = 44;
    const btnX = (w - btnW) / 2;
    const labels = ['Resume', 'Restart Night', 'Quit to Title'];

    labels.forEach((label, i) => {
      const btnY = boxY + UI.PADDING + 50 + i * (btnH + 12);
      this._buttons.push({ label, x: btnX, y: btnY, w: btnW, h: btnH });

      ctx.fillStyle = COLORS.UI_BG;
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.strokeStyle = COLORS.UI_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.fillStyle = COLORS.TEXT_PRIMARY;
      ctx.font = `${UI.FONT_BODY}px Courier New`;
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, btnY + btnH / 2);
    });

    // Vignette
    Renderer.vignette(ctx, w, h, 0.3);
  }

  _bindInput() {
    this._handlePointer = (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const scaleX = this._baseWidth / rect.width;
      const scaleY = this._baseHeight / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      for (const btn of this._buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this._handleButtonClick(btn.label);
          return;
        }
      }
    };
    this._canvas.addEventListener('pointerdown', this._handlePointer);
  }

  _handleButtonClick(label) {
    switch (label) {
      case 'Resume':
        this._onSceneChange(SCENES.NIGHT);
        break;
      case 'Restart Night':
        this._onSceneChange(SCENES.NIGHT);
        break;
      case 'Quit to Title':
        this._onSceneChange(SCENES.TITLE);
        break;
    }
  }
}
```

---

## INTEGRATION: Wire Everything Together

### Task 6.1: Update main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Replace main.js with full integration**

```js
import { Game } from './engine/Game.js';
import { SCENES, GAME_TITLE, GAME_VERSION } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { NightScene } from './scenes/NightScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { PauseScene } from './scenes/PauseScene.js';

/**
 * Application bootstrap.
 */
function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('[Bootstrap] Canvas element not found');
    return;
  }

  const game = new Game(canvas);

  const sceneDeps = {
    baseWidth: game.baseWidth,
    baseHeight: game.baseHeight,
    onSceneChange: (name) => game.sceneManager.change(name),
    canvas,
    inputManager: game.inputManager,
  };

  game.registerScene(SCENES.BOOT, new BootScene(sceneDeps));
  game.registerScene(SCENES.TITLE, new TitleScene(sceneDeps));
  game.registerScene(SCENES.NIGHT, new NightScene(sceneDeps));
  game.registerScene(SCENES.GAME_OVER, new GameOverScene(sceneDeps));
  game.registerScene(SCENES.VICTORY, new VictoryScene(sceneDeps));
  game.registerScene(SCENES.PAUSE, new PauseScene(sceneDeps));

  game.start();

  console.log(`[Bootstrap] ${GAME_TITLE} v${GAME_VERSION} started`);
}

bootstrap();
```

- [ ] **Step 2: Fix TitleScene to transition to NightScene instead of itself**

Modify `src/scenes/TitleScene.js` — find the `_proceed()` method and change:
```js
// Change this line:
this._onSceneChange(SCENES.TITLE);
// To:
this._onSceneChange(SCENES.NIGHT);
```

---

## Self-Review Checklist

1. **Spec coverage:** All 5 streams covered with complete code for each file
2. **Placeholder scan:** No TBD/TODO — all code is complete
3. **Type consistency:** EventBus events match contract, system signatures consistent
4. **File dependencies:** All imports reference existing or planned files correctly
5. **Integration:** main.js wires all scenes with proper dependencies
