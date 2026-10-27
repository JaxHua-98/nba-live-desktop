@echo off
node "%~dp0npm-build-shim.cjs" %*
exit /b %errorlevel%
