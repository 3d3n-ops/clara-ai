#!/usr/bin/env python3
"""
Test script to verify backend imports and basic functionality
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all required modules can be imported"""
    try:
        print("Testing imports...")
        
        # Test basic imports
        from dotenv import load_dotenv
        print("✅ dotenv imported successfully")
        
        # Test FastAPI imports
        from fastapi import FastAPI
        print("✅ FastAPI imported successfully")
        
        # Test livekit imports (without problematic modules)
        from livekit import agents
        from livekit.agents import AgentSession, Agent, RoomInputOptions
        from livekit.plugins import openai, cartesia, deepgram, silero
        print("✅ LiveKit imports successful (without noise_cancellation and turn_detector)")
        
        # Test our custom modules
        from rag_engine import rag_engine
        print("✅ RAG engine imported successfully")
        
        # Test voice agent (this should work now)
        from voice_agent_rag import ClaraAssistantRAG
        print("✅ Voice agent imported successfully")
        
        # Test homework agent
        from hwk_agent_rag import HomeworkAgentRAG
        print("✅ Homework agent imported successfully")
        
        # Test backend server
        from backend_server import app
        print("✅ Backend server imported successfully")
        
        print("\n🎉 All imports successful! Backend should deploy without issues.")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_environment():
    """Test that required environment variables are set"""
    print("\nTesting environment variables...")
    
    required_vars = [
        'OPENAI_API_KEY',
        'PINECONE_API_KEY', 
        'PINECONE_INDEX_NAME',
        'LIVEKIT_URL',
        'LIVEKIT_API_KEY',
        'LIVEKIT_API_SECRET'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
        else:
            print(f"✅ {var} is set")
    
    if missing_vars:
        print(f"❌ Missing environment variables: {missing_vars}")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

if __name__ == "__main__":
    print("🧪 Testing Clara AI Backend Deployment...")
    print("=" * 50)
    
    # Test imports
    imports_ok = test_imports()
    
    # Test environment
    env_ok = test_environment()
    
    print("\n" + "=" * 50)
    if imports_ok and env_ok:
        print("🎉 All tests passed! Backend is ready for deployment.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please fix the issues above.")
        sys.exit(1) 