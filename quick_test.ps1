# Quick Modal Endpoints Test
# Simple script to test basic endpoint connectivity

$BaseUrl = "https://d3n-ops--clara-voice-agent"

Write-Host "🚀 Quick Modal Endpoints Test" -ForegroundColor White
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray

# Test Health Check
Write-Host "`n🔍 Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl-health-check.modal.run" -Method GET
    Write-Host "✅ Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Worker Running: $($response.worker_running)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Connection
Write-Host "`n🔍 Testing Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl-test-connection.modal.run" -Method POST -Body "{}" -ContentType "application/json"
    Write-Host "✅ Connection Test: SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Connection Test: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Quick test completed!" -ForegroundColor Green
Write-Host "Run '.\test_modal_endpoints.ps1' for comprehensive testing" -ForegroundColor Cyan 