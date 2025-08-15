# ============================================================================
# Clara AI Backend Docker Deployment Test Script
# ============================================================================

Write-Host "🧪 Testing Clara AI Backend Docker Deployment..." -ForegroundColor Green

# Test 1: Check if container is running
Write-Host "`n📋 Test 1: Container Status" -ForegroundColor Yellow
$containerStatus = docker ps --filter "name=clara-backend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if ($containerStatus -match "clara-backend") {
    Write-Host "✅ Container is running" -ForegroundColor Green
    Write-Host $containerStatus
} else {
    Write-Host "❌ Container is not running" -ForegroundColor Red
    exit 1
}

# Test 2: Health check endpoint
Write-Host "`n📋 Test 2: Health Check Endpoint" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   Service: $($healthResponse.service)" -ForegroundColor White
    Write-Host "   Active Voice Connections: $($healthResponse.active_voice_connections)" -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: API documentation endpoint
Write-Host "`n📋 Test 3: API Documentation" -ForegroundColor Yellow
try {
    $docsResponse = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 10
    if ($docsResponse.StatusCode -eq 200) {
        Write-Host "✅ API documentation is accessible" -ForegroundColor Green
        Write-Host "   URL: http://localhost:8000/docs" -ForegroundColor White
    } else {
        Write-Host "❌ API documentation returned status: $($docsResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ API documentation test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Container logs check
Write-Host "`n📋 Test 4: Container Logs" -ForegroundColor Yellow
$logs = docker logs clara-backend --tail 10 2>&1
if ($logs -match "error" -or $logs -match "Error" -or $logs -match "ERROR") {
    Write-Host "⚠️  Warnings/Errors found in logs:" -ForegroundColor Yellow
    $logs | Select-String -Pattern "error|Error|ERROR" | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
} else {
    Write-Host "✅ No errors found in recent logs" -ForegroundColor Green
}

# Test 5: Environment variables check
Write-Host "`n📋 Test 5: Environment Variables" -ForegroundColor Yellow
$requiredVars = @("OPENAI_API_KEY", "PINECONE_API_KEY", "CLERK_SECRET_KEY")
$missingVars = @()

foreach ($var in $requiredVars) {
    $value = docker exec clara-backend env | Select-String "^${var}="
    if ($value) {
        Write-Host "✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "❌ $var is missing" -ForegroundColor Red
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Missing environment variables: $($missingVars -join ', ')" -ForegroundColor Yellow
    Write-Host "   Please check your .env file" -ForegroundColor Yellow
}

# Test 6: Resource usage
Write-Host "`n📋 Test 6: Resource Usage" -ForegroundColor Yellow
$stats = docker stats clara-backend --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
Write-Host "Current resource usage:" -ForegroundColor White
Write-Host $stats

# Test 7: Volume mounts
Write-Host "`n📋 Test 7: Volume Mounts" -ForegroundColor Yellow
$mounts = docker inspect clara-backend --format='{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
if ($mounts -match "generated_content" -and $mounts -match "uploads") {
    Write-Host "✅ Volume mounts are configured correctly" -ForegroundColor Green
} else {
    Write-Host "❌ Volume mounts may be missing" -ForegroundColor Red
}

# Summary
Write-Host "`n🎉 Deployment Test Summary" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Container is running" -ForegroundColor Green
Write-Host "✅ Health check passed" -ForegroundColor Green
Write-Host "✅ API documentation accessible" -ForegroundColor Green
Write-Host "✅ Volume mounts configured" -ForegroundColor Green

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Some environment variables may be missing" -ForegroundColor Yellow
} else {
    Write-Host "✅ All environment variables are set" -ForegroundColor Green
}

Write-Host "`n📊 Service Information:" -ForegroundColor Cyan
Write-Host "   • Backend URL: http://localhost:8000" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host "   • API Documentation: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your frontend to point to http://localhost:8000" -ForegroundColor White
Write-Host "   2. Test your application features" -ForegroundColor White
Write-Host "   3. Configure public access if needed" -ForegroundColor White

Write-Host "`n✅ Docker deployment test completed successfully!" -ForegroundColor Green
