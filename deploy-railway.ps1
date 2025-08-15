# Railway Deployment Helper Script for Clara AI Backend
# This script helps prepare and test your Railway deployment

Write-Host "🚂 Railway Deployment Helper for Clara AI Backend" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "backend/Dockerfile")) {
    Write-Host "❌ Error: backend/Dockerfile not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found backend/Dockerfile" -ForegroundColor Green

# Check if railway.json exists
if (Test-Path "railway.json") {
    Write-Host "✅ Found railway.json configuration" -ForegroundColor Green
} else {
    Write-Host "⚠️  railway.json not found, but Railway will auto-detect your Dockerfile" -ForegroundColor Yellow
}

# Check environment variables
Write-Host "`n📋 Required Environment Variables Check:" -ForegroundColor Cyan

$requiredVars = @(
    "OPENAI_API_KEY",
    "PINECONE_API_KEY", 
    "PINECONE_ENVIRONMENT",
    "PINECONE_INDEX_NAME",
    "CLERK_SECRET_KEY"
)

$optionalVars = @(
    "DATABASE_URL",
    "REDIS_URL",
    "LIVEKIT_URL",
    "LIVEKIT_API_KEY",
    "LIVEKIT_API_SECRET",
    "DEEPGRAM_API_KEY",
    "CARTESIA_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY"
)

Write-Host "Required variables:" -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    Write-Host "  - $var" -ForegroundColor White
}

Write-Host "`nOptional variables (if using these features):" -ForegroundColor Yellow
foreach ($var in $optionalVars) {
    Write-Host "  - $var" -ForegroundColor White
}

# Test local Docker build
Write-Host "`n🔨 Testing local Docker build..." -ForegroundColor Cyan
try {
    Set-Location backend
    docker build -t clara-backend-test .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker build successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker build failed. Check the errors above." -ForegroundColor Red
    }
    Set-Location ..
} catch {
    Write-Host "❌ Docker build failed: $_" -ForegroundColor Red
}

# Test local server startup
Write-Host "`n🚀 Testing local server startup..." -ForegroundColor Cyan
try {
    Set-Location backend
    # Start server in background
    $serverProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "backend_server:app", "--host", "0.0.0.0", "--port", "8000" -PassThru -WindowStyle Hidden
    
    # Wait a moment for server to start
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 10
        Write-Host "✅ Local server health check passed!" -ForegroundColor Green
        Write-Host "   Status: $($response.status)" -ForegroundColor White
    } catch {
        Write-Host "❌ Local server health check failed: $_" -ForegroundColor Red
    }
    
    # Stop the server
    Stop-Process -Id $serverProcess.Id -Force
    Set-Location ..
} catch {
    Write-Host "❌ Local server test failed: $_" -ForegroundColor Red
}

# Deployment instructions
Write-Host "`n📖 Railway Deployment Instructions:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "1. Go to https://railway.app" -ForegroundColor White
Write-Host "2. Click 'New Project'" -ForegroundColor White
Write-Host "3. Select 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "4. Choose your clara-ai repository" -ForegroundColor White
Write-Host "5. Railway will auto-detect your backend/Dockerfile" -ForegroundColor White
Write-Host "6. Add all required environment variables in Railway dashboard" -ForegroundColor White
Write-Host "7. Deploy!" -ForegroundColor White

Write-Host "`n🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "- Railway Dashboard: https://railway.app" -ForegroundColor Blue
Write-Host "- Railway Docs: https://docs.railway.app" -ForegroundColor Blue
Write-Host "- Railway Discord: https://discord.gg/railway" -ForegroundColor Blue

Write-Host "`n💡 Tips:" -ForegroundColor Cyan
Write-Host "- Your first deployment may take 5-10 minutes" -ForegroundColor White
Write-Host "- Check Railway logs if deployment fails" -ForegroundColor White
Write-Host "- Update your frontend API URL after deployment" -ForegroundColor White
Write-Host "- Test all endpoints after deployment" -ForegroundColor White

Write-Host "`n🎉 Ready to deploy to Railway!" -ForegroundColor Green
