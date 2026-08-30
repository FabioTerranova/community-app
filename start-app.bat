@echo off
cd /d "%~dp0"
echo Starte community-app (Expo)...
echo WICHTIG: iPhone-Hotspot an, PC mit dem Hotspot verbunden -
echo          dann sind iPhone und PC im selben Netz.
echo QR-Code erscheint gleich unten - mit der iPhone-Kamera scannen.
echo Fenster offen lassen, solange du testest. Beenden mit Strg+C.
echo.
npx expo start
echo.
echo ============================================================
echo  Server beendet oder abgestuerzt. Fenster bleibt offen,
echo  damit du die Meldung oben lesen kannst.
echo ============================================================
pause
