const TRANSLATIONS = {
  ru: {
    // Main Menu
    menuPlay: 'ИГРАТЬ',
    menuBestiary: 'ДОСЬЕ',
    menuSettings: 'НАСТРОЙКИ',
    menuExit: 'ВЫЙТИ',

    // Night Select
    nightSelectTitle: 'ВЫБОР НОЧИ',
    nightLocked: 'ЗАБЛОКИРОВАНО',
    nightComplete: 'ПРОЙДЕНА',
    nightN: 'Ночь {{night}}',
    nightAvailable: 'ДОСТУПНА',

    // Bestiary
    bestiaryTitle: 'ДОСЬЕ',

    // Settings
    settingsTitle: 'НАСТРОЙКИ',
    settingsLanguage: 'Язык',
    settingsVolume: 'Громкость',
    settingsMusic: 'Музыка',
    settingsSFX: 'Звуки',
    settingsBack: 'НАЗАД',

    // Game HUD
    hudPower: 'Энергия',
    hudNight: 'Ночь {{night}}',
    hudOpenCamera: 'Открыть камеры',
    hudCloseCamera: 'Закрыть камеры',
    hudNoPower: 'НЕТ ЭНЕРГИИ',
    hudDoor: 'ДВЕРЬ',
    hudDoorOpen: 'ОТКРЫТ',
    hudDoorCooldown: 'ЖДИ',
    hudLight: 'СВЕТ',
    hudMask: 'МАСКА',
    hudMaskRemove: 'СНЯТЬ',
    hudMaskWait: 'ЖДИ',
    hudGenerator: 'ГЕНЕРАТОР',
    hudGeneratorOk: 'НОРМА',
    hudGeneratorTap: 'ТЫКАЙ!',
    hudGeneratorRotate: 'КРУТИ >>',
    hudGeneratorFull: 'ПОЛНЫЙ',
    hudGeneratorCharge: 'ЗАРЯД',
    hudGeneratorClickClose: 'ЗАКРЫТЬ',
    hudGeneratorClockwise: 'ПО ЧАСОВОЙ',
    hudGeneratorCounterCw: 'ПРОТИВ ЧАСОВОЙ',
    hudGeneratorStart: 'СТАРТ',

    // Camera Map
    camerasLabel: 'КАМЕРЫ',
    officeLabel: 'ОФИС',

    // Oxygen
    oxygenLabel: 'КИСЛОРОД',

    // Pause
    pauseTitle: 'ПАУЗА',
    pauseResume: 'Продолжить',
    pauseRestart: 'Начать сначала',
    pauseQuit: 'Выйти в меню',

    // Game Over
    gameOverTitle: 'ИГРА ОКОНЧЕНА',
    gameOverSubtitle: 'Эта ночь была к тебе несправедлива.',
    gameOverRetry: 'Нажми чтобы попробовать снова',

    // Victory
    victoryTitle: '6 УТРА',
    victoryComplete: 'Пройдена!',
    victorySurvived: 'Ты выжил ещё одну ночь.',
    victoryClickFor: 'Нажми для',

    // Confirm Exit
    confirmExitTitle: 'ВЫЙТИ?',
    confirmExitMessage: 'Весь прогресс будет потерян.',
    confirmExitYes: 'Да, выйти',
    confirmExitNo: 'Отмена',

    // Boot
    bootLoading: 'Загрузка...',
    bootSubtitle: 'Опыт выживания в ужасе',

    // Title
    gameTitle: '5 НОЧЕЙ НА ЗАГАДОЧНОМ ОСТРОВЕ',
    titleSubtitle: 'Опыт выживания в ужасе',
    titleClickStart: 'НАЖМИ ЧТОБЫ НАЧАТЬ',
    license: '© 2026 Все права защищены',
    musicCredits: 'Музыка: Retro Indie Josh (CC BY 4.0)',

    // General
    clickToContinue: 'Нажми чтобы продолжить',

    // Time
    time12: '00:00',
    timeHour: '{{hour}}:00',

    // Camera
    cameraLabel: 'КАМЕРА',

    // Mini-games
    cameraMalfunction: 'НЕИСПРАВНОСТЬ КАМЕРЫ',
    glitchAscending: 'Нажимай числа по возрастанию',
    glitchDescending: 'Нажимай числа по убыванию',

    // Jumpscare
    jumpscareTitle: 'ТЫ МЁРТВ',

    // Game
    gameSubtitle: 'Опыт выживания в ужасе',
    nightName1: 'Ночь 1',
    nightName2: 'Ночь 2',
    nightName3: 'Ночь 3',
    nightName4: 'Ночь 4',
    nightName5: 'Ночь 5',
    nightName6: 'Ночь 6',
    nightName7: 'Ночь 7',

    // Enemy names
    enemyMillioner: 'Миллионер',
    enemyPresident: 'Президент',
    enemySince: 'Страж',
    enemyFake_millioner: 'Двойник',
    enemyMicro: 'Бизнесмен',
    enemyDancer: 'Танцор',

    // Mini-game
    generatorMinigame: 'ГЕНЕРАТОР',
    generatorInstructions: 'Крути ручку по часовой стрелке',

    // Room names
    roomhelipad: 'Вертушка',
    roomgoldentemple: 'Золотой храм',
    roomstaffquarters: 'Жилой блок',
    roomguesthouse: 'Гостевой дом',
    roomgreenhouse: 'Оранжерея',
    roombeachhouse: 'Пляжный дом',
    roomdock: 'Причал',
    roomgenerator: 'Генераторная',
    roompool: 'Бассейн',
    roomtunnel: 'Туннель',
    roombunker: 'Бункер',
    roomcentralstreet: 'Центральная улица',
    roomoffice: 'Охранная комната',
  },
  en: {
    // Main Menu
    menuPlay: 'PLAY',
    menuBestiary: 'DOSSIER',
    menuSettings: 'SETTINGS',
    menuExit: 'EXIT',

    // Night Select
    nightSelectTitle: 'SELECT NIGHT',
    nightLocked: 'LOCKED',
    nightComplete: 'COMPLETE',
    nightN: 'Night {{night}}',
    nightAvailable: 'AVAILABLE',

    // Bestiary
    bestiaryTitle: 'DOSSIER',

    // Settings
    settingsTitle: 'SETTINGS',
    settingsLanguage: 'Language',
    settingsVolume: 'Volume',
    settingsMusic: 'Music',
    settingsSFX: 'SFX',
    settingsBack: 'BACK',

    // Game HUD
    hudPower: 'Power',
    hudNight: 'Night {{night}}',
    hudOpenCamera: 'Open Camera',
    hudCloseCamera: 'Close Camera',
    hudNoPower: 'NO POWER',
    hudDoor: 'DOOR',
    hudDoorOpen: 'OPEN',
    hudDoorCooldown: 'WAIT',
    hudLight: 'LIGHT',
    hudMask: 'MASK',
    hudMaskRemove: 'REMOVE',
    hudMaskWait: 'WAIT',
    hudGenerator: 'GENERATOR',
    hudGeneratorOk: 'OK',
    hudGeneratorTap: 'TAP NOW!',
    hudGeneratorRotate: 'ROTATE >>',
    hudGeneratorFull: 'FULL',
    hudGeneratorCharge: 'CHARGE',
    hudGeneratorClickClose: 'CLICK TO CLOSE',
    hudGeneratorClockwise: 'CLOCKWISE',
    hudGeneratorCounterCw: 'COUNTER-CW',
    hudGeneratorStart: 'START',

    // Camera Map
    camerasLabel: 'КАМЕРЫ',
    officeLabel: 'OFFICE',

    // Oxygen
    oxygenLabel: 'OXYGEN',

    // Pause
    pauseTitle: 'PAUSED',
    pauseResume: 'Resume',
    pauseRestart: 'Restart Night',
    pauseQuit: 'Quit to Title',

    // Game Over
    gameOverTitle: 'GAME OVER',
    gameOverSubtitle: 'The night was not kind to you.',
    gameOverRetry: 'Click to try again',

    // Victory
    victoryTitle: '6 AM',
    victoryComplete: 'Complete!',
    victorySurvived: 'You survived another night.',
    victoryClickFor: 'Click for',

    // Confirm Exit
    confirmExitTitle: 'EXIT?',
    confirmExitMessage: 'All progress will be lost.',
    confirmExitYes: 'Yes, exit',
    confirmExitNo: 'Cancel',

    // Boot
    bootLoading: 'Loading...',
    bootSubtitle: 'A survival horror experience',

    // Title
    gameTitle: '5 NIGHTS ON A MYSTERIOUS ISLAND',
    titleSubtitle: 'A survival horror experience',
    titleClickStart: 'CLICK OR PRESS ENTER TO START',
    license: '© 2026 All Rights Reserved',
    musicCredits: 'Music: Retro Indie Josh (CC BY 4.0)',

    // General
    clickToContinue: 'Click to continue',

    // Time
    time12: '12AM',
    timeHour: '{{hour}}AM',

    // Camera
    cameraLabel: 'CAMERA',

    // Mini-games
    cameraMalfunction: 'CAMERA MALFUNCTION',
    glitchAscending: 'Click numbers in ASCENDING order',
    glitchDescending: 'Click numbers in DESCENDING order',

    // Jumpscare
    jumpscareTitle: 'YOU DIED',

    // Game
    gameSubtitle: 'A survival horror experience',

    // Night names
    nightName1: 'Night 1',
    nightName2: 'Night 2',
    nightName3: 'Night 3',
    nightName4: 'Night 4',
    nightName5: 'Night 5',
    nightName6: 'Night 6',
    nightName7: 'Night 7',

    // Enemy names
    enemyMillioner: 'Millioner',
    enemyPresident: 'President',
    enemySince: 'Sentinel',
    enemyFake_millioner: 'Double',
    enemyMicro: 'Businessman',
    enemyDancer: 'Dancer',

    // Mini-game
    generatorMinigame: 'GENERATOR',
    generatorInstructions: 'Turn the handle clockwise',

    // Room names
    roomhelipad: 'Helipad',
    roomgoldentemple: 'Golden Temple',
    roomstaffquarters: 'Staff Quarters',
    roomguesthouse: 'Guest House',
    roomgreenhouse: 'Greenhouse',
    roombeachhouse: 'Beach House',
    roomdock: 'Dock',
    roomgenerator: 'Generator Room',
    roompool: 'Pool',
    roomtunnel: 'Tunnel',
    roombunker: 'Bunker',
    roomcentralstreet: 'Central Street',
    roomoffice: 'Security Office',
  },
};

class I18n {
  constructor() {
    this._locale = 'ru';
    this._listeners = [];
  }

  setLocale(locale) {
    if (TRANSLATIONS[locale]) {
      this._locale = locale;
      this._notifyListeners();
    }
  }

  getLocale() {
    return this._locale;
  }

  t(key, params) {
    const dict = TRANSLATIONS[this._locale];
    let text = dict[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{{${k}}}`, v);
      }
    }
    return text;
  }

  onChange(callback) {
    this._listeners.push(callback);
  }

  offChange(callback) {
    this._listeners = this._listeners.filter(cb => cb !== callback);
  }

  _notifyListeners() {
    for (const cb of this._listeners) {
      cb(this._locale);
    }
  }
}

export const i18n = new I18n();
export { TRANSLATIONS };
