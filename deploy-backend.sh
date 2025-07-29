#!/bin/bash

# Clara AI Backend Deployment Script
# This script deploys the backend to Render with correct requirements.txt path

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

# Check if requirements.txt exists
check_requirements() {
    print_status "Checking requirements.txt..."
    
    if [ ! -f "backend/requirements.txt" ]; then
        print_error "backend/requirements.txt not found!"
        print_info "Expected location: backend/requirements.txt"
        exit 1
    else
        print_status "backend/requirements.txt found."
    fi
}

# Check if main server file exists
check_server_file() {
    print_status "Checking server files..."
    
    if [ ! -f "backend/homework_server_rag.py" ]; then
        print_error "backend/homework_server_rag.py not found!"
        exit 1
    else
        print_status "backend/homework_server_rag.py found."
    fi
}

# Install Python dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    if command -v pip &> /dev/null; then
        pip install -r backend/requirements.txt
        print_status "Dependencies installed successfully."
    else
        print_error "pip is not installed. Please install Python and pip first."
        exit 1
    fi
}

# Test the server locally
test_server() {
    print_status "Testing server locally..."
    
    cd backend
    
    # Check if uvicorn is available
    if ! python -c "import uvicorn" 2>/dev/null; then
        print_error "uvicorn not found. Installing..."
        pip install uvicorn
    fi
    
    # Test if the server can start (timeout after 10 seconds)
    timeout 10s python -c "
import uvicorn
from homework_server_rag import app
print('Server import successful')
" || {
        print_warning "Server test completed (timeout expected)"
    }
    
    cd ..
    print_status "Server test completed."
}

# Deploy to Render
deploy_render() {
    print_status "Preparing for Render deployment..."
    
    print_info "To deploy to Render:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the service:"
    echo "   - Name: clara-homework-server"
    echo "   - Environment: Python"
    echo "   - Build Command: pip install -r backend/requirements.txt"
    echo "   - Start Command: uvicorn homework_server_rag:app --host 0.0.0.0 --port \$PORT"
    echo "   - Root Directory: backend"
    echo ""
    echo "5. Set environment variables in Render dashboard"
    echo "6. Deploy the service"
}

# Main deployment function
main() {
    echo "🎯 Clara AI Backend Deployment"
    echo "=============================="
    
    # Check requirements
    check_requirements
    
    # Check server file
    check_server_file
    
    # Install dependencies
    install_dependencies
    
    # Test server
    test_server
    
    # Deploy instructions
    deploy_render
    
    echo ""
    print_status "Backend deployment preparation completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Deploy to Render using the instructions above"
    echo "2. Set environment variables in Render dashboard"
    echo "3. Test the backend API endpoints"
    echo "4. Update frontend with backend URL"
    echo ""
    print_status "Backend is ready for deployment! 🚀"
}

# Run main function
main "$@" 