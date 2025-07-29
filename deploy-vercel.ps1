# Clara AI Vercel CLI Deployment Script for Windows
# This script automates the deployment to Vercel using CLI

param(
    [switch]$SkipBuild,
    [switch]$SkipEnvCheck,
    [string]$Environment = "production"
)

Write-Host "🚀 Clara AI Vercel CLI Deployment" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

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

# Check if Vercel CLI is installed
function Test-VercelCLI {
    Write-Status "Checking Vercel CLI installation..."
    
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Error "Vercel CLI is not installed. Installing now..."
        
        try {
            npm install -g vercel
            Write-Status "Vercel CLI installed successfully."
        }
        catch {
            Write-Error "Failed to install Vercel CLI. Please install manually:"
            Write-Host "npm install -g vercel" -ForegroundColor Cyan
            exit 1
        }
    }
    else {
        Write-Status "Vercel CLI is already installed."
    }
}

# Check if .env.local exists
function Test-EnvironmentFile {
    if ($SkipEnvCheck) {
        Write-Warning "Skipping environment file check."
        return
    }
    
    Write-Status "Checking environment configuration..."
    
    if (-not (Test-Path ".env.local")) {
        Write-Error ".env.local file not found. Creating template..."
        
        $envTemplate = @"
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-domain.com
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# Backend Configuration
PYTHON_BACKEND_URL=https://your-render-backend-url.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=your_pinecone_index_name_here
"@
        
        $envTemplate | Out-File -FilePath ".env.local" -Encoding UTF8
        Write-Warning "Created .env.local template. Please fill in your actual values before deploying."
        Write-Host "Edit .env.local and run this script again." -ForegroundColor Cyan
        exit 1
    }
    else {
        Write-Status ".env.local file found."
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    try {
        npm install
        Write-Status "Dependencies installed successfully."
    }
    catch {
        Write-Error "Failed to install dependencies."
        exit 1
    }
}

# Build project
function Build-Project {
    if ($SkipBuild) {
        Write-Warning "Skipping build step."
        return
    }
    
    Write-Status "Building project..."
    
    try {
        npm run build
        Write-Status "Project built successfully."
    }
    catch {
        Write-Error "Build failed. Please check for errors."
        exit 1
    }
}

# Deploy to Vercel
function Deploy-Vercel {
    Write-Status "Deploying to Vercel..."
    
    $deployCommand = "vercel"
    
    if ($Environment -eq "production") {
        $deployCommand += " --prod"
    }
    
    $deployCommand += " --env-file .env.local"
    
    Write-Host "Running: $deployCommand" -ForegroundColor Cyan
    
    try {
        Invoke-Expression $deployCommand
        Write-Status "Deployment completed successfully!"
    }
    catch {
        Write-Error "Deployment failed. Please check the error messages above."
        exit 1
    }
}

# Set environment variables via CLI
function Set-EnvironmentVariables {
    Write-Status "Setting environment variables via CLI..."
    
    $envVars = @(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
        "NEXT_PUBLIC_LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "PYTHON_BACKEND_URL",
        "OPENAI_API_KEY",
        "PINECONE_API_KEY",
        "PINECONE_ENVIRONMENT",
        "PINECONE_INDEX_NAME"
    )
    
    foreach ($var in $envVars) {
        Write-Host "Setting $var..." -ForegroundColor Yellow
        try {
            if ($Environment -eq "production") {
                vercel env add $var production
            }
            else {
                vercel env add $var
            }
        }
        catch {
            Write-Warning "Failed to set $var. You may need to set it manually."
        }
    }
}

# Main deployment function
function Start-VercelDeployment {
    Write-Host "🎯 Clara AI Vercel CLI Deployment" -ForegroundColor Cyan
    Write-Host "==================================" -ForegroundColor Cyan
    
    # Check Vercel CLI
    Test-VercelCLI
    
    # Check environment file
    Test-EnvironmentFile
    
    # Install dependencies
    Install-Dependencies
    
    # Build project
    Build-Project
    
    # Deploy to Vercel
    Deploy-Vercel
    
    Write-Host ""
    Write-Status "Deployment completed!"
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Check your deployment URL"
    Write-Host "2. Test authentication flow"
    Write-Host "3. Verify all features work correctly"
    Write-Host "4. Set up custom domain if needed"
    Write-Host ""
    Write-Host "📚 For troubleshooting, see VERCEL_CLI_DEPLOYMENT.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Status "Your Clara AI app is now live on Vercel! 🚀"
}

# Run main deployment function
Start-VercelDeployment 