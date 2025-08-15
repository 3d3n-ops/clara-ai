# Fix Railway Deployment Script
# This script helps fix the Node.js detection issue

Write-Host "🔧 Fixing Railway Deployment Configuration" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check current setup
Write-Host "`n📋 Current Configuration Check:" -ForegroundColor Cyan

if (Test-Path "railway.json") {
    Write-Host "✅ Found root railway.json" -ForegroundColor Green
} else {
    Write-Host "❌ No root railway.json found" -ForegroundColor Red
}

if (Test-Path "backend/railway.json") {
    Write-Host "✅ Found backend/railway.json" -ForegroundColor Green
} else {
    Write-Host "❌ No backend/railway.json found" -ForegroundColor Red
}

if (Test-Path "backend/Dockerfile") {
    Write-Host "✅ Found backend/Dockerfile" -ForegroundColor Green
} else {
    Write-Host "❌ No backend/Dockerfile found" -ForegroundColor Red
}

if (Test-Path "package.json") {
    Write-Host "⚠️  Found package.json (this is causing the Node.js detection)" -ForegroundColor Yellow
} else {
    Write-Host "✅ No package.json in root (good)" -ForegroundColor Green
}

# Provide solutions
Write-Host "`n🚀 Solutions to Fix Railway Deployment:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nOption 1: Use Railway Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "1. Go to your Railway project dashboard" -ForegroundColor White
Write-Host "2. Go to Settings → General" -ForegroundColor White
Write-Host "3. Set 'Root Directory' to: backend" -ForegroundColor White
Write-Host "4. Redeploy your project" -ForegroundColor White

Write-Host "`nOption 2: Use Railway CLI" -ForegroundColor Yellow
Write-Host "1. Install Railway CLI: npm i -g @railway/cli" -ForegroundColor White
Write-Host "2. Run: railway login" -ForegroundColor White
Write-Host "3. Run: railway init" -ForegroundColor White
Write-Host "4. Select your repository" -ForegroundColor White
Write-Host "5. When asked for root directory, enter: backend" -ForegroundColor White
Write-Host "6. Run: railway up" -ForegroundColor White

Write-Host "`nOption 3: Create a New Project" -ForegroundColor Yellow
Write-Host "1. Create a new Railway project" -ForegroundColor White
Write-Host "2. Choose 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "3. Select your clara-ai repository" -ForegroundColor White
Write-Host "4. Set root directory to 'backend' during setup" -ForegroundColor White

Write-Host "`n🔍 What's Happening:" -ForegroundColor Cyan
Write-Host "- Railway is detecting your root directory as a Node.js project" -ForegroundColor White
Write-Host "- This happens because package.json is in the root" -ForegroundColor White
Write-Host "- We need to tell Railway to look at the 'backend' directory instead" -ForegroundColor White
Write-Host "- The backend directory contains your Python FastAPI app" -ForegroundColor White

Write-Host "`n✅ Expected Result After Fix:" -ForegroundColor Green
Write-Host "- Railway will detect Python/Docker instead of Node.js" -ForegroundColor White
Write-Host "- Build will use your backend/Dockerfile" -ForegroundColor White
Write-Host "- Deployment will start your FastAPI server" -ForegroundColor White

Write-Host "`n🎯 Quick Test After Deployment:" -ForegroundColor Cyan
Write-Host "curl https://your-app.railway.app/health" -ForegroundColor White
Write-Host "Expected: JSON response with status 'healthy'" -ForegroundColor White

Write-Host "`n💡 Pro Tip:" -ForegroundColor Cyan
Write-Host "After fixing this, your deployments will be much faster!" -ForegroundColor White
Write-Host "Railway will cache your Python dependencies properly." -ForegroundColor White
