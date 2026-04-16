/**
 * Bestiary — enemy descriptions and fear data.
 */

export const BESTIARY = {
  ru: {
    title: 'ДОСЬЕ',
    selectEnemy: 'Выберите врага',
    back: 'НАЗАД',
    light: 'СВЕТ',
    door: 'ДВЕРЬ',
    mask: 'МАСКА',
    fears: 'боится',
    immune: 'иммунитет',
    enemies: {
      millioner: {
        description: 'Владелец этого острова. Мрачная загадочная фигура, контролирующая всё, что происходит здесь. Никто не знает, откуда у него деньги и какую цену он заплатил за эту землю.',
      },
      president: {
        description: 'Бывший политик, потерявший власть. Остров стал его последним убежищем — и его проклятием. Привык командовать, но здесь он лишь тень.',
      },
      since: {
        description: 'Робот-охранник, вышедший из-под контроля. Созданный для защиты, он стал самой страшной угрозой острова. Свет ему не страшен, маска только злит.',
      },
      fake_millioner: {
        description: 'Двойник настоящего Миллионера. Никто не знает — копия, клон или нечто худшее. Ни свет, ни маска его не останавливают.',
      },
      micro: {
        description: 'IT-бизнесмен, приехавший на остров ради сделки. Быстрые шаги, острые зубы и полное безразличие к свету. Маску просто игнорирует.',
      },
      dancer: {
        description: 'Танцор, чья кожа навсегда изменилась. Когда-то он зажигал на сцене, теперь его танец — это погоня. Свет его отпугивает, маска — нет.',
      },
    },
  },
  en: {
    title: 'DOSSIER',
    selectEnemy: 'Select an enemy',
    back: 'BACK',
    light: 'LIGHT',
    door: 'DOOR',
    mask: 'MASK',
    fears: 'FEARS',
    immune: 'IMMUNE',
    enemies: {
      millioner: {
        description: 'Owner of this island. A dark, enigmatic figure who controls everything that happens here. No one knows where his money came from or what price he paid for this land.',
      },
      president: {
        description: 'A former politician who lost everything. The island became his last refuge — and his curse. Used to giving orders, but here he is merely a shadow.',
      },
      since: {
        description: 'A security robot that broke free from its programming. Built to protect, it became the island\'s deadliest threat. Light does nothing — the mask only enrages it.',
      },
      fake_millioner: {
        description: 'A double of the real Millioner. Nobody knows if it\'s a clone, a copy, or something worse. Neither light nor mask can stop it.',
      },
      micro: {
        description: 'An IT businessman who came to the island for a deal. Quick steps, sharp teeth, and complete immunity to light. The mask means nothing to it.',
      },
      dancer: {
        description: 'A performer whose skin was forever changed. Once he lit up the stage, now his dance is a hunt. Light drives him away — the mask does nothing.',
      },
    },
  },
};

/**
 * Fear data — maps to enemyConfig values.
 * Used to display fear indicators in bestiary.
 */
export const BESTIARY_FEARS = {
  millioner: {
    fearsLight: true,
    fearsDoor: true,
    fearsMask: true,   // FEAR
  },
  president: {
    fearsLight: true,
    fearsDoor: true,
    fearsMask: true,   // FEAR
  },
  since: {
    fearsLight: false,
    fearsDoor: true,
    fearsMask: false,  // ATTACK_ON_MASK
  },
  fake_millioner: {
    fearsLight: false,
    fearsDoor: true,
    fearsMask: false,  // IGNORE
  },
  micro: {
    fearsLight: false,
    fearsDoor: true,
    fearsMask: false,  // STAND
  },
  dancer: {
    fearsLight: true,
    fearsDoor: false,
    fearsMask: false,  // IGNORE
  },
};

/** Enemy display order in bestiary */
export const BESTIARY_ORDER = [
  'millioner',
  'president',
  'since',
  'fake_millioner',
  'micro',
  'dancer',
];
