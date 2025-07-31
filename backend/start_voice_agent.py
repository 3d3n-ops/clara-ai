#!/usr/bin/env python3
"""
Voice Agent Startup Script

This script allows you to start either the simple or advanced voice agent.
"""

import sys
import os
import argparse
from dotenv import load_dotenv

load_dotenv()

def main():
    parser = argparse.ArgumentParser(description='Start the Clara AI Voice Agent')
    parser.add_argument(
        '--mode', 
        choices=['simple', 'advanced'], 
        default='advanced',
        help='Choose the voice agent mode (default: advanced)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=8765,
        help='Port for the voice agent (default: 8765)'
    )
    
    args = parser.parse_args()
    
    print(f"Starting Clara AI Voice Agent in {args.mode} mode...")
    
    # Set environment variables
    os.environ['VOICE_AGENT_PORT'] = str(args.port)
    
    try:
        if args.mode == 'simple':
            print("Using simple voice agent implementation")
            # Import and run simple agent directly
            from simple_voice_agent import entrypoint
            from livekit import agents
            agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
        else:
            print("Using advanced voice agent implementation with visual content generation")
            # Import and run advanced agent directly
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