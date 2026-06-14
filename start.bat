@echo off
cd /d "%~dp0"

echo.
echo  ====================================
echo   Resin by Dounia — Demarrage...
echo  ====================================
echo.

:: Lancer le serveur du site (port 5500)
start "Site RBD" /min cmd /c "npx serve -p 5500 ."

:: Lancer le dashboard admin (port 3001)
start "Admin RBD" /min cmd /c "cd admin && node server.js"

:: Attendre que les serveurs soient prets
timeout /t 2 /nobreak > nul

:: Ouvrir les deux dans le navigateur
start "" "http://localhost:5500"
start "" "http://localhost:3001"

echo  Site     : http://localhost:5500
echo  Admin    : http://localhost:3001
echo.
echo  Fermez cette fenetre pour arreter les serveurs.
echo.
pause
