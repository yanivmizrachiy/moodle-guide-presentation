@echo off
chcp 65001 >nul
title כמה נכנסו למדריך
cd /d "%~dp0"
call npm run --silent analytics
echo.
echo ------------------------------------------------------------
echo  לסגירה - הקש Enter
pause >nul
