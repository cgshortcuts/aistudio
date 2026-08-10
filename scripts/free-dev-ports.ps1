$ports = 7777, 3000
foreach ($port in $ports) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $procId = $c.OwningProcess
    Write-Host "Killing PID $procId on port $port"
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}
Start-Sleep -Seconds 2
$left = Get-NetTCPConnection -LocalPort 7777,3000 -State Listen -ErrorAction SilentlyContinue
if ($left) { $left | Format-Table LocalPort, OwningProcess } else { Write-Host "Ports free" }
