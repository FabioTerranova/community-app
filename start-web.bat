@echo off
cd /d "%~dp0"
echo Startet die App als Browser-Vorschau am PC (kein iPhone noetig)...
echo Der Browser oeffnet sich automatisch. Beenden mit Strg+C.
echo.
npm run web
pause
