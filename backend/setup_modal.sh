#!/bin/bash

# Modal Deployment Setup Script for Clara Voice Agent
# This script helps automate the deployment process

echo "🚀 Setting up Modal deployment for Clara Voice Agent..."

# Check if Modal CLI is installed
if ! command -v modal &> /dev/null; then
    echo "📦 Installing Modal CLI..."
    pip install modal
else
    echo "✅ Modal CLI is already installed"
fi

# Check if user is authenticated
echo "🔐 Checking Modal authentication..."
if ! modal app list &> /dev/null; then
    echo "⚠️  Please run 'modal setup' to authenticate with Modal"
    echo "   Then run this script again"
    exit 1
fi

echo "✅ Modal authentication confirmed"

# Create secrets if they don't exist
echo "🔑 Setting up Modal secrets..."

# Check if secrets exist
if ! modal secret list | grep -q "clara-voice-agent-secrets"; then
    echo "📝 Creating Modal secrets..."
    echo "Please add the following secrets to your Modal dashboard:"
    echo ""
    echo "Secret Name: clara-voice-agent-secrets"
    echo "Required Environment Variables:"
    echo "  - LIVEKIT_URL"
    echo "  - LIVEKIT_API_KEY"
    echo "  - LIVEKIT_API_SECRET"
    echo "  - OPENAI_API_KEY"
    echo "  - CARTESIA_API_KEY"
    echo "  - DEEPGRAM_API_KEY"
    echo ""
    echo "Optional:"
    echo "  - RAG_ENGINE_URL"
    echo ""
    echo "Go to: https://modal.com/secrets"
    echo "Create a new secret named 'clara-voice-agent-secrets'"
    echo "Add all the required environment variables"
    echo ""
    read -p "Press Enter when you've created the secrets..."
else
    echo "✅ Modal secrets already exist"
fi

# Deploy the application
echo "🏗️  Deploying Clara Voice Agent to Modal..."
modal deploy modal_app.py

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the FastAPI endpoint URL from the deployment output"
echo "2. Go to your LiveKit dashboard"
echo "3. Navigate to Settings > Webhooks"
echo "4. Add the Modal endpoint URL as a webhook"
echo "5. Configure webhooks for 'room_started' and 'room_finished' events"
echo ""
echo "🧪 Test your agent:"
echo "1. Go to LiveKit dashboard > Sandbox > Voice assistant"
echo "2. Start a voice assistant session"
echo "3. Your Clara agent should automatically join"
echo ""
echo "📊 Monitor your deployment:"
echo "- Modal dashboard: https://modal.com/apps"
echo "- LiveKit dashboard: https://cloud.livekit.io"
echo ""
echo "📚 For more information, see: MODAL_DEPLOYMENT_GUIDE.md" 