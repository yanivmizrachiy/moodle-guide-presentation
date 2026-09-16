@echo off
chcp 65001 >nul
title Moodle guide - how many visitors
cd /d "%~dp0"

rem  Everything in this file is ASCII on purpose, and this is not cosmetic.
rem  cmd re-reads a batch file byte by byte as it runs, and the "chcp 65001"
rem  above shifts that read position for every multi-byte line after it. This
rem  file used to carry a Hebrew title line here; it chopped the two lines below
rem  into fragments, so the working directory was never set and the report never
rem  ran at all - the window just printed "'run' is not recognized" and closed.
rem  The Hebrew the owner reads is printed by the Node script, which handles
rem  UTF-8 correctly. The SSOT audit now rejects any non-ASCII byte in a .cmd.

call npm run --silent analytics

echo.
echo ------------------------------------------------------------
pause
