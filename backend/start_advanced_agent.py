#!/usr/bin/env python3
"""
Advanced Voice Agent Startup Script
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    print("Starting Clara AI Advanced Voice Agent...")
    print("Features: Visual content generation, session management, educational focus")
    print("Press Ctrl+C to stop the agent")
    
    try:
        from advanced_voice_agent import entrypoint
        from livekit import agents
        
        agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
        
    except KeyboardInterrupt:
        print("\nVoice agent stopped by user")
    except Exception as e:
        print(f"Error starting voice agent: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 