#!/usr/bin/env python3
"""
Test script for Clara AI Voice Agent

This script tests the voice agent setup and verifies all dependencies are working.
"""

import os
import sys
from dotenv import load_dotenv

def test_environment():
    """Test environment variables and configuration"""
    print("🔍 Testing environment configuration...")
    
    load_dotenv()
    
    required_vars = [
        'LIVEKIT_URL',
        'LIVEKIT_API_KEY', 
        'LIVEKIT_API_SECRET',
        'OPENAI_API_KEY',
        'DEEPGRAM_API_KEY',
        'CARTESIA_API_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def test_dependencies():
    """Test if all required dependencies are installed"""
    print("\n🔍 Testing dependencies...")
    
    required_packages = [
        'livekit',
        'livekit.agents',
        'openai',
        'deepgram',
        'cartesia'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n❌ Missing packages: {', '.join(missing_packages)}")
        print("Please install missing packages with: pip install -r requirements.txt")
        return False
    else:
        print("✅ All required packages are installed")
        return True

def test_agent_imports():
    """Test if the voice agent modules can be imported"""
    print("\n🔍 Testing agent imports...")
    
    try:
        from simple_voice_agent import entrypoint as simple_entrypoint
        print("✅ Simple voice agent imported successfully")
    except Exception as e:
        print(f"❌ Failed to import simple voice agent: {e}")
        return False
    
    try:
        from advanced_voice_agent import entrypoint as advanced_entrypoint
        print("✅ Advanced voice agent imported successfully")
    except Exception as e:
        print(f"❌ Failed to import advanced voice agent: {e}")
        return False
    
    return True

def test_agent_classes():
    """Test if agent classes can be instantiated"""
    print("\n🔍 Testing agent class instantiation...")
    
    try:
        from simple_voice_agent import Assistant
        assistant = Assistant()
        print("✅ Simple agent class instantiated successfully")
    except Exception as e:
        print(f"❌ Failed to instantiate simple agent: {e}")
        return False
    
    try:
        from advanced_voice_agent import ClaraAssistant
        clara = ClaraAssistant(user_id="test-user")
        print("✅ Advanced agent class instantiated successfully")
    except Exception as e:
        print(f"❌ Failed to instantiate advanced agent: {e}")
        return False
    
    return True

def test_visual_commands():
    """Test visual command detection"""
    print("\n🔍 Testing visual command detection...")
    
    try:
        from advanced_voice_agent import ClaraAssistant
        clara = ClaraAssistant()
        
        test_commands = [
            "create diagram for photosynthesis",
            "make flashcards for math",
            "show quiz about history",
            "mind map for chemistry"
        ]
        
        for command in test_commands:
            result = clara.detect_visual_command(command)
            if result:
                print(f"✅ Detected: '{command}' -> {result.command_type}")
            else:
                print(f"❌ Failed to detect: '{command}'")
        
        return True
    except Exception as e:
        print(f"❌ Failed to test visual commands: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Clara AI Voice Agent Test Suite")
    print("=" * 50)
    
    tests = [
        test_environment,
        test_dependencies,
        test_agent_imports,
        test_agent_classes,
        test_visual_commands
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your voice agent is ready to use.")
        print("\nTo start the voice agent:")
        print("  python start_voice_agent.py --mode advanced")
        print("  python start_voice_agent.py --mode simple")
    else:
        print("❌ Some tests failed. Please fix the issues above before running the voice agent.")
        sys.exit(1)

if __name__ == "__main__":
    main() 