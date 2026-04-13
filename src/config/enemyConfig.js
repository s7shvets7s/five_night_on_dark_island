/**
 * Enemy configuration — all tunable enemy behavior.
 * Add new enemies here: sprites, paths, aggression, return logic.
 */

export const ENEMY_STATES = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  APPROACH: 'APPROACH',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_DOOR: 'AT_DOOR',
  RETURNING: 'RETURNING',
  ATTACK: 'ATTACK',
};

export const MASK_REACTION = {
  FEAR: 'FEAR',          // Боится маски → уходит на базу
  STAND: 'STAND',        // Стоит и смотрит → не атакует, не уходит
  IGNORE: 'IGNORE',      // Игнорирует маску → атакует как обычно
  ATTACK_ON_MASK: 'ATTACK_ON_MASK', // Агрессивно атакует при маске (повышенный шанс)
};

// ============================================================
// DOOR CONFIG — позиции дверей в пикселях картинки фона
// ============================================================
export const DOOR_IMAGE_SIZE = {
  width: 1368,
  height: 768,
};

export const DOOR_POSITIONS = {
  left: { x: 290, y: 486 },
  right: { x: 1100, y: 486 },
};

export const DOOR_POSITIONS_PERCENT = {
  left: { x: DOOR_POSITIONS.left.x / DOOR_IMAGE_SIZE.width, y: DOOR_POSITIONS.left.y / DOOR_IMAGE_SIZE.height },
  right: { x: DOOR_POSITIONS.right.x / DOOR_IMAGE_SIZE.width, y: DOOR_POSITIONS.right.y / DOOR_IMAGE_SIZE.height },
};

// ============================================================
// ENEMY CONFIG — конфиг каждого врага
// ============================================================
export const ENEMY_CONFIG = {
  millioner: {
    id: 'millioner',
    name: 'Millioner',
    color: '#6644aa',
    sprites: {
      idle: 'millioner.png',
      atDoor: 'millioner.png',
      attack: 'millioner_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'left',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'corridor', 'door'],
    moveIntervalMs: 4500,
    moveVariance: 2500,
    transitTimeMs: 6000,
    aggression: 5,
    canReturnOnLight: true,
    canReturnOnDoor: true,
    returnChance: 0.8,
    returnCooldownMs: 5000,
    lightExposureNeeded: 2000,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 1000,
    burstChance: 0.15,
    burstMoveIntervalMs: 2000,
    maskReaction: MASK_REACTION.FEAR,
    initialState: ENEMY_STATES.PATROL,
  },
  president: {
    id: 'president',
    name: 'President',
    color: '#ccaa22',
    sprites: {
      idle: 'president.png',
      atDoor: 'president.png',
      attack: 'president_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'right',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'corridor', 'door'],
    moveIntervalMs: 5000,
    moveVariance: 3000,
    transitTimeMs: 5500,
    aggression: 7,
    canReturnOnLight: true,
    canReturnOnDoor: true,
    returnChance: 0.7,
    returnCooldownMs: 6000,
    lightExposureNeeded: 2500,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 1000,
    burstChance: 0.12,
    burstMoveIntervalMs: 2500,
    maskReaction: MASK_REACTION.FEAR,
    initialState: ENEMY_STATES.PATROL,
  },
  since: {
    id: 'since',
    name: 'Since',
    color: '#ff4400',
    sprites: {
      idle: 'since.png',
      atDoor: 'since.png',
      attack: 'since_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'left',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'door'],
    moveIntervalMs: 3500,
    moveVariance: 2000,
    transitTimeMs: 4500,
    aggression: 8,
    canReturnOnLight: false,
    canReturnOnDoor: true,
    returnChance: 0.3,
    returnCooldownMs: 4000,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 500,
    burstChance: 0.25,
    burstMoveIntervalMs: 1000,
    maskReaction: MASK_REACTION.ATTACK_ON_MASK,
    initialState: ENEMY_STATES.PATROL,
  },
  fake_millioner: {
    id: 'fake_millioner',
    name: 'Fake_millioner',
    color: '#885522',
    sprites: {
      idle: 'fake_millioner.png',
      atDoor: 'fake_millioner.png',
      attack: 'fake_millioner_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'right',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'door'],
    moveIntervalMs: 6000,
    moveVariance: 3000,
    transitTimeMs: 7000,
    aggression: 10,
    canReturnOnLight: false,
    canReturnOnDoor: true,
    returnChance: 0.6,
    returnCooldownMs: 8000,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 1000,
    burstChance: 0.2,
    burstMoveIntervalMs: 1500,
    maskReaction: MASK_REACTION.IGNORE,
    initialState: ENEMY_STATES.PATROL,
  },
  micro: {
    id: 'micro',
    name: 'Micro',
    color: '#44ff88',
    sprites: {
      idle: 'micro.png',
      atDoor: 'micro.png',
      attack: 'micro_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'left',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'door'],
    moveIntervalMs: 3000,
    moveVariance: 1500,
    transitTimeMs: 3500,
    aggression: 12,
    canReturnOnLight: false,
    canReturnOnDoor: true,
    returnChance: 0.4,
    returnCooldownMs: 3000,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 2000,
    burstChance: 0.4,
    burstMoveIntervalMs: 800,
    maskReaction: MASK_REACTION.STAND,
    initialState: ENEMY_STATES.PATROL,
  },
  dancer: {
    id: 'dancer',
    name: 'Dancer',
    color: '#ff44aa',
    sprites: {
      idle: 'dancer.png',
      atDoor: 'dancer.png',
      attack: 'dancer_attack.png',
    },
    baseRoom: 'helipad',
    doorSide: 'right',
    doorOffset: { x: 0, y: 0 },
    possibleDoors: ['dock', 'generator'],
    phases: ['patrol', 'corridor', 'door'],
    moveIntervalMs: 5500,
    moveVariance: 3500,
    transitTimeMs: 5000,
    aggression: 9,
    canReturnOnLight: true,
    canReturnOnDoor: false,
    returnChance: 0.5,
    returnCooldownMs: 7000,
    lightExposureNeeded: 3000,
    doorExposureNeeded: 1500,
    maskExposureNeeded: 1000,
    burstChance: 0.2,
    burstMoveIntervalMs: 2000,
    maskReaction: MASK_REACTION.IGNORE,
    initialState: ENEMY_STATES.PATROL,
  },
};

export const ENEMY_MAP = Object.fromEntries(
  Object.entries(ENEMY_CONFIG).map(([key, val]) => [val.id, val])
);