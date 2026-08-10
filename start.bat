@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

REM start.bat            API + web UI on :17337 (opens Brave)
REM start.bat server     API only on :7777
REM start.bat full       same as default (API + web UI, opens Brave)
REM start.bat web        web UI only (opens Brave)
REM start.bat check      typecheck + lint + tests
REM start.bat doctor     env report only
REM set PORT=8080 / WEB_PORT=3000 first to override ports

echo NodeTool start.bat
echo.

REM Prefer portable Node 22 if present (no Admin / leaves system Node alone).
if exist "%LOCALAPPDATA%\nodejs-22.22.1\node.exe" (
  set "PATH=%LOCALAPPDATA%\nodejs-22.22.1;%PATH%"
)

set "MODE=%~1"
if "%MODE%"=="" set "MODE=full"

if /i "%MODE%"=="server" goto :mode_ok
if /i "%MODE%"=="full" goto :mode_ok
if /i "%MODE%"=="web" goto :mode_ok
if /i "%MODE%"=="check" goto :mode_ok
if /i "%MODE%"=="doctor" goto :mode_ok
echo ERROR: Unknown mode '%MODE%'. Use: server ^| full ^| web ^| check ^| doctor
goto :fail

:mode_ok

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found.
  echo Install Node 22.22.1 from https://nodejs.org
  echo Or run: powershell -ExecutionPolicy Bypass -File scripts\install-node22.ps1
  goto :fail
)

for /f "delims=" %%v in ('node -p "process.versions.node.split('.')[0]" 2^>nul') do set "NODE_MAJOR=%%v"
if not "!NODE_MAJOR!"=="22" (
  echo ERROR: Node 22.x required.
  echo Found:
  node -v
  echo.
  echo Fix ^(no Admin needed^):
  echo   powershell -ExecutionPolicy Bypass -File scripts\install-node22.ps1
  echo Then run this bat again.
  goto :fail
)

if /i "%MODE%"=="doctor" goto :doctor

node scripts\ensure-dev-env.mjs
if errorlevel 1 goto :fail

if not exist node_modules (
  echo ==^> Installing dependencies ^(first run only, can take a few minutes^)
  set "ELECTRON_SKIP_BINARY_DOWNLOAD=1"
  set "npm_config_onnxruntime_node_install_cuda=skip"
  call npm install --no-audit --fund=false
  if errorlevel 1 (
    echo ERROR: npm install failed. See CLAUDE.md Common Pitfalls.
    goto :fail
  )
  echo ok dependencies installed
  echo.
)

if /i "%MODE%"=="web" goto :after_native
if exist node_modules\better-sqlite3 if not exist node_modules\better-sqlite3\build (
  echo ==^> Rebuilding better-sqlite3
  call npm run rebuild:native
  if errorlevel 1 echo WARN: native rebuild failed - database features may not work
  echo.
)
:after_native

if /i "%MODE%"=="web" goto :after_build
if not exist packages\base-nodes\dist (
  echo ==^> Building backend packages ^(first run only^)
  call npm run build:packages
  if errorlevel 1 (
    echo ERROR: build:packages failed
    goto :fail
  )
  echo ok packages built
  echo.
)
:after_build

if "%PORT%"=="" set "PORT=7777"
REM Distinct from the usual Vite/React :3000 so other apps do not collide.
if "%WEB_PORT%"=="" set "WEB_PORT=17337"
set "APP_URL=http://127.0.0.1:!WEB_PORT!"

if /i "%MODE%"=="server" (
  echo ==^> Starting API on http://127.0.0.1:!PORT!
  echo    Health: http://127.0.0.1:!PORT!/health
  echo    Ctrl-C to stop.
  echo.
  call npm run dev:server
  goto :end
)

if /i "%MODE%"=="full" (
  echo ==^> Starting API ^(:!PORT!^) and web UI ^(!APP_URL!^)
  echo    Ctrl-C to stop.
  echo.
  call :open_brave "!APP_URL!"
  call npm run dev
  goto :end
)

if /i "%MODE%"=="web" (
  echo ==^> Starting web UI on !APP_URL!
  echo    Ctrl-C to stop.
  echo.
  call :open_brave "!APP_URL!"
  call npm run dev:web
  goto :end
)

if /i "%MODE%"=="check" (
  echo ==^> Typechecking
  call npm run typecheck
  if errorlevel 1 goto :fail
  echo.
  echo ==^> Linting
  call npm run lint
  if errorlevel 1 goto :fail
  echo.
  echo ==^> Testing
  call npm run test
  if errorlevel 1 goto :fail
  echo.
  echo ok typecheck, lint, and tests all pass
  goto :end
)

goto :end

:doctor
if "%PORT%"=="" set "PORT=7777"
echo ==^> Environment
echo   node:
node -v
echo   npm:
npm -v
if exist .env (echo   .env            present) else (echo   .env            missing - created on next run)
if exist node_modules (echo   node_modules    present) else (echo   node_modules    missing - installed on next run)
if exist packages\base-nodes\dist (echo   packages built  yes) else (echo   packages built  no - built on next run)
if exist node_modules\better-sqlite3\build (echo   better-sqlite3  built) else (echo   better-sqlite3  not built)
for /f "delims=" %%s in ('node -e "const net=require('net');const s=net.createConnection({host:'127.0.0.1',port:Number(process.env.PORT||7777)});s.setTimeout(1000);const done=v=>{console.log(v);s.destroy();process.exit(0)};s.on('connect',()=>done('in use'));s.on('timeout',()=>done('free'));s.on('error',()=>done('free'));"') do echo   port !PORT!      %%s
goto :end

REM Wait until the URL answers, then open Brave (Vite starts after the API is ready).
:open_brave
set "BRAVE_EXE="
if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
  set "BRAVE_EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
)
if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (
  set "BRAVE_EXE=%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"
)
if not defined BRAVE_EXE (
  echo WARN: Brave not found - open %~1 yourself
  goto :eof
)
echo    Waiting for %~1 then opening Brave...
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$u='%~1'; $b='!BRAVE_EXE!'; for($i=0;$i -lt 180;$i++){ try { $r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -ge 200){ break } } catch {} ; Start-Sleep -Seconds 1 }; Start-Process -FilePath $b -ArgumentList $u"
goto :eof

:fail
echo.
echo Press any key to close...
pause >nul
exit /b 1

:end
REM If double-clicked (cmdcmdline contains this bat), pause so the window stays open
echo %cmdcmdline% | find /i "%~f0" >nul
if not errorlevel 1 (
  echo.
  echo Press any key to close...
  pause >nul
)
exit /b 0
