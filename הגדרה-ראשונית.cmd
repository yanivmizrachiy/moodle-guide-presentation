@echo off
chcp 65001 >nul
title Moodle guide - first time setup
cd /d "%~dp0"

rem  Why this file exists:
rem  A .ps1 does not run when you double-click it on Windows - it opens in an
rem  editor and looks like nothing happened. That is what blocked the owner.
rem  First-time setup therefore goes through a .cmd, like the report launcher.
rem
rem  Everything below "chcp 65001" is ASCII on purpose. cmd re-reads the batch
rem  file byte by byte, and changing the code page mid-file shifts that read
rem  position: Hebrew lines placed after it get chopped and their fragments are
rem  executed as commands. An earlier version of this file did exactly that.
rem  All Hebrew output belongs to the PowerShell script, which handles UTF-8.
rem
rem  The .ps1 is located by extension rather than by name for the same reason -
rem  a Hebrew filename passed as an argument here can be mangled. The SSOT audit
rem  enforces that exactly one .ps1 sits at the repo root.
rem
rem  No parenthesised if-blocks either: a value containing ")" breaks one.

set "LAUNCH=$f = @(Get-ChildItem -LiteralPath $PWD -Filter *.ps1); if ($f.Count -ne 1) { Write-Host 'Setup script not found next to this file.' -ForegroundColor Red; exit 1 }; & $f[0].FullName"

set "PS=powershell"
where pwsh >nul 2>nul && set "PS=pwsh"

%PS% -NoProfile -ExecutionPolicy Bypass -Command "%LAUNCH%"

if not errorlevel 1 goto :eof
echo.
echo ------------------------------------------------------------
echo  Setup did not finish. The reason is printed above.
echo  Press Enter to close.
pause >nul
