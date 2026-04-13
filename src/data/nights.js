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
    durationMs: 180000,
    spawns: [
      { enemyId: 'millioner', aggression: 8, startHour: 0, startRoom: 'helipad' },
    ],
  },
  {
    id: 2,
    name: 'Night 2',
    durationMs: 210000,
    spawns: [
      { enemyId: 'millioner', aggression: 10, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 7, startHour: 1, startRoom: 'helipad' },
    ],
  },
  {
    id: 3,
    name: 'Night 3',
    durationMs: 240000,
    spawns: [
      { enemyId: 'millioner', aggression: 12, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'president', aggression: 9, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 9, startHour: 1, startRoom: 'helipad' },
      { enemyId: 'fake_millioner', aggression: 5, startHour: 2, startRoom: 'helipad' },
    ],
  },
  {
    id: 4,
    name: 'Night 4',
    durationMs: 270000,
    spawns: [
      { enemyId: 'millioner', aggression: 14, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'president', aggression: 12, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 11, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'fake_millioner', aggression: 9, startHour: 1, startRoom: 'helipad' },
    ],
  },
  {
    id: 5,
    name: 'Night 5',
    durationMs: 300000,
    spawns: [
      { enemyId: 'millioner', aggression: 16, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'president', aggression: 14, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 13, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'fake_millioner', aggression: 12, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'micro', aggression: 8, startHour: 1, startRoom: 'helipad' },
    ],
  },
  {
    id: 6,
    name: 'Night 6',
    durationMs: 300000,
    spawns: [
      { enemyId: 'millioner', aggression: 18, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'president', aggression: 17, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 15, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'fake_millioner', aggression: 15, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'micro', aggression: 12, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'dancer', aggression: 10, startHour: 1, startRoom: 'helipad' },
    ],
  },
  {
    id: 7,
    name: 'Night 7 (Custom)',
    durationMs: 300000,
    spawns: [
      { enemyId: 'millioner', aggression: 20, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'president', aggression: 20, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'since', aggression: 20, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'fake_millioner', aggression: 20, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'micro', aggression: 20, startHour: 0, startRoom: 'helipad' },
      { enemyId: 'dancer', aggression: 20, startHour: 0, startRoom: 'helipad' },
    ],
  },
];

/** @type {Record<number, Night>} */
export const NIGHT_MAP = Object.fromEntries(NIGHTS.map(n => [n.id, n]));

/** Default night for first play */
export const DEFAULT_NIGHT_ID = 1;
