# Modal Deployment Setup Script for Clara Voice Agent (PowerShell)
# This script helps automate the deployment process

Write-Host "🚀 Setting up Modal deployment for Clara Voice Agent..." -ForegroundColor Green

# Check if Modal CLI is installed
try {
    $modalVersion = modal --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Modal CLI is already installed" -ForegroundColor Green
    } else {
        throw "Modal not found"
    }
} catch {
    Write-Host "📦 Installing Modal CLI..." -ForegroundColor Yellow
    pip install modal
}

# Check if user is authenticated
Write-Host "🔐 Checking Modal authentication..." -ForegroundColor Yellow
try {
    modal app list 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "✅ Modal authentication confirmed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Please run 'modal setup' to authenticate with Modal" -ForegroundColor Red
    Write-Host "   Then run this script again" -ForegroundColor Red
    exit 1
}

# Create secrets if they don't exist
Write-Host "🔑 Setting up Modal secrets..." -ForegroundColor Yellow

# Check if secrets exist
try {
    $secrets = modal secret list 2>$null
    if ($secrets -match "clara-voice-agent-secrets") {
        Write-Host "✅ Modal secrets already exist" -ForegroundColor Green
    } else {
        throw "Secrets not found"
    }
} catch {
    Write-Host "📝 Creating Modal secrets..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please add the following secrets to your Modal dashboard:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Secret Name: clara-voice-agent-secrets" -ForegroundColor White
    Write-Host "Required Environment Variables:" -ForegroundColor White
    Write-Host "  - LIVEKIT_URL" -ForegroundColor Gray
    Write-Host "  - LIVEKIT_API_KEY" -ForegroundColor Gray
    Write-Host "  - LIVEKIT_API_SECRET" -ForegroundColor Gray
    Write-Host "  - OPENAI_API_KEY" -ForegroundColor Gray
    Write-Host "  - CARTESIA_API_KEY" -ForegroundColor Gray
    Write-Host "  - DEEPGRAM_API_KEY" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Optional:" -ForegroundColor White
    Write-Host "  - RAG_ENGINE_URL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Go to: https://modal.com/secrets" -ForegroundColor Cyan
    Write-Host "Create a new secret named 'clara-voice-agent-secrets'" -ForegroundColor Cyan
    Write-Host "Add all the required environment variables" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter when you've created the secrets"
}

# Deploy the application
Write-Host "🏗️  Deploying Clara Voice Agent to Modal..." -ForegroundColor Yellow
modal deploy modal_app.py

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the FastAPI endpoint URL from the deployment output" -ForegroundColor White
Write-Host "2. Go to your LiveKit dashboard" -ForegroundColor White
Write-Host "3. Navigate to Settings > Webhooks" -ForegroundColor White
Write-Host "4. Add the Modal endpoint URL as a webhook" -ForegroundColor White
Write-Host "5. Configure webhooks for 'room_started' and 'room_finished' events" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test your agent:" -ForegroundColor Cyan
Write-Host "1. Go to LiveKit dashboard > Sandbox > Voice assistant" -ForegroundColor White
Write-Host "2. Start a voice assistant session" -ForegroundColor White
Write-Host "3. Your Clara agent should automatically join" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor your deployment:" -ForegroundColor Cyan
Write-Host "- Modal dashboard: https://modal.com/apps" -ForegroundColor White
Write-Host "- LiveKit dashboard: https://cloud.livekit.io" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see: MODAL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan 