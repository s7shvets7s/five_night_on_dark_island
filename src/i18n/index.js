const TRANSLATIONS = {
  ru: {
    // Main Menu
    menuPlay: 'ИГРАТЬ',
    menuSettings: 'НАСТРОЙКИ',
    menuExit: 'ВЫЙТИ',

    // Night Select
    nightSelectTitle: 'ВЫБОР НОЧИ',
    nightLocked: 'ЗАБЛОКИРОВАНО',
    nightComplete: 'ПРОЙДЕНА',
    nightAvailable: 'ДОСТУПНА',

    // Settings
    settingsTitle: 'НАСТРОЙКИ',
    settingsLanguage: 'Язык',
    settingsVolume: 'Громкость',
    settingsBack: 'НАЗАД',

    // Game HUD
    hudPower: 'Энергия',
    hudOpenCamera: 'Открыть камеры',
    hudCloseCamera: 'Закрыть камеры',
    hudDoor: 'ДВЕРЬ',
    hudDoorOpen: 'ОТКРЫТ',
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
    titleSubtitle: 'Опыт выживания в ужасе',
    titleClickStart: 'НАЖМИ ЧТОБЫ НАЧАТЬ',

    // General
    clickToContinue: 'Нажми чтобы продолжить',
  },
  en: {
    // Main Menu
    menuPlay: 'PLAY',
    menuSettings: 'SETTINGS',
    menuExit: 'EXIT',

    // Night Select
    nightSelectTitle: 'SELECT NIGHT',
    nightLocked: 'LOCKED',
    nightComplete: 'COMPLETE',
    nightAvailable: 'AVAILABLE',

    // Settings
    settingsTitle: 'SETTINGS',
    settingsLanguage: 'Language',
    settingsVolume: 'Volume',
    settingsBack: 'BACK',

    // Game HUD
    hudPower: 'Power',
    hudOpenCamera: 'Open Camera',
    hudCloseCamera: 'Close Camera',
    hudDoor: 'DOOR',
    hudDoorOpen: 'OPEN',
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
    camerasLabel: 'CAMERAS',
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
    titleSubtitle: 'A survival horror experience',
    titleClickStart: 'CLICK OR PRESS ENTER TO START',

    // General
    clickToContinue: 'Click to continue',
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

  t(key) {
    const dict = TRANSLATIONS[this._locale];
    return dict[key] || key;
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
