@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

REM start-desktop.bat
REM   Run NodeTool as the Electron desktop app (dev mode).
REM   Folder buttons and other desktop APIs work here — unlike start.bat (Brave).
REM
REM   Double-click or: start-desktop.bat
REM   Re-run to stop listeners on :3000 / :7777 and start again.

echo NodeTool start-desktop.bat
echo.

REM Prefer portable Node 22 if present (no Admin / leaves system Node alone).
if exist "%LOCALAPPDATA%\nodejs-22.22.1\node.exe" (
  set "PATH=%LOCALAPPDATA%\nodejs-22.22.1;%PATH%"
)

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

node scripts\ensure-dev-env.mjs
if errorlevel 1 goto :fail

if not exist node_modules (
  echo ==^> Installing dependencies ^(first run only, can take a few minutes^)
  REM Desktop needs the Electron binary — do NOT set ELECTRON_SKIP_BINARY_DOWNLOAD.
  set "npm_config_onnxruntime_node_install_cuda=skip"
  call npm install --no-audit --fund=false
  if errorlevel 1 (
    echo ERROR: npm install failed. See CLAUDE.md Common Pitfalls.
    goto :fail
  )
  echo ok dependencies installed
  echo.
)

REM Electron binary is often missing when start.bat installed with SKIP_BINARY_DOWNLOAD.
if not exist node_modules\electron\path.txt (
  echo ==^> Downloading Electron binary ^(required for desktop^)
  call node node_modules\electron\install.js
  if errorlevel 1 (
    echo ERROR: Electron binary download failed.
    echo Try: npm install electron --workspace=electron --no-audit
    goto :fail
  )
  echo ok Electron binary ready
  echo.
)

if exist node_modules\better-sqlite3 if not exist node_modules\better-sqlite3\build (
  echo ==^> Rebuilding better-sqlite3
  call npm run rebuild:native
  if errorlevel 1 echo WARN: native rebuild failed - database features may not work
  echo.
)

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

REM Vite for electron:dev defaults to :3000; API defaults to :7777.
if "%PORT%"=="" set "PORT=7777"
if "%WEB_PORT%"=="" set "WEB_PORT=3000"
if "%NT_WEB_DEV_SERVER_URL%"=="" set "NT_WEB_DEV_SERVER_URL=http://127.0.0.1:!WEB_PORT!"

echo ==^> Stopping anything already on ports !PORT! and !WEB_PORT! ^(restart^)
call :free_port !PORT!
call :free_port !WEB_PORT!
REM Prior NodeTool Electron only — never kill other Electron apps (e.g. StoryBoards).
call :kill_repo_electron

echo ==^> Starting Electron desktop app ^(dev^)
echo    Web UI:  !NT_WEB_DEV_SERVER_URL!
echo    API:     http://127.0.0.1:!PORT!
echo    Ctrl-C to stop.
echo.
echo    Optional: conda activate nodetool  ^(only needed for Python nodes^)
echo.

call npm run electron:dev
goto :end

:free_port
set "FREE_PORT=%~1"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":!FREE_PORT! .*LISTENING" 2^>nul') do (
  if not "%%p"=="0" (
    echo    killing PID %%p on port !FREE_PORT!
    taskkill /F /PID %%p >nul 2>&1
  )
)
goto :eof

:kill_repo_electron
REM Match electron.exe whose CommandLine includes this repo path only.
set "NT_REPO=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=$env:NT_REPO.TrimEnd('\'); Get-CimInstance Win32_Process -Filter \"Name = 'electron.exe'\" | Where-Object { $_.CommandLine -and $_.CommandLine.IndexOf($root,[StringComparison]::OrdinalIgnoreCase) -ge 0 } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1
goto :eof

:fail
echo.
echo Press any key to close...
pause >nul
exit /b 1

:end
echo %cmdcmdline% | find /i "%~f0" >nul
if not errorlevel 1 (
  echo.
  echo Press any key to close...
  pause >nul
)
exit /b 0
