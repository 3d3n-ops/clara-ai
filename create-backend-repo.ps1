# Create Backend-Only Repository Script
# This script creates a clean backend repository for Railway deployment

Write-Host "🔧 Creating Clean Backend Repository for Railway" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$backendDir = "clara-backend-railway"
$sourceDir = "backend"

Write-Host "`n📋 This script will:" -ForegroundColor Cyan
Write-Host "1. Create a new directory: $backendDir" -ForegroundColor White
Write-Host "2. Copy only backend files" -ForegroundColor White
Write-Host "3. Create necessary configuration files" -ForegroundColor White
Write-Host "4. Help you create a new GitHub repository" -ForegroundColor White

Write-Host "`n⚠️  Warning: This will create a new directory with backend files only." -ForegroundColor Yellow
$confirm = Read-Host "Continue? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Operation cancelled." -ForegroundColor Red
    exit
}

# Create backend directory
Write-Host "`n📁 Creating backend directory..." -ForegroundColor Cyan
if (Test-Path $backendDir) {
    Remove-Item -Recurse -Force $backendDir
}
New-Item -ItemType Directory -Name $backendDir

# Copy backend files
Write-Host "📋 Copying backend files..." -ForegroundColor Cyan
Copy-Item -Path "$sourceDir\*" -Destination $backendDir -Recurse

# Create railway.json in the backend directory
Write-Host "⚙️  Creating Railway configuration..." -ForegroundColor Cyan
$railwayConfig = @"
{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "numReplicas": 1
  }
}
"@
$railwayConfig | Out-File -FilePath "$backendDir\railway.json" -Encoding UTF8

# Create README
Write-Host "📝 Creating README..." -ForegroundColor Cyan
$readme = @"
# Clara AI Backend

This is the backend service for Clara AI, deployed on Railway.

## Features
- FastAPI server
- RAG (Retrieval-Augmented Generation) engine
- File upload and processing
- WebSocket support for real-time communication
- Pinecone vector database integration

## Deployment
This repository is configured for Railway deployment.

## Environment Variables
See railway-env-template.txt for required environment variables.
"@
$readme | Out-File -FilePath "$backendDir\README.md" -Encoding UTF8

# Copy environment template
Write-Host "📋 Copying environment template..." -ForegroundColor Cyan
Copy-Item -Path "railway-env-template.txt" -Destination "$backendDir\railway-env-template.txt"

# Create .gitignore
Write-Host "📋 Creating .gitignore..." -ForegroundColor Cyan
$gitignore = @"
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Generated content
generated_content/
uploads/
"@
$gitignore | Out-File -FilePath "$backendDir\.gitignore" -Encoding UTF8

Write-Host "`n✅ Backend repository created successfully!" -ForegroundColor Green
Write-Host "📁 Location: $backendDir" -ForegroundColor White

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create a new GitHub repository" -ForegroundColor White
Write-Host "2. Push the $backendDir contents to the new repository" -ForegroundColor White
Write-Host "3. Deploy to Railway using the new repository" -ForegroundColor White

Write-Host "`n📋 Git Commands:" -ForegroundColor Yellow
Write-Host "cd $backendDir" -ForegroundColor White
Write-Host "git init" -ForegroundColor White
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Initial backend commit'" -ForegroundColor White
Write-Host "git branch -M main" -ForegroundColor White
Write-Host "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White

Write-Host "`n💡 Benefits of this approach:" -ForegroundColor Cyan
Write-Host "- Clean repository with only backend files" -ForegroundColor White
Write-Host "- No confusion with frontend files" -ForegroundColor White
Write-Host "- Faster Railway deployments" -ForegroundColor White
Write-Host "- Easier to manage and debug" -ForegroundColor White

Write-Host "`n🎯 After creating the new repository:" -ForegroundColor Green
Write-Host "1. Go to Railway dashboard" -ForegroundColor White
Write-Host "2. Create new project" -ForegroundColor White
Write-Host "3. Deploy from the new GitHub repository" -ForegroundColor White
Write-Host "4. Add environment variables" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
