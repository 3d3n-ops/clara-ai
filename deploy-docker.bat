@echo off
REM ============================================================================
REM Clara AI Backend Docker Deployment Script (Batch Version)
REM ============================================================================

echo 🚀 Starting Clara AI Backend Docker Deployment...

REM Check if Docker is installed and running
echo 📋 Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo ✅ Docker is installed

REM Check if docker-compose is available
echo 📋 Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Desktop is properly installed
    pause
    exit /b 1
)
echo ✅ Docker Compose is available

REM Check if .env file exists
echo 📋 Checking environment configuration...
if not exist ".env" (
    echo ❌ .env file not found
    echo Please copy env.example to .env and configure your environment variables
    echo Command: copy env.example .env
    pause
    exit /b 1
)
echo ✅ .env file found

REM Create necessary directories
echo 📋 Creating necessary directories...
if not exist "backend\generated_content" mkdir "backend\generated_content"
if not exist "backend\uploads" mkdir "backend\uploads"
echo ✅ Directories created

REM Stop any existing containers
echo 📋 Stopping existing containers...
docker-compose down >nul 2>&1
echo ✅ Existing containers stopped

REM Build and start the containers
echo 📋 Building and starting containers...
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start containers
    pause
    exit /b 1
)
echo ✅ Containers started successfully

REM Wait for the service to be ready
echo 📋 Waiting for service to be ready...
timeout /t 10 /nobreak >nul

REM Check if the service is responding
echo 📋 Checking service health...
set maxAttempts=30
set attempt=0

:health_check_loop
set /a attempt+=1
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Service is healthy and responding
    goto :success
)
if %attempt% geq %maxAttempts% (
    echo ❌ Service failed to start within expected time
    echo 📋 Checking container logs...
    docker-compose logs clara-backend
    pause
    exit /b 1
)
echo ⏳ Waiting for service to be ready... (Attempt %attempt%/%maxAttempts%)
timeout /t 2 /nobreak >nul
goto :health_check_loop

:success
echo.
echo 🎉 Clara AI Backend is now running!
echo 📊 Service Information:
echo    • Backend URL: http://localhost:8000
echo    • Health Check: http://localhost:8000/health
echo    • API Documentation: http://localhost:8000/docs

echo.
echo 📋 Useful Commands:
echo    • View logs: docker-compose logs -f clara-backend
echo    • Stop service: docker-compose down
echo    • Restart service: docker-compose restart clara-backend
echo    • Update service: docker-compose up --build -d

echo.
echo 🔧 Next Steps:
echo    1. Update your frontend to point to http://localhost:8000
echo    2. Test the API endpoints
echo    3. Configure your domain/port forwarding if needed

pause
