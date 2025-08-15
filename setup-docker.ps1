# ============================================================================
# Clara AI Backend Docker Setup Script
# ============================================================================

Write-Host "🔧 Setting up Clara AI Backend for Docker deployment..." -ForegroundColor Green

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Setup cancelled. Using existing .env file." -ForegroundColor Yellow
    } else {
        Copy-Item "env.example" ".env" -Force
        Write-Host "✅ .env file created from template" -ForegroundColor Green
    }
} else {
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created from template" -ForegroundColor Green
}

# Create necessary directories
Write-Host "📋 Creating necessary directories..." -ForegroundColor Yellow
$directories = @(
    "backend/generated_content",
    "backend/uploads"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created directory: $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ Directory exists: $dir" -ForegroundColor Green
    }
}

# Check Docker installation
Write-Host "📋 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    exit 1
}

# Check Docker Compose
Write-Host "📋 Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is properly installed" -ForegroundColor Yellow
    exit 1
}

# Display next steps
Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file with your actual API keys:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY" -ForegroundColor White
Write-Host "   - PINECONE_API_KEY" -ForegroundColor White
Write-Host "   - CLERK_SECRET_KEY" -ForegroundColor White
Write-Host "   - And other required keys" -ForegroundColor White

Write-Host "`n2. Deploy the backend:" -ForegroundColor White
Write-Host "   PowerShell: .\deploy-docker.ps1" -ForegroundColor Cyan
Write-Host "   Batch: deploy-docker.bat" -ForegroundColor Cyan

Write-Host "`n3. Test the deployment:" -ForegroundColor White
Write-Host "   .\test-docker-deployment.ps1" -ForegroundColor Cyan

Write-Host "`n📖 For detailed instructions, see: DOCKER_DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow

# Offer to open the .env file for editing
$openEnv = Read-Host "`nWould you like to open the .env file for editing? (y/N)"
if ($openEnv -eq "y" -or $openEnv -eq "Y") {
    try {
        Start-Process notepad ".env"
        Write-Host "✅ Opened .env file in Notepad" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not open .env file automatically" -ForegroundColor Yellow
        Write-Host "Please open it manually: .env" -ForegroundColor White
    }
}

Write-Host "`n✅ Setup complete! You're ready to deploy." -ForegroundColor Green
