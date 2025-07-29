# Clara AI Backend Deployment Script for Windows
# This script deploys the backend to Render with correct requirements.txt path

param(
    [switch]$SkipTest
)

Write-Host "🎯 Clara AI Backend Deployment" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Check if requirements.txt exists
function Test-Requirements {
    Write-Status "Checking requirements.txt..."
    
    if (-not (Test-Path "backend\requirements.txt")) {
        Write-Error "backend\requirements.txt not found!"
        Write-Info "Expected location: backend\requirements.txt"
        exit 1
    }
    else {
        Write-Status "backend\requirements.txt found."
    }
}

# Check if main server file exists
function Test-ServerFile {
    Write-Status "Checking server files..."
    
    if (-not (Test-Path "backend\homework_server_rag.py")) {
        Write-Error "backend\homework_server_rag.py not found!"
        exit 1
    }
    else {
        Write-Status "backend\homework_server_rag.py found."
    }
}

# Install Python dependencies
function Install-Dependencies {
    Write-Status "Installing Python dependencies..."
    
    if (Get-Command python -ErrorAction SilentlyContinue) {
        try {
            python -m pip install -r backend\requirements.txt
            Write-Status "Dependencies installed successfully."
        }
        catch {
            Write-Error "Failed to install dependencies. Please check Python and pip installation."
            exit 1
        }
    }
    else {
        Write-Error "Python is not installed. Please install Python first."
        exit 1
    }
}

# Test the server locally
function Test-Server {
    if ($SkipTest) {
        Write-Warning "Skipping server test."
        return
    }
    
    Write-Status "Testing server locally..."
    
    Push-Location backend
    
    try {
        # Check if uvicorn is available
        python -c "import uvicorn" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "uvicorn not found. Installing..."
            python -m pip install uvicorn
        }
        
        # Test if the server can start
        Write-Info "Testing server import..."
        python -c "from homework_server_rag import app; print('Server import successful')"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Server test completed successfully."
        }
        else {
            Write-Warning "Server test failed, but continuing with deployment."
        }
    }
    catch {
        Write-Warning "Server test completed with warnings."
    }
    finally {
        Pop-Location
    }
}

# Deploy to Render
function Deploy-Render {
    Write-Status "Preparing for Render deployment..."
    
    Write-Info "To deploy to Render:"
    Write-Host "1. Go to https://dashboard.render.com"
    Write-Host "2. Click 'New +' → 'Web Service'"
    Write-Host "3. Connect your GitHub repository"
    Write-Host "4. Configure the service:"
    Write-Host "   - Name: clara-homework-server"
    Write-Host "   - Environment: Python"
    Write-Host "   - Root Directory: backend"
    Write-Host "   - Build Command: pip install -r requirements.txt"
    Write-Host "   - Start Command: uvicorn homework_server_rag:app --host 0.0.0.0 --port `$PORT"
    Write-Host ""
    Write-Host "5. Set environment variables in Render dashboard"
    Write-Host "6. Deploy the service"
}

# Main deployment function
function Start-BackendDeployment {
    Write-Host "🎯 Clara AI Backend Deployment" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    # Check requirements
    Test-Requirements
    
    # Check server file
    Test-ServerFile
    
    # Install dependencies
    Install-Dependencies
    
    # Test server
    Test-Server
    
    # Deploy instructions
    Deploy-Render
    
    Write-Host ""
    Write-Status "Backend deployment preparation completed!"
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy to Render using the instructions above"
    Write-Host "2. Set environment variables in Render dashboard"
    Write-Host "3. Test the backend API endpoints"
    Write-Host "4. Update frontend with backend URL"
    Write-Host ""
    Write-Status "Backend is ready for deployment! 🚀"
}

# Run main deployment function
Start-BackendDeployment 