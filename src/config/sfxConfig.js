/**
 * SFX Configuration — all sound effects for the game.
 *
 * Structure:
 *   key: {
 *     files: ['path1.ogg', 'path2.ogg'],        // array — random one is played
 *     pool: [{ file: 'path.ogg', weight: N }],  // weighted pool for random ambient
 *     volume: 0.5,                               // multiplier (0-1)
 *     intervalMin: 10,                           // min seconds for ambient timer
 *     intervalMax: 30,                           // max seconds for ambient timer
 *   }
 *
 * All paths are relative to assets/audio/sfx/
 */

const SFX_BASE = 'assets/audio/sfx/';

export const SFX = {
  // ==================== UI ====================
  buttonClick: {
    files: ['House & Office/switch.ogg'],
    volume: 0.5,
  },

  // ==================== Doors ====================
  doorOpen: {
    files: [
      'House & Office/Drawer_open.ogg',
      'House & Office/Drawer_open_2.ogg',
      'House & Office/Drawer_open_3.ogg',
    ],
    volume: 0.7,
  },
  doorClose: {
    files: [
      'House & Office/Cabinet_shut.ogg',
      'House & Office/Drawer_close_2.ogg',
      'House & Office/Door_squeeky_2.ogg',
    ],
    volume: 0.7,
  },

  // ==================== Lights ====================
  lightOn: {
    files: ['House & Office/Gas Stove_lighting.ogg'],
    volume: 0.4,
  },
  lightOff: {
    files: ['House & Office/Gas Stove_turning off.ogg'],
    volume: 0.4,
  },

  // ==================== Camera ====================
  cameraOpen: {
    files: ['Character/Camera_taking picture.ogg'],
    volume: 0.5,
  },
  cameraClose: {
    files: ['Character/Camera_taking picture.ogg'],
    volume: 0.3,
  },
  cameraSwitch: {
    files: ['House & Office/Typing.ogg'],
    volume: 0.3,
  },
  cameraGlitchStart: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent.ogg'],
    volume: 0.6,
  },
  cameraGlitchSolve: {
    files: ['Stingers and Spooky Triggers/Harmonized Tone_Pleasant but Spooky.ogg'],
    volume: 0.5,
  },
  cameraGlitchFail: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent_2.ogg'],
    volume: 0.7,
  },

  // ==================== Enemies ====================
  enemyJumpscare: {
    files: [
      'Monsters & Ghosts/Monster_Roar_4.ogg',
      'Monsters & Ghosts/Monster_Roar_2.ogg',
      'Monsters & Ghosts/Scream_Robotic.ogg',
    ],
    volume: 0.9,
  },
  enemyApproach: {
    files: [
      'Monsters & Ghosts/Monster_grunt_long.ogg',
      'Monsters & Ghosts/Monster_grunt x2 (ghmmm).ogg',
    ],
    volume: 0.4,
  },
  enemyReturn: {
    files: ['Character/Footsteps_ running.ogg'],
    volume: 0.35,
  },
  enemyMove: {
    files: [
      'Character/woosh.ogg',
      'Stingers and Spooky Triggers/Scratch_high pitch.ogg',
    ],
    volume: 0.25,
  },

  // ==================== Generator ====================
  generatorStart: {
    files: ['House & Office/Drill starting.ogg'],
    volume: 0.6,
  },
  generatorRunning: {
    files: ['House & Office/Drill running.ogg'],
    volume: 0.4,
  },
  generatorSuccess: {
    files: ['Stingers and Spooky Triggers/Harmonized Tone_Pleasant but Spooky.ogg'],
    volume: 0.6,
  },
  generatorFail: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent.ogg'],
    volume: 0.7,
  },

  // ==================== Power ====================
  powerLow: {
    files: ['Stingers and Spooky Triggers/Suspenseful pitch increase.ogg'],
    volume: 0.5,
  },
  powerOut: {
    files: [
      'Stingers and Spooky Triggers/Piano_drone_low_sustained_2.ogg',
      'Stingers and Spooky Triggers/Metal_twang.ogg',
    ],
    volume: 0.8,
  },

  // ==================== Mask ====================
  maskOn: {
    files: ['Character/Velcro.ogg'],
    volume: 0.5,
  },
  maskOff: {
    files: ['Character/Gasp.ogg'],
    volume: 0.5,
  },

  // ==================== Random Ambient ====================
  ambientRandom: {
    pool: [
      { file: 'Stingers and Spooky Triggers/Spooky Ambience.ogg', weight: 3 },
      { file: 'Stingers and Spooky Triggers/Slow Stinger.ogg', weight: 2 },
      { file: 'Monsters & Ghosts/Hiss.ogg', weight: 2 },
      { file: 'Monsters & Ghosts/Monster_breath.ogg', weight: 2 },
      { file: 'Monsters & Ghosts/Ghost_moan_2.ogg', weight: 1 },
      { file: 'Monsters & Ghosts/Ghost chior.ogg', weight: 1 },
      { file: 'House & Office/Fluorescent light bulb buzz_2.ogg', weight: 2 },
      { file: 'House & Office/Fridge compressor ambient noise.ogg', weight: 2 },
      { file: 'House & Office/Door_knocking_quiet.ogg', weight: 1 },
      { file: 'Stingers and Spooky Triggers/Metal_resonance.ogg', weight: 2 },
      { file: 'Monsters & Ghosts/Child laugh.ogg', weight: 1 },
      { file: 'Monsters & Ghosts/Child laugh_6.ogg', weight: 1 },
      { file: 'Monsters & Ghosts/Child laugh_7.ogg', weight: 1 },
      { file: 'Liquids/Bubbles.ogg', weight: 1 },
      { file: 'Stingers and Spooky Triggers/Piano_crescendo.ogg', weight: 1 },
    ],
    volume: 0.35,
    intervalMin: 15,
    intervalMax: 45,
  },
};

/** Base path for SFX assets */
export const SFX_BASE_PATH = SFX_BASE;

/**
 * Get all unique SFX file paths from the config.
 * @returns {string[]} Array of relative paths
 */
export function getAllSFXPaths() {
  const paths = new Set();

  for (const [, config] of Object.entries(SFX)) {
    if (config.files) {
      for (const file of config.files) {
        paths.add(file);
      }
    }
    if (config.pool) {
      for (const item of config.pool) {
        paths.add(item.file);
      }
    }
  }

  return Array.from(paths);
}