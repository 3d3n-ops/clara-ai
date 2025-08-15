# Modal Endpoints Testing Script for Clara Voice Agent
# This script tests all deployed Modal endpoints to ensure they're working correctly

param(
    [string]$BaseUrl = "https://d3n-ops--clara-voice-agent",
    [switch]$Verbose,
    [switch]$SkipWorkerTests
)

# Color functions for better output
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠️ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "ℹ️ $Message" -ForegroundColor Cyan }

# Test result tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Errors = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $TestResults.Total++
    Write-Host "`n🔍 Testing: $Name" -ForegroundColor White
    Write-Host "   URL: $Url" -ForegroundColor Gray
    Write-Host "   Method: $Method" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 30
            ErrorAction = 'Stop'
        }
        
        # Add headers if specified
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        # Add body for POST requests
        if ($Body -and $Method -in @("POST", "PUT", "PATCH")) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Success "$Name - SUCCESS"
        if ($Verbose) {
            Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        }
        $TestResults.Passed++
        return $true
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        Write-Error "$Name - FAILED (HTTP $statusCode)"
        Write-Host "   Error: $errorMessage" -ForegroundColor Red
        
        # Check for specific error types
        switch ($statusCode) {
            401 { Write-Warning "   This suggests an authentication issue" }
            403 { Write-Warning "   This suggests a permissions/authorization issue" }
            405 { Write-Warning "   Method not allowed - check if endpoint supports $Method" }
            500 { Write-Warning "   Internal server error - check Modal logs" }
            502 { Write-Warning "   Bad gateway - Modal service might be starting up" }
            503 { Write-Warning "   Service unavailable - Modal service might be down" }
        }
        
        $TestResults.Failed++
        $TestResults.Errors += @{
            Endpoint = $Name
            StatusCode = $statusCode
            Error = $errorMessage
        }
        return $false
    }
}

function Show-TestSummary {
    Write-Host "`n" + "="*60 -ForegroundColor White
    Write-Host "📊 TEST SUMMARY" -ForegroundColor White
    Write-Host "="*60 -ForegroundColor White
    Write-Host "Total Tests: $($TestResults.Total)" -ForegroundColor White
    Write-Host "Passed: $($TestResults.Passed)" -ForegroundColor Green
    Write-Host "Failed: $($TestResults.Failed)" -ForegroundColor $(if($TestResults.Failed -gt 0) { "Red" } else { "Green" })
    
    if ($TestResults.Errors.Count -gt 0) {
        Write-Host "`n❌ ERRORS DETAILS:" -ForegroundColor Red
        foreach ($error in $TestResults.Errors) {
            Write-Host "   $($error.Endpoint): HTTP $($error.StatusCode) - $($error.Error)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n" + "="*60 -ForegroundColor White
}

# Main testing sequence
Write-Host "🚀 Starting Modal Endpoints Testing" -ForegroundColor White
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# Test 1: Health Check (GET)
Test-Endpoint -Name "Health Check" -Url "$BaseUrl-health-check.modal.run"

# Test 2: Connection Test (POST)
Test-Endpoint -Name "Connection Test" -Url "$BaseUrl-test-connection.modal.run" -Method "POST" -Body "{}"

# Test 3: Start Worker (POST)
if (-not $SkipWorkerTests) {
    Test-Endpoint -Name "Start Worker" -Url "$BaseUrl-start-worker.modal.run" -Method "POST" -Body "{}"
    
    # Wait a moment for worker to start
    Write-Host "`n⏳ Waiting 5 seconds for worker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Test 4: Health Check After Worker Start
    Test-Endpoint -Name "Health Check (Worker Running)" -Url "$BaseUrl-health-check.modal.run"
    
    # Test 5: Webhook Handler (POST)
    $webhookBody = @{
        event = "room_started"
        room = @{
            name = "clara-study-test-user-123"
            sid = "test-room-sid-123"
        }
    } | ConvertTo-Json
    
    Test-Endpoint -Name "Webhook Handler (Room Started)" -Url "$BaseUrl-webhook-handler.modal.run" -Method "POST" -Body $webhookBody
    
    # Test 6: Stop Worker (POST)
    Test-Endpoint -Name "Stop Worker" -Url "$BaseUrl-stop-worker.modal.run" -Method "POST" -Body "{}"
    
    # Wait a moment for worker to stop
    Write-Host "`n⏳ Waiting 3 seconds for worker to stop..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Test 7: Final Health Check
    Test-Endpoint -Name "Health Check (Worker Stopped)" -Url "$BaseUrl-health-check.modal.run"
} else {
    Write-Warning "Skipping worker management tests (use -SkipWorkerTests to run them)"
}

# Test 8: Test with different HTTP methods to check for 405 errors
Write-Host "`n🔍 Testing for 405 Method Not Allowed errors..." -ForegroundColor Yellow

# Test GET on POST-only endpoint
Test-Endpoint -Name "Start Worker (GET method - should fail)" -Url "$BaseUrl-start-worker.modal.run" -Method "GET"

# Test POST on GET-only endpoint  
Test-Endpoint -Name "Health Check (POST method - should fail)" -Url "$BaseUrl-health-check.modal.run" -Method "POST" -Body "{}"

# Show final results
Show-TestSummary

# Provide next steps
Write-Host "`n📋 NEXT STEPS:" -ForegroundColor White
Write-Host "1. Check Modal logs: modal app logs clara-voice-agent" -ForegroundColor Cyan
Write-Host "2. Verify environment variables in Modal secrets" -ForegroundColor Cyan
Write-Host "3. Check LiveKit credentials if connection test failed" -ForegroundColor Cyan
Write-Host "4. Review any 405 errors for endpoint method validation" -ForegroundColor Cyan

if ($TestResults.Failed -gt 0) {
    Write-Host "`n⚠️  Some tests failed. Check the error details above and Modal logs." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n🎉 All tests passed! Your Modal endpoints are working correctly." -ForegroundColor Green
    exit 0
} 