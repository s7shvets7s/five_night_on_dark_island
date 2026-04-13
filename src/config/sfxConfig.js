/**
 * SFX Configuration — all sound effects for the game.
 *
 * Structure:
 *   key: {
 *     files: ['path1.wav', 'path2.wav'],        // array — random one is played
 *     pool: [{ file: 'path.wav', weight: N }],  // weighted pool for random ambient
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
    files: ['House & Office/switch.wav'],
    volume: 0.5,
  },

  // ==================== Doors ====================
  doorOpen: {
    files: [
      'House & Office/Drawer_open.wav',
      'House & Office/Drawer_open_2.wav',
      'House & Office/Drawer_open_3.wav',
    ],
    volume: 0.7,
  },
  doorClose: {
    files: [
      'House & Office/Cabinet_shut.wav',
      'House & Office/Drawer_close_2.wav',
      'House & Office/Door_squeeky_2.wav',
    ],
    volume: 0.7,
  },

  // ==================== Lights ====================
  lightOn: {
    files: ['House & Office/Gas Stove_lighting.wav'],
    volume: 0.4,
  },
  lightOff: {
    files: ['House & Office/Gas Stove_turning off.wav'],
    volume: 0.4,
  },

  // ==================== Camera ====================
  cameraOpen: {
    files: ['Character/Camera_taking picture.wav'],
    volume: 0.5,
  },
  cameraClose: {
    files: ['Character/Camera_taking picture.wav'],
    volume: 0.3,
  },
  cameraSwitch: {
    files: ['House & Office/Typing.wav'],
    volume: 0.3,
  },
  cameraGlitchStart: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent.wav'],
    volume: 0.6,
  },
  cameraGlitchSolve: {
    files: ['Stingers and Spooky Triggers/Harmonized Tone_Pleasant but Spooky.wav'],
    volume: 0.5,
  },
  cameraGlitchFail: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent_2.wav'],
    volume: 0.7,
  },

  // ==================== Enemies ====================
  enemyJumpscare: {
    files: [
      'Monsters & Ghosts/Monster_Roar_4.wav',
      'Monsters & Ghosts/Monster_Roar_2.wav',
      'Monsters & Ghosts/Scream_Robotic.wav',
    ],
    volume: 0.9,
  },
  enemyApproach: {
    files: [
      'Monsters & Ghosts/Monster_grunt_long.wav',
      'Monsters & Ghosts/Monster_grunt x2 (ghmmm).wav',
    ],
    volume: 0.4,
  },
  enemyReturn: {
    files: ['Character/Footsteps_ running.wav'],
    volume: 0.35,
  },
  enemyMove: {
    files: [
      'Character/woosh.wav',
      'Stingers and Spooky Triggers/Scratch_high pitch.wav',
    ],
    volume: 0.25,
  },

  // ==================== Generator ====================
  generatorStart: {
    files: ['House & Office/Drill starting.wav'],
    volume: 0.6,
  },
  generatorRunning: {
    files: ['House & Office/Drill running.wav'],
    volume: 0.4,
  },
  generatorSuccess: {
    files: ['Stingers and Spooky Triggers/Harmonized Tone_Pleasant but Spooky.wav'],
    volume: 0.6,
  },
  generatorFail: {
    files: ['Stingers and Spooky Triggers/Piano_stinger_dissonent.wav'],
    volume: 0.7,
  },

  // ==================== Power ====================
  powerLow: {
    files: ['Stingers and Spooky Triggers/Suspenseful pitch increase.wav'],
    volume: 0.5,
  },
  powerOut: {
    files: [
      'Stingers and Spooky Triggers/Piano_drone_low_sustained_2.wav',
      'Stingers and Spooky Triggers/Metal_twang.wav',
    ],
    volume: 0.8,
  },

  // ==================== Mask ====================
  maskOn: {
    files: ['Character/Velcro.wav'],
    volume: 0.5,
  },
  maskOff: {
    files: ['Character/Gasp.wav'],
    volume: 0.5,
  },

  // ==================== Random Ambient ====================
  ambientRandom: {
    pool: [
      { file: 'Stingers and Spooky Triggers/Spooky Ambience.wav', weight: 3 },
      { file: 'Stingers and Spooky Triggers/Slow Stinger.wav', weight: 2 },
      { file: 'Monsters & Ghosts/Hiss.wav', weight: 2 },
      { file: 'Monsters & Ghosts/Monster_breath.wav', weight: 2 },
      { file: 'Monsters & Ghosts/Ghost_moan_2.wav', weight: 1 },
      { file: 'Monsters & Ghosts/Ghost chior.wav', weight: 1 },
      { file: 'House & Office/Fluorescent light bulb buzz_2.wav', weight: 2 },
      { file: 'House & Office/Fridge compressor ambient noise.wav', weight: 2 },
      { file: 'House & Office/Door_knocking_quiet.wav', weight: 1 },
      { file: 'Stingers and Spooky Triggers/Metal_resonance.wav', weight: 2 },
      { file: 'Monsters & Ghosts/Child laugh.wav', weight: 1 },
      { file: 'Monsters & Ghosts/Child laugh_6.wav', weight: 1 },
      { file: 'Monsters & Ghosts/Child laugh_7.wav', weight: 1 },
      { file: 'Liquids/Bubbles.wav', weight: 1 },
      { file: 'Stingers and Spooky Triggers/Piano_crescendo.wav', weight: 1 },
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
