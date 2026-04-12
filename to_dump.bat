@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ============================================================
::  НАСТРОЙКИ — меняй здесь
:: ============================================================
set "SOURCE_DIR=C:\Users\DellLivingRoom\Documents\repos vs code\five night on dark island\src"
set "EXTENSION=.js"
set "OUTPUT=output.txt"

:: ============================================================
::  ЧЁРНЫЙ СПИСОК ФАЙЛОВ (точные имена)
:: ============================================================
set "BL_FILES=index.ts vite-env.d.ts setupTests.ts lootTables.ts "

:: ============================================================
::  ЧЁРНЫЙ СПИСОК ПАПОК
:: ============================================================
set "BL_DIRS=node_modules dist build .git __pycache__ .next coverage"

:: ============================================================
::  ЧЁРНЫЙ СПИСОК ПАТТЕРНОВ (части имени файла)
:: ============================================================
set "BL_PATTERNS=.test.ts .spec.ts .d.ts .min.ts"

:: ============================================================

if exist "%OUTPUT%" del "%OUTPUT%"

set /a COUNT=0
set /a SKIPPED=0

echo [Сканирование: %SOURCE_DIR%]
echo.

for /r "%SOURCE_DIR%" %%F in (*%EXTENSION%) do (
    set "FILEPATH=%%F"
    set "FILENAME=%%~nxF"
    set "RELPATH=%%~dpnxF"
    set "SKIP=0"

    :: --- Проверка папок в чёрном списке ---
    for %%D in (%BL_DIRS%) do (
        echo !FILEPATH! | findstr /i /c:"\\%%D\\" >nul 2>&1
        if not errorlevel 1 set "SKIP=1"
    )

    :: --- Проверка имён файлов в чёрном списке ---
    for %%B in (%BL_FILES%) do (
        if /i "!FILENAME!"=="%%B" set "SKIP=1"
    )

    :: --- Проверка паттернов в чёрном списке ---
    for %%P in (%BL_PATTERNS%) do (
        echo !FILENAME! | findstr /i /c:"%%P" >nul 2>&1
        if not errorlevel 1 set "SKIP=1"
    )

    if "!SKIP!"=="1" (
        echo [ПРОПУЩЕН] !FILENAME!
        set /a SKIPPED+=1
    ) else (
        :: Получаем относительный путь
        set "REL=!FILEPATH:%SOURCE_DIR%\=!"

        echo ### !REL! >> "%OUTPUT%"
        echo ------------------------------------------------------------ >> "%OUTPUT%"
        type "%%F" >> "%OUTPUT%"
        echo. >> "%OUTPUT%"
        echo. >> "%OUTPUT%"

        echo [OK] !REL!
        set /a COUNT+=1
    )
)

echo.
echo ============================================================
echo  Готово!
echo  Добавлено файлов : %COUNT%
echo  Пропущено        : %SKIPPED%
echo  Выходной файл    : %OUTPUT%
echo ============================================================
pause