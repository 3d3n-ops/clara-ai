#!/bin/bash

# Clara AI Vercel CLI Deployment Script
# This script automates the deployment to Vercel using CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_status "Checking Vercel CLI installation..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Installing now..."
        
        if command -v npm &> /dev/null; then
            npm install -g vercel
            print_status "Vercel CLI installed successfully."
        else
            print_error "npm is not installed. Please install Node.js first."
            exit 1
        fi
    else
        print_status "Vercel CLI is already installed."
    fi
}

# Check if .env.local exists
check_env_file() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env.local" ]; then
        print_error ".env.local file not found. Creating template..."
        
        cat > .env.local << 'EOF'
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
EOF
        
        print_warning "Created .env.local template. Please fill in your actual values before deploying."
        print_info "Edit .env.local and run this script again."
        exit 1
    else
        print_status ".env.local file found."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if ! npm install; then
        print_error "Failed to install dependencies."
        exit 1
    fi
    
    print_status "Dependencies installed successfully."
}

# Build project
build_project() {
    print_status "Building project..."
    
    if ! npm run build; then
        print_error "Build failed. Please check for errors."
        exit 1
    fi
    
    print_status "Project built successfully."
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    local deploy_command="vercel --prod --env-file .env.local"
    
    print_info "Running: $deploy_command"
    
    if ! $deploy_command; then
        print_error "Deployment failed. Please check the error messages above."
        exit 1
    fi
    
    print_status "Deployment completed successfully!"
}

# Set environment variables via CLI
set_env_variables() {
    print_status "Setting environment variables via CLI..."
    
    local env_vars=(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "CLERK_SECRET_KEY"
        "NEXT_PUBLIC_LIVEKIT_URL"
        "LIVEKIT_API_KEY"
        "LIVEKIT_API_SECRET"
        "PYTHON_BACKEND_URL"
        "OPENAI_API_KEY"
        "PINECONE_API_KEY"
        "PINECONE_ENVIRONMENT"
        "PINECONE_INDEX_NAME"
    )
    
    for var in "${env_vars[@]}"; do
        print_info "Setting $var..."
        if ! vercel env add "$var" production; then
            print_warning "Failed to set $var. You may need to set it manually."
        fi
    done
}

# Main deployment function
main() {
    echo "🎯 Clara AI Vercel CLI Deployment"
    echo "=================================="
    
    # Check Vercel CLI
    check_vercel_cli
    
    # Check environment file
    check_env_file
    
    # Install dependencies
    install_dependencies
    
    # Build project
    build_project
    
    # Deploy to Vercel
    deploy_vercel
    
    echo ""
    print_status "Deployment completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check your deployment URL"
    echo "2. Test authentication flow"
    echo "3. Verify all features work correctly"
    echo "4. Set up custom domain if needed"
    echo ""
    echo "📚 For troubleshooting, see VERCEL_CLI_DEPLOYMENT.md"
    echo ""
    print_status "Your Clara AI app is now live on Vercel! 🚀"
}

# Run main function
main "$@" 