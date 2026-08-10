#!/usr/bin/env pwsh
param(
    [string]$WebDevServerUrl = $env:NT_WEB_DEV_SERVER_URL
)

if (-not $WebDevServerUrl) {
    $WebDevServerUrl = "http://127.0.0.1:3000"
}

# Repo root: this script lives in scripts/
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$WebLog = Join-Path $env:TEMP "nodetool-electron-vite.log"
$WebErrLog = Join-Path $env:TEMP "nodetool-electron-vite.err.log"
$WebProc = $null

function Cleanup {
    if ($null -ne $WebProc -and -not $WebProc.HasExited) {
        Write-Host "Stopping Vite (PID $($WebProc.Id))..."
        Stop-Process -Id $WebProc.Id -Force -ErrorAction SilentlyContinue
        # npm spawns node children — kill the tree when possible
        Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
            Where-Object { $_.ParentProcessId -eq $WebProc.Id } |
            ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    }
}

trap {
    Cleanup
    exit 1
}

# Conda is only needed for Python nodes. The Unix electron-dev.sh does not
# require it — keep Windows aligned so desktop UI work is not blocked.
# === CUSTOM FORK START: desktop-dev-no-conda-required ===
$CondaActive = $false

if ($env:CONDA_PREFIX) {
    $CondaActive = $true
}

if (-not $CondaActive -and $env:CONDA_DEFAULT_ENV -and $env:CONDA_DEFAULT_ENV -ne "base") {
    $CondaActive = $true
}

if (-not $CondaActive) {
    try {
        $CondaInfo = & conda info --envs 2>$null | Select-String "\*"
        if ($CondaInfo) {
            $CondaActive = $true
        }
    } catch {
        # conda not in PATH or command failed
    }
}

if ($CondaActive) {
    Write-Host "Detected conda environment: $($env:CONDA_DEFAULT_ENV)"
} else {
    Write-Host "WARN: No active conda environment. Desktop UI will start; Python nodes may fail until you run 'conda activate nodetool'." -ForegroundColor Yellow
}
# === CUSTOM FORK END ===

# === CUSTOM FORK START: desktop-dev-vite-start ===
# Start-Job used to run with the wrong cwd (home dir), so Vite never came up.
# Match electron-dev.sh: spawn npm --prefix web from the repo root.
Write-Host "Starting web Vite server on $WebDevServerUrl..."
Write-Host "  (log: $WebLog)"
Remove-Item $WebLog, $WebErrLog -ErrorAction SilentlyContinue

$npmCmd = $null
$npmCmdInfo = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($npmCmdInfo) {
    $npmCmd = $npmCmdInfo.Source
} else {
    $npmInfo = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmInfo) {
        $npmCmd = $npmInfo.Source
    }
}
if (-not $npmCmd) {
    Write-Error "ERROR: npm not found on PATH."
    exit 1
}

$WebProc = Start-Process `
    -FilePath $npmCmd `
    -ArgumentList @("--prefix", "web", "run", "dev") `
    -WorkingDirectory $RepoRoot `
    -PassThru `
    -NoNewWindow `
    -RedirectStandardOutput $WebLog `
    -RedirectStandardError $WebErrLog

Write-Host "Waiting for Vite server..."
$MaxAttempts = 180
$Ready = $false

for ($i = 0; $i -lt $MaxAttempts; $i++) {
    if ($WebProc.HasExited) {
        Write-Error "ERROR: Vite process exited early (code $($WebProc.ExitCode)). Log:"
        if (Test-Path $WebLog) { Get-Content $WebLog | Write-Host }
        if (Test-Path $WebErrLog) { Get-Content $WebErrLog | Write-Host }
        exit 1
    }
    Start-Sleep -Seconds 1
    try {
        $Response = Invoke-WebRequest -Uri $WebDevServerUrl -Method HEAD -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 500) {
            $Ready = $true
            break
        }
    } catch {
        # Server not ready yet
    }
    if (($i + 1) % 15 -eq 0) {
        Write-Host "  still waiting... $($i + 1)s"
    }
}

if (-not $Ready) {
    Write-Error "ERROR: Vite server did not become ready at $WebDevServerUrl."
    if (Test-Path $WebLog) {
        Write-Host "---- Vite stdout ----"
        Get-Content $WebLog | Write-Host
    }
    if (Test-Path $WebErrLog) {
        Write-Host "---- Vite stderr ----"
        Get-Content $WebErrLog | Write-Host
    }
    Cleanup
    exit 1
}
Write-Host "Vite is ready."
# === CUSTOM FORK END ===

Set-Location $RepoRoot

Write-Host "Building Electron main/preload bundle..."
npm --prefix electron run vite:build
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR: Electron build failed."
    Cleanup
    exit 1
}

Write-Host "Starting Electron in dev mode..."
$env:NT_ELECTRON_DEV_MODE = "1"
$env:NT_WEB_DEV_SERVER_URL = $WebDevServerUrl
npm --prefix electron run start:devmode

Cleanup
