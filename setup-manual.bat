@echo off
REM ============================================================================
REM Clara AI Backend Manual Docker Setup
REM ============================================================================

echo 🔧 Setting up Clara AI Backend for Docker deployment...

REM Step 1: Create .env file
echo.
echo 📋 Step 1: Creating environment file...
if exist ".env" (
    echo ✅ .env file already exists
) else (
    if exist "env.example" (
        copy "env.example" ".env" >nul
        echo ✅ .env file created from template
    ) else (
        echo ❌ env.example file not found
        pause
        exit /b 1
    )
)

REM Step 2: Create directories
echo.
echo 📋 Step 2: Creating directories...
if not exist "backend\generated_content" mkdir "backend\generated_content"
if not exist "backend\uploads" mkdir "backend\uploads"
echo ✅ Directories created

REM Step 3: Check Docker
echo.
echo 📋 Step 3: Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo.
    echo Please ensure Docker Desktop is:
    echo 1. Installed from https://www.docker.com/products/docker-desktop/
    echo 2. Started and fully loaded
    echo 3. Shows "Docker Desktop is running" in the application
    echo.
    echo After starting Docker Desktop, run this script again.
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Step 4: Check Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo.
    echo This might be a Docker Desktop installation issue.
    echo Try restarting Docker Desktop or updating to the latest version.
    pause
    exit /b 1
)

echo ✅ Docker Compose is available

REM Step 5: Test Docker functionality
echo.
echo 📋 Step 4: Testing Docker functionality...
docker run --rm hello-world >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker is working correctly
) else (
    echo ⚠️  Docker test failed, but continuing...
)

REM Success message
echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Edit the .env file with your API keys:
echo    - OPENAI_API_KEY
echo    - PINECONE_API_KEY
echo    - CLERK_SECRET_KEY
echo    - And other required keys
echo.
echo 2. Deploy the backend:
echo    deploy-docker.bat
echo.
echo 3. Test the deployment:
echo    test-docker-deployment.ps1
echo.

REM Offer to open .env file
set /p openEnv="Would you like to open the .env file for editing now? (y/N): "
if /i "%openEnv%"=="y" (
    start notepad ".env"
    echo ✅ Opened .env file in Notepad
)

echo.
echo ✅ Setup complete! You're ready to deploy.
pause
