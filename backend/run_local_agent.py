#!/usr/bin/env python3
"""
Quick launcher script for the local LiveKit agent
Usage: python run_local_agent.py [room_name]
"""

import asyncio
import sys
import os
from local_livekit_agent import LocalLiveKitAgent

def check_environment():
    """Check if required environment variables are set"""
    required_vars = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY", 
        "LIVEKIT_API_SECRET"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 Please set these in your .env file or environment")
        return False
    
    # Check Google credentials
    google_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not google_creds:
        print("❌ Missing Google credentials:")
        print("   Set either GOOGLE_APPLICATION_CREDENTIALS_JSON or GOOGLE_APPLICATION_CREDENTIALS")
        return False
    
    return True

async def main():
    print("🚀 Clara.ai Local LiveKit Agent Launcher")
    print("=" * 45)
    
    # Check environment
    if not check_environment():
        print("\n🔧 Fix the environment variables and try again")
        return
    
    # Get room name
    room_name = sys.argv[1] if len(sys.argv) > 1 else "test-room"
    print(f"🎯 Target room: {room_name}")
    
    # Create and run agent
    agent = LocalLiveKitAgent()
    
    try:
        await agent.connect_to_room(room_name)
        
        print(f"\n✅ Agent is live in room: {room_name}")
        print("🌐 Open your web app and join this room to test")
        print("🛑 Press Ctrl+C to stop\n")
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await agent.disconnect()
        print("👋 Local agent stopped")

if __name__ == "__main__":
    asyncio.run(main())
