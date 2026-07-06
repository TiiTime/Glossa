@echo off
title Glossa Installer
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; & '%~dp0Install-Glossa.ps1'"
if errorlevel 1 pause
