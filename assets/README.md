# Ассеты для Island Night Watch

## Структура папок

```
assets/
├── images/
│   ├── office/        # Фоны для офиса (left_door.png, right_door.png, etc.)
│   ├── cameras/        # Фоны для камер (helipad.png, golden_temple.png, etc.)
│   ├── scenes/         # Общие сцены (boot.png, title.png, gameover.png, victory.png)
│   └── ui/             # UI элементы (door_button.png, light_button.png, etc.)
└── audio/
    ├── ambient/       # Фоновые звуки
    ├── sfx/           # Звуковые эффекты
    └── music/         # Музыка
```

## Именование файлов

### Камеры (assets/images/cameras/)
- `helipad.png` — Вертолётная площадка
- `golden_temple.png` — Золотой храм
- `staff_quarters.png` — Жилая зона
- `greenhouse.png` — Теплица
- `guest_house.png` — Гостевой дом
- `beach_house.png` — Пляжный дом
- `dock.png` — Причал
- `generator.png` — Генератор

### Офис (assets/images/office/)
- `office_bg.png` — Основной фон офиса
- `left_door_closed.png` / `left_door_open.png`
- `right_door_closed.png` / `right_door_open.png`
- `left_light.png` / `right_light.png`
- `office_pan_left.png` / `office_pan_right.png`

### Сцены
- `boot.png`, `title.png`, `gameover.png`, `victory.png`, `pause.png`

### Враги
- `bonnie.png`, `chica.png`, `freddy.png`
- `jumpscare_bonnie.png`, `jumpscare_chica.png`, `jumpscare_freddy.png`

## Рекомендуемые размеры

- **Камеры**: 1280x720 (соотношение 16:9)
- **Офис**: 1280x720 или больше (нужно охватить pan regions)
- **UI**: минимум 44x44px для кнопок
- **Враги**: ~300x300px для jumpscare

## Форматы

- Изображения: PNG (с прозрачностью) или JPEG
- Аудио: OGG (рекомендуется) или MP3