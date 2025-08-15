# ============================================================================
# Clara AI Backend Docker Setup Script (Simplified)
# ============================================================================

Write-Host "🔧 Setting up Clara AI Backend for Docker deployment..." -ForegroundColor Green

# Step 1: Create .env file
Write-Host "`n📋 Step 1: Creating environment file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
} else {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ .env file created from template" -ForegroundColor Green
    } else {
        Write-Host "❌ env.example file not found" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Create directories
Write-Host "`n📋 Step 2: Creating directories..." -ForegroundColor Yellow
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

# Step 3: Check Docker
Write-Host "`n📋 Step 3: Checking Docker..." -ForegroundColor Yellow

# Check if Docker Desktop is running
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcess) {
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker Desktop doesn't appear to be running" -ForegroundColor Yellow
    Write-Host "   Please start Docker Desktop and wait for it to fully load" -ForegroundColor White
    Write-Host "   Then run this script again" -ForegroundColor White
    Write-Host "`n   To start Docker Desktop:" -ForegroundColor Cyan
    Write-Host "   1. Open Docker Desktop from Start Menu" -ForegroundColor White
    Write-Host "   2. Wait for the whale icon to appear in system tray" -ForegroundColor White
    Write-Host "   3. Wait for 'Docker Desktop is running' message" -ForegroundColor White
    exit 1
}

# Test Docker command
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker command works: $dockerVersion" -ForegroundColor Green
    } else {
        throw "Docker command failed"
    }
} catch {
    Write-Host "❌ Docker command failed" -ForegroundColor Red
    Write-Host "   Please ensure Docker Desktop is fully started" -ForegroundColor Yellow
    Write-Host "   Wait a few more minutes and try again" -ForegroundColor Yellow
    exit 1
}

# Test Docker Compose
try {
    $composeVersion = docker-compose --version 2>$null
    if ($composeVersion) {
        Write-Host "✅ Docker Compose works: $composeVersion" -ForegroundColor Green
    } else {
        throw "Docker Compose command failed"
    }
} catch {
    Write-Host "❌ Docker Compose command failed" -ForegroundColor Red
    Write-Host "   This might be a Docker Desktop installation issue" -ForegroundColor Yellow
    Write-Host "   Try restarting Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Step 4: Test Docker functionality
Write-Host "`n📋 Step 4: Testing Docker functionality..." -ForegroundColor Yellow
try {
    $testResult = docker run --rm hello-world 2>$null
    if ($testResult -match "Hello from Docker") {
        Write-Host "✅ Docker is working correctly" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker test inconclusive, but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker test failed, but continuing..." -ForegroundColor Yellow
}

# Success message
Write-Host "`n🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Edit the .env file with your API keys:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY" -ForegroundColor White
Write-Host "   - PINECONE_API_KEY" -ForegroundColor White
Write-Host "   - CLERK_SECRET_KEY" -ForegroundColor White
Write-Host "   - And other required keys" -ForegroundColor White

Write-Host "`n2. Deploy the backend:" -ForegroundColor White
Write-Host "   .\deploy-docker.ps1" -ForegroundColor Cyan

Write-Host "`n3. Test the deployment:" -ForegroundColor White
Write-Host "   .\test-docker-deployment.ps1" -ForegroundColor Cyan

# Offer to open .env file
Write-Host "`nWould you like to open the .env file for editing now? (y/N)" -ForegroundColor Yellow
$response = Read-Host
if ($response -eq "y" -or $response -eq "Y") {
    try {
        Start-Process notepad ".env"
        Write-Host "✅ Opened .env file in Notepad" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not open .env file automatically" -ForegroundColor Yellow
        Write-Host "Please open it manually: .env" -ForegroundColor White
    }
}

Write-Host "`n✅ Setup complete! You're ready to deploy." -ForegroundColor Green
