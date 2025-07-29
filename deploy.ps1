# Clara AI Deployment Script for Windows
# This script automates the deployment process for Clara AI

param(
    [switch]$SkipValidation
)

Write-Host "🚀 Starting Clara AI Deployment..." -ForegroundColor Green

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

# Check if required tools are installed
function Test-Dependencies {
    Write-Status "Checking dependencies..."
    
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Warning "Node.js is not installed. You'll need it for frontend deployment."
    }
    
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Warning "Python is not installed. You'll need it for backend deployment."
    }
    
    Write-Status "Dependencies check completed."
}

# Clean up unnecessary files
function Remove-UnnecessaryFiles {
    Write-Status "Cleaning up unnecessary files..."
    
    # Remove test files
    $testFiles = @(
        "backend\test_*.py",
        "backend\voice_agent_minimal.py",
        "backend\voice_agent_simple.py"
    )
    
    foreach ($pattern in $testFiles) {
        Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Remove-Item -Force
    }
    
    # Remove cache directories
    Get-ChildItem -Path "backend" -Recurse -Directory -Name "__pycache__" -ErrorAction SilentlyContinue | 
        ForEach-Object { Remove-Item -Path "backend\$_" -Recurse -Force -ErrorAction SilentlyContinue }
    
    Get-ChildItem -Path "." -Recurse -Directory -Name ".venv" -ErrorAction SilentlyContinue | 
        ForEach-Object { Remove-Item -Path "$_" -Recurse -Force -ErrorAction SilentlyContinue }
    
    # Remove node_modules if it exists
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
    }
    
    Write-Status "Cleanup completed."
}

# Validate environment variables
function Test-EnvironmentVariables {
    if ($SkipValidation) {
        Write-Warning "Skipping environment variable validation."
        return
    }
    
    Write-Status "Validating environment variables..."
    
    $requiredVars = @(
        "OPENAI_API_KEY",
        "CLERK_SECRET_KEY", 
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "PINECONE_API_KEY",
        "PINECONE_ENVIRONMENT",
        "PINECONE_INDEX_NAME",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if ([string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($var))) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        Write-Error "Please set these environment variables before deployment."
        exit 1
    }
    
    Write-Status "Environment variables validation completed."
}

# Deploy backend to Render
function Deploy-Backend {
    Write-Status "Deploying backend to Render..."
    
    if (-not (Test-Path "render.yaml")) {
        Write-Error "render.yaml not found. Please ensure it exists in the root directory."
        exit 1
    }
    
    Write-Status "Backend configuration ready for Render deployment."
    Write-Status "Please follow these steps:"
    Write-Host "1. Go to https://dashboard.render.com"
    Write-Host "2. Click 'New +' → 'Web Service'"
    Write-Host "3. Connect your GitHub repository"
    Write-Host "4. Configure the service using render.yaml"
    Write-Host "5. Set environment variables in Render dashboard"
    Write-Host "6. Deploy the service"
}

# Deploy voice agent to LiveKit Cloud
function Deploy-VoiceAgent {
    Write-Status "Deploying voice agent to LiveKit Cloud..."
    
    if (-not (Test-Path "livekit.yaml")) {
        Write-Error "livekit.yaml not found. Please ensure it exists in the root directory."
        exit 1
    }
    
    Write-Status "Voice agent configuration ready for LiveKit Cloud deployment."
    Write-Status "Please follow these steps:"
    Write-Host "1. Go to https://livekit.io"
    Write-Host "2. Create a new project"
    Write-Host "3. Get your API keys"
    Write-Host "4. Update livekit.yaml with your API keys"
    Write-Host "5. Deploy using LiveKit CLI or dashboard"
}

# Deploy frontend to Vercel
function Deploy-Frontend {
    Write-Status "Deploying frontend to Vercel..."
    
    if (-not (Test-Path "vercel.json")) {
        Write-Error "vercel.json not found. Please ensure it exists in the root directory."
        exit 1
    }
    
    # Install dependencies
    Write-Status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    Write-Status "Building frontend..."
    npm run build
    
    Write-Status "Frontend build completed."
    Write-Status "Please follow these steps:"
    Write-Host "1. Go to https://vercel.com"
    Write-Host "2. Click 'New Project'"
    Write-Host "3. Import your GitHub repository"
    Write-Host "4. Configure environment variables in Vercel dashboard"
    Write-Host "5. Deploy the project"
}

# Main deployment function
function Start-Deployment {
    Write-Host "🎯 Clara AI Deployment Script" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    
    # Check dependencies
    Test-Dependencies
    
    # Clean up files
    Remove-UnnecessaryFiles
    
    # Validate environment
    Test-EnvironmentVariables
    
    # Deploy components
    Deploy-Backend
    Deploy-VoiceAgent
    Deploy-Frontend
    
    Write-Host ""
    Write-Status "Deployment preparation completed!"
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy backend to Render"
    Write-Host "2. Deploy voice agent to LiveKit Cloud"
    Write-Host "3. Deploy frontend to Vercel"
    Write-Host "4. Configure environment variables in each platform"
    Write-Host "5. Test all functionality"
    Write-Host ""
    Write-Host "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Status "Good luck with your deployment! 🚀"
}

# Run main deployment function
Start-Deployment