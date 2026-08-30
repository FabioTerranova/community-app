@echo off
REM Startet Claude Code im Projektordner "community-app".
REM Doppelklick oder im Terminal "claude.bat" ausfuehren.

REM In den Ordner wechseln, in dem diese .bat liegt (egal von wo gestartet):
cd /d "%~dp0"

title Claude Code - community-app
echo ==================================================
echo   Claude Code - Projekt: community-app
echo   Ordner: %CD%
echo ==================================================
echo.

REM Claude Code starten (etwaige Zusatz-Argumente werden durchgereicht):
REM WICHTIG: echtes Programm mit vollem Pfad aufrufen, sonst startet sich
REM diese Datei (heisst ja "claude.bat") in einer Dauerschleife selbst.
call "%APPDATA%\npm\claude.cmd" %*
