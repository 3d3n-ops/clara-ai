#!/bin/bash

# Clara AI Deployment Script
# This script automates the deployment process for Clara AI

set -e

echo "🚀 Starting Clara AI Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. You'll need it for frontend deployment."
    fi
    
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 is not installed. You'll need it for backend deployment."
    fi
    
    print_status "Dependencies check completed."
}

# Clean up unnecessary files
cleanup_files() {
    print_status "Cleaning up unnecessary files..."
    
    # Remove test files
    rm -f backend/test_*.py
    rm -f backend/voice_agent_minimal.py
    rm -f backend/voice_agent_simple.py
    
    # Remove cache directories
    find backend -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".venv" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove node_modules if it exists (will be reinstalled)
    rm -rf node_modules 2>/dev/null || true
    
    print_status "Cleanup completed."
}

# Validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    local required_vars=(
        "OPENAI_API_KEY"
        "CLERK_SECRET_KEY"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "PINECONE_API_KEY"
        "PINECONE_ENVIRONMENT"
        "PINECONE_INDEX_NAME"
        "LIVEKIT_API_KEY"
        "LIVEKIT_API_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_error "Please set these environment variables before deployment."
        exit 1
    fi
    
    print_status "Environment variables validation completed."
}

# Deploy backend to Render
deploy_backend() {
    print_status "Deploying backend to Render..."
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_error "render.yaml not found. Please ensure it exists in the root directory."
        exit 1
    fi
    
    print_status "Backend configuration ready for Render deployment."
    print_status "Please follow these steps:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the service using render.yaml"
    echo "5. Set environment variables in Render dashboard"
    echo "6. Deploy the service"
}

# Deploy voice agent to LiveKit Cloud
deploy_voice_agent() {
    print_status "Deploying voice agent to LiveKit Cloud..."
    
    # Check if livekit.yaml exists
    if [ ! -f "livekit.yaml" ]; then
        print_error "livekit.yaml not found. Please ensure it exists in the root directory."
        exit 1
    fi
    
    print_status "Voice agent configuration ready for LiveKit Cloud deployment."
    print_status "Please follow these steps:"
    echo "1. Go to https://livekit.io"
    echo "2. Create a new project"
    echo "3. Get your API keys"
    echo "4. Update livekit.yaml with your API keys"
    echo "5. Deploy using LiveKit CLI or dashboard"
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_error "vercel.json not found. Please ensure it exists in the root directory."
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Build the project
    print_status "Building frontend..."
    npm run build
    
    print_status "Frontend build completed."
    print_status "Please follow these steps:"
    echo "1. Go to https://vercel.com"
    echo "2. Click 'New Project'"
    echo "3. Import your GitHub repository"
    echo "4. Configure environment variables in Vercel dashboard"
    echo "5. Deploy the project"
}

# Main deployment function
main() {
    echo "🎯 Clara AI Deployment Script"
    echo "=============================="
    
    # Check dependencies
    check_dependencies
    
    # Clean up files
    cleanup_files
    
    # Validate environment
    validate_env
    
    # Deploy components
    deploy_backend
    deploy_voice_agent
    deploy_frontend
    
    echo ""
    print_status "Deployment preparation completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy backend to Render"
    echo "2. Deploy voice agent to LiveKit Cloud"
    echo "3. Deploy frontend to Vercel"
    echo "4. Configure environment variables in each platform"
    echo "5. Test all functionality"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
    echo ""
    print_status "Good luck with your deployment! 🚀"
}

# Run main function
main "$@"