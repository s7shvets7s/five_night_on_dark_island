/**
 * Room definitions for the island facility.
 * Each room has an ID, display name, and connections to other rooms.
 * Layout inspired by Little St. James island.
 */

/**
 * @typedef {Object} Room
 * @property {string} id - Unique room identifier
 * @property {string} name - Display name
 * @property {string[]} connections - Adjacent room IDs
 * @property {number} x - Render position X (0-1 relative) for camera map
 * @property {number} y - Render position Y (0-1 relative) for camera map
 * @property {boolean} isOffice - Whether this is the office room
 * @property {boolean} isBlindSpot - Whether camera has limited visibility
 */

/** @type {Room[]} */
console.log('[rooms.js] ROOMS count:', 10);
export const ROOMS = [
  { id: 'office', name: 'Security Office', connections: ['dock', 'generator'], x: 0.5, y: 0.88, isOffice: true, isBlindSpot: false },
  { id: 'helipad', name: 'Helipad', connections: ['golden_temple'], x: 0.5, y: 0.05, isOffice: false, isBlindSpot: false, enemyY: 0.5, enemyScale: 1.0 },
  { id: 'golden_temple', name: 'Golden Temple', connections: ['helipad', 'staff_quarters', 'greenhouse'], x: 0.5, y: 0.18, isOffice: false, isBlindSpot: false, enemyY: 0.65, enemyScale: 3.7 },
  { id: 'staff_quarters', name: 'Staff Quarters', connections: ['golden_temple', 'guest_house', 'central_street'], x: 0.2, y: 0.32, isOffice: false, isBlindSpot: false, enemyY: 0.65, enemyScale: 3.7},
  { id: 'greenhouse', name: 'Greenhouse', connections: ['golden_temple', 'beach_house', 'central_street'], x: 0.8, y: 0.32, isOffice: false, isBlindSpot: false, enemyY: 0.5, enemyScale: 1.2 },
  { id: 'guest_house', name: 'Guest House', connections: ['staff_quarters', 'dock', 'central_street'], x: 0.2, y: 0.52, isOffice: false, isBlindSpot: false, enemyY: 0.5, enemyScale: 0.8 },
  { id: 'beach_house', name: 'Beach House', connections: ['greenhouse', 'generator'], x: 0.8, y: 0.52, isOffice: false, isBlindSpot: false, enemyY: 0.5, enemyScale: 0.8 },
  { id: 'dock', name: 'Main Dock', connections: ['guest_house', 'office'], x: 0.2, y: 0.72, isOffice: false, isBlindSpot: true, enemyY: 0.5, enemyScale: 0.6 },
  { id: 'generator', name: 'Generator', connections: ['beach_house', 'office'], x: 0.8, y: 0.72, isOffice: false, isBlindSpot: true, enemyY: 0.5, enemyScale: 0.6 },
  { id: 'central_street', name: 'Central Street', connections: ['staff_quarters', 'guest_house', 'greenhouse'], x: 0.5, y: 0.58, isOffice: false, isBlindSpot: false, enemyY: 0.5, enemyScale: 1.0 },
];

/** @type {Record<string, Room>} - Quick lookup by ID */
export const ROOM_MAP = Object.fromEntries(ROOMS.map(r => [r.id, r]));

/** Camera IDs — same as room IDs for simplicity */
export const CAMERA_IDS = ROOMS.filter(r => !r.isOffice).map(r => r.id);
