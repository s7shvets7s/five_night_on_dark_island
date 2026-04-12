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
    preferredPath: ['helipad', 'golden_temple', 'staff_quarters', 'central_street', 'guest_house', 'dock'],
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
    preferredPath: ['helipad', 'golden_temple', 'greenhouse', 'beach_house', 'generator'],
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
    preferredPath: ['helipad', 'golden_temple', 'beach_house', 'generator'],
    moveIntervalMs: 12000,
    moveIntervalVariance: 6000,
    canAttackFromDoor: true,
    requiresLightCheck: false,
    attackRoom: 'office',
  },
];

/** @type {Record<string, EnemyDef>} */
export const ENEMY_MAP = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
