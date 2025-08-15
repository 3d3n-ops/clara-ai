# Setup Railway Deployment Script
# This script helps set up the correct Railway deployment

Write-Host "🚂 Setting up Railway Deployment for Clara AI Backend" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green

Write-Host "`n🔍 Current Issue:" -ForegroundColor Red
Write-Host "Railway is not using the backend directory as root, causing Docker build to fail." -ForegroundColor White
Write-Host "Error: requirements.txt not found" -ForegroundColor White

Write-Host "`n✅ Solution Steps:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

Write-Host "`nStep 1: Delete Current Railway Project" -ForegroundColor Yellow
Write-Host "1. Go to Railway dashboard" -ForegroundColor White
Write-Host "2. Delete your current project" -ForegroundColor White
Write-Host "3. We'll create a new one with correct settings" -ForegroundColor White

Write-Host "`nStep 2: Create New Railway Project" -ForegroundColor Yellow
Write-Host "1. Click 'New Project'" -ForegroundColor White
Write-Host "2. Select 'Deploy from GitHub repo'" -ForegroundColor White
Write-Host "3. Choose your clara-ai repository" -ForegroundColor White
Write-Host "4. IMPORTANT: Set 'Root Directory' to: backend" -ForegroundColor White
Write-Host "5. Click 'Deploy Now'" -ForegroundColor White

Write-Host "`nStep 3: Verify Configuration" -ForegroundColor Yellow
Write-Host "After deployment starts, you should see:" -ForegroundColor White
Write-Host "- Python 3.11-slim base image" -ForegroundColor White
Write-Host "- Installing Python dependencies" -ForegroundColor White
Write-Host "- NOT Node.js/pnpm errors" -ForegroundColor White

Write-Host "`n🔧 Alternative: Use Railway CLI" -ForegroundColor Cyan
Write-Host "If the dashboard method doesn't work:" -ForegroundColor White
Write-Host "1. Install: npm i -g @railway/cli" -ForegroundColor White
Write-Host "2. Run: railway login" -ForegroundColor White
Write-Host "3. Run: railway init" -ForegroundColor White
Write-Host "4. Select your repository" -ForegroundColor White
Write-Host "5. When asked for root directory, type: backend" -ForegroundColor White
Write-Host "6. Run: railway up" -ForegroundColor White

Write-Host "`n📋 What Should Happen:" -ForegroundColor Green
Write-Host "✅ Railway detects Python/Docker project" -ForegroundColor White
Write-Host "✅ Builds from backend/Dockerfile" -ForegroundColor White
Write-Host "✅ Finds backend/requirements.txt" -ForegroundColor White
Write-Host "✅ Installs Python dependencies" -ForegroundColor White
Write-Host "✅ Starts FastAPI server" -ForegroundColor White

Write-Host "`n🎯 Test After Deployment:" -ForegroundColor Cyan
Write-Host "curl https://your-app.railway.app/health" -ForegroundColor White
Write-Host "Expected: JSON response with status 'healthy'" -ForegroundColor White

Write-Host "`n⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "- Make sure to set 'Root Directory' to 'backend' during project creation" -ForegroundColor White
Write-Host "- Don't use the default root directory setting" -ForegroundColor White
Write-Host "- The backend directory contains all necessary files" -ForegroundColor White

Write-Host "`n💡 Pro Tip:" -ForegroundColor Cyan
Write-Host "If you still have issues, try creating a new GitHub repository" -ForegroundColor White
Write-Host "with only the backend directory contents." -ForegroundColor White

Write-Host "`n🚀 Ready to deploy! Follow the steps above." -ForegroundColor Green
