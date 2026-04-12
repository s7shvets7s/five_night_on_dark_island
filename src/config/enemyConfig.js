/**
 * Enemy configuration — all tunable enemy behavior.
 * Add new enemies here: sprites, paths, aggression, return logic.
 */

export const ENEMY_STATES = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  APPROACH: 'APPROACH',
  AT_DOOR: 'AT_DOOR',
  RETURNING: 'RETURNING',
  ATTACK: 'ATTACK',
};

export const MASK_REACTION = {
  FEAR: 'FEAR',     // Боится маски → return на базу
  STAND: 'STAND',    // Стоит и смотрит → не атакует, не уходит
  IGNORE: 'IGNORE',  // Игнорирует маску → атакует!
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
  bonnie: {
    id: 'bonnie',
    name: 'Bonnie',
    color: '#6644aa',
    sprites: {
      idle: 'bonnie_idle.png',
      atDoor: 'bonnie_door.png',
      attack: 'bonnie_attack.png',
    },
    baseRoom: 'helipad',
    doorRoom: 'dock',
    doorSide: 'left',
    doorOffset: { x: 0, y: 0 },
    path: [
      'helipad',
      'golden_temple',
      'staff_quarters',
      'central_street',
      'guest_house',
      'dock',
    ],
    phases: ['patrol', 'corridor', 'door'],
    moveIntervalMs: 8000,
    moveVariance: 4000,
    aggression: 5,
    canReturnOnLight: true,
    canReturnOnDoor: true,
    returnChance: 0.8,
    returnCooldownMs: 5000,
    burstChance: 0.15,
    burstMoveIntervalMs: 2000,
    maskReaction: MASK_REACTION.FEAR,
    initialState: ENEMY_STATES.PATROL,
  },
  chica: {
    id: 'chica',
    name: 'Chica',
    color: '#ccaa22',
    sprites: {
      idle: 'chica_idle.png',
      atDoor: 'chica_door.png',
      attack: 'chica_attack.png',
    },
    baseRoom: 'helipad',
    doorRoom: 'generator',
    doorSide: 'right',
    doorOffset: { x: 0, y: 0 },
    path: [
      'helipad',
      'golden_temple',
      'greenhouse',
      'beach_house',
      'generator',
    ],
    phases: ['patrol', 'corridor', 'door'],
    moveIntervalMs: 9000,
    moveVariance: 5000,
    aggression: 7,
    canReturnOnLight: true,
    canReturnOnDoor: true,
    returnChance: 0.7,
    returnCooldownMs: 6000,
    burstChance: 0.12,
    burstMoveIntervalMs: 2500,
    maskReaction: MASK_REACTION.FEAR,
    initialState: ENEMY_STATES.PATROL,
  },
  foxy: {
    id: 'foxy',
    name: 'Foxy',
    color: '#ff4400',
    sprites: {
      idle: 'foxy_idle.png',
      atDoor: 'foxy_door.png',
      attack: 'foxy_attack.png',
    },
    baseRoom: 'helipad',
    doorRoom: 'dock',
    doorSide: 'left',
    doorOffset: { x: 0, y: 0 },
    path: [
      'helipad',
      'golden_temple',
      'central_street',
      'dock',
    ],
    phases: ['patrol', 'door'],
    moveIntervalMs: 7000,
    moveVariance: 3000,
    aggression: 8,
    canReturnOnLight: false,
    canReturnOnDoor: false,
    returnChance: 0,
    returnCooldownMs: 0,
    burstChance: 0.25,
    burstMoveIntervalMs: 1000,
    maskReaction: MASK_REACTION.STAND,
    initialState: ENEMY_STATES.PATROL,
  },
  freddy: {
    id: 'freddy',
    name: 'Freddy',
    color: '#885522',
    sprites: {
      idle: 'freddy_idle.png',
      atDoor: 'freddy_door.png',
      attack: 'freddy_attack.png',
    },
    baseRoom: 'helipad',
    doorRoom: 'generator',
    doorSide: 'right',
    doorOffset: { x: 0, y: 0 },
    path: [
      'helipad',
      'golden_temple',
      'beach_house',
      'generator',
    ],
    phases: ['patrol', 'door'],
    moveIntervalMs: 12000,
    moveVariance: 6000,
    aggression: 10,
    canReturnOnLight: false,
    canReturnOnDoor: true,
    returnChance: 0.6,
    returnCooldownMs: 8000,
    burstChance: 0.2,
    burstMoveIntervalMs: 1500,
    maskReaction: MASK_REACTION.IGNORE,
    initialState: ENEMY_STATES.PATROL,
  },
};

export const ENEMY_MAP = Object.fromEntries(
  Object.entries(ENEMY_CONFIG).map(([key, val]) => [val.id, val])
);