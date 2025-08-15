# PowerShell Launcher for Modal Endpoints Testing
# This script can be run directly from PowerShell or by double-clicking

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Script directory: $ScriptDir" -ForegroundColor Gray

# Check if the main test script exists
$TestScriptPath = Join-Path $ScriptDir "test_modal_endpoints.ps1"
if (-not (Test-Path $TestScriptPath)) {
    Write-Host "❌ ERROR: test_modal_endpoints.ps1 not found at:" -ForegroundColor Red
    Write-Host "   $TestScriptPath" -ForegroundColor Red
    Write-Host "`nPlease ensure all PowerShell scripts are in the same directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found test script at: $TestScriptPath" -ForegroundColor Green
Write-Host "🚀 Launching Modal endpoints test..." -ForegroundColor White

# Change to the script directory and run the test
Set-Location $ScriptDir
& $TestScriptPath

Write-Host "`n🎯 Test execution completed!" -ForegroundColor Green
Read-Host "Press Enter to exit" 