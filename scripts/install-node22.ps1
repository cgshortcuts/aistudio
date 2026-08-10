$ver = "22.22.1"
$dest = Join-Path $env:LOCALAPPDATA "nodejs-$ver"
$zip = Join-Path $env:TEMP "node-v$ver-win-x64.zip"
$url = "https://nodejs.org/dist/v$ver/node-v$ver-win-x64.zip"
$nodeExe = Join-Path $dest "node.exe"

if (Test-Path $nodeExe) {
  Write-Host "Already present: $dest"
  & $nodeExe -v
  exit 0
}

Write-Host "Downloading $url"
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Write-Host "Extracting..."
$extractRoot = Join-Path $env:LOCALAPPDATA "node-extract-tmp"
if (Test-Path $extractRoot) { Remove-Item $extractRoot -Recurse -Force }
New-Item -ItemType Directory -Path $extractRoot | Out-Null
Expand-Archive -Path $zip -DestinationPath $extractRoot -Force
$extracted = Join-Path $extractRoot "node-v$ver-win-x64"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Move-Item $extracted $dest
Remove-Item $extractRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Write-Host "Installed to $dest"
& $nodeExe -v
& (Join-Path $dest "npm.cmd") -v
