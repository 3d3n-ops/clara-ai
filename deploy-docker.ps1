# ============================================================================
# Clara AI Backend Docker Deployment Script
# ============================================================================

Write-Host "🚀 Starting Clara AI Backend Docker Deployment..." -ForegroundColor Green

# Check if Docker is installed and running
Write-Host "📋 Checking Docker installation..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
Write-Host "📋 Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is properly installed" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
Write-Host "📋 Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Please copy env.example to .env and configure your environment variables" -ForegroundColor Yellow
    Write-Host "Command: Copy-Item env.example .env" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
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

# Stop any existing containers
Write-Host "📋 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✅ Existing containers stopped" -ForegroundColor Green

# Build and start the containers
Write-Host "📋 Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Containers started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for the service to be ready
Write-Host "📋 Waiting for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if the service is responding
Write-Host "📋 Checking service health..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "✅ Service is healthy and responding" -ForegroundColor Green
            break
        }
    } catch {
        $attempt++
        Write-Host "⏳ Waiting for service to be ready... (Attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($attempt -eq $maxAttempts) {
    Write-Host "❌ Service failed to start within expected time" -ForegroundColor Red
    Write-Host "📋 Checking container logs..." -ForegroundColor Yellow
    docker-compose logs clara-backend
    exit 1
}

# Display service information
Write-Host "`n🎉 Clara AI Backend is now running!" -ForegroundColor Green
Write-Host "📊 Service Information:" -ForegroundColor Cyan
Write-Host "   • Backend URL: http://localhost:8000" -ForegroundColor White
Write-Host "   • Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host "   • API Documentation: http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n📋 Useful Commands:" -ForegroundColor Cyan
Write-Host "   • View logs: docker-compose logs -f clara-backend" -ForegroundColor White
Write-Host "   • Stop service: docker-compose down" -ForegroundColor White
Write-Host "   • Restart service: docker-compose restart clara-backend" -ForegroundColor White
Write-Host "   • Update service: docker-compose up --build -d" -ForegroundColor White

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update your frontend to point to http://localhost:8000" -ForegroundColor White
Write-Host "   2. Test the API endpoints" -ForegroundColor White
Write-Host "   3. Configure your domain/port forwarding if needed" -ForegroundColor White
