#!/usr/bin/env python3
"""
Environment Setup Script for Clara.ai LiveKit Agent
This script helps set up the required environment variables.
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """Create a .env file with required environment variables"""
    env_content = """# LiveKit Configuration
# Get these from your LiveKit Cloud dashboard at https://cloud.livekit.io/
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here

# OpenAI Configuration
# Get this from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Deepgram Configuration (for Speech-to-Text)
# Get this from https://console.deepgram.com/
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Cartesia Configuration (for Text-to-Speech)
# Get this from https://console.cartesia.ai/
CARTESIA_API_KEY=your_cartesia_api_key_here

# Voice Agent Configuration
VOICE_AGENT_PORT=8765

# Logging Configuration
LOG_LEVEL=INFO
"""
    
    env_path = Path(__file__).parent / '.env'
    
    if env_path.exists():
        print(f"⚠️  .env file already exists at {env_path}")
        response = input("Do you want to overwrite it? (y/n): ")
        if response.lower() != 'y':
            print("Skipping .env file creation.")
            return
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print(f"✅ Created .env file at {env_path}")
    print("\n📝 Please edit the .env file and add your API keys:")
    print("   - LiveKit: https://cloud.livekit.io/")
    print("   - OpenAI: https://platform.openai.com/api-keys")
    print("   - Deepgram: https://console.deepgram.com/")
    print("   - Cartesia: https://console.cartesia.ai/")

def check_dependencies():
    """Check if required packages are installed"""
    required_packages = [
        'livekit-agents',
        'openai',
        'python-dotenv'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install them with:")
        print("   pip install -r requirements.txt")
        return False
    else:
        print("✅ All required packages are installed")
        return True

def main():
    print("🚀 Clara.ai LiveKit Agent Setup")
    print("=" * 40)
    
    # Check dependencies
    deps_ok = check_dependencies()
    
    if not deps_ok:
        print("\n🔧 Please install dependencies first:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    # Create .env file
    create_env_file()
    
    print("\n🎯 Next steps:")
    print("1. Edit the .env file with your API keys")
    print("2. Run: python start_advanced_agent.py dev")
    print("3. Start your frontend application")
    print("\n📚 For more help, see: backend/VOICE_AGENT_README.md")

if __name__ == "__main__":
    main()