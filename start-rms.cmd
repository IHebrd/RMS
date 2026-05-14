@echo off
title RMS - Lancement Backend + Frontend
color 0A

echo.
echo  ============================================
echo   RMS - Reclamation Management System
echo   Demarrage Backend + Frontend...
echo  ============================================
echo.

:: Lancement du backend
echo  [1/2] Demarrage du Backend (port 5000)...
start "RMS Backend" cmd /k "cd /d C:\Users\Iheb\OneDrive\Desktop\RMS\backend && npm run dev"

:: Attendre 2 secondes pour laisser le backend demarrer
timeout /t 2 /nobreak > nul

:: Lancement du frontend
echo  [2/2] Demarrage du Frontend (port 3000)...
start "RMS Frontend" cmd /k "cd /d C:\Users\Iheb\OneDrive\Desktop\RMS\frontend && npm start"

echo.
echo  ============================================
echo   Les deux serveurs sont en cours de demarrage.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo  ============================================
echo.
pause
