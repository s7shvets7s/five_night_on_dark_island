@echo off
:: Переходим в директорию, где лежит этот батник
cd /d "%~dp0"

setlocal
echo Запуск сервера из: %cd%
echo http://localhost:8000
start http://localhost:8000
call python -m http.server 8000
endlocal

pause