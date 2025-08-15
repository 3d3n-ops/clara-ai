#!/usr/bin/env python3
"""
Interactive Demo for Local LiveKit Agent

This script provides an interactive demo of the local LiveKit agent
allowing users to test commands and see responses in real-time.

Usage:
    python demo_local_livekit_agent.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the current directory to the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from local_livekit_agent import LocalClaraAssistant

async def interactive_demo():
    """Run an interactive demo of the local LiveKit agent"""
    print("=" * 70)
    print("           Clara AI Local LiveKit Agent - Interactive Demo")
    print("=" * 70)
    print()
    print("Welcome to the interactive demo of Clara AI's local LiveKit agent!")
    print("This demo simulates how the agent would work in a real LiveKit session.")
    print()
    print("Available commands:")
    print("  📚 Study Help: Ask questions about any subject")
    print("  🎯 Visual Commands:")
    print("    - create diagram [topic]  - Generate visual diagrams")
    print("    - make flashcards [topic] - Create study flashcards")
    print("    - show quiz [topic]       - Generate interactive quizzes")
    print("    - create mindmap [topic]  - Create mind maps")
    print("  ⏰ Session Info:")
    print("    - help                    - Show this help message")
    print("    - time                    - Check remaining session time")
    print("    - bye                     - End the demo session")
    print()
    print("Example commands:")
    print("  > create diagram photosynthesis")
    print("  > make flashcards math formulas")
    print("  > show quiz biology")
    print("  > create mindmap history timeline")
    print("  > What is the water cycle?")
    print("  > help")
    print("  > time")
    print("  > bye")
    print()
    print("=" * 70)
    print()
    
    # Initialize the agent
    agent = LocalClaraAssistant(user_id="demo-user")
    agent.start_session()
    
    print(f"🎉 Demo session started! Session ID: {agent.user_id}")
    print(f"⏰ Session duration: {agent.session_duration // 60} minutes")
    print()
    
    # Send initial greeting
    initial_greeting = await agent.process_message("Greet the user as Clara and offer your assistance with their studies. Mention that you can help with homework, explain concepts, and generate visual content like diagrams, flashcards, and quizzes.")
    print(f"🤖 Clara: {initial_greeting}")
    print()
    
    # Interactive loop
    session_active = True
    while session_active:
        try:
            # Check session status
            remaining = agent.get_session_time_remaining()
            if remaining <= 0:
                print("⏰ Session time has expired. Demo session ending...")
                break
            
            # Show time remaining every few interactions
            if remaining <= 120 and not agent.winding_down:
                print("⚠️  Session winding down soon...")
                agent.winding_down = True
            
            # Get user input
            try:
                user_input = input("💬 You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n👋 Demo interrupted. Goodbye!")
                break
            
            if not user_input:
                continue
            
            # Process the message
            print("🔄 Processing...")
            response = await agent.process_message(user_input)
            print(f"🤖 Clara: {response}")
            print()
            
            # Check if session should end
            if agent.session_complete:
                print("👋 Demo session ended by user command.")
                break
            
            # Show time remaining occasionally
            if remaining % 120 == 0:  # Every 2 minutes
                minutes = remaining // 60
                seconds = remaining % 60
                print(f"⏰ Time remaining: {minutes}:{seconds:02d}")
                print()
                
        except Exception as e:
            print(f"❌ Error: {e}")
            print("Please try again or type 'bye' to exit.")
            print()
    
    # Save session data
    agent.save_session()
    
    print("=" * 70)
    print("Demo session completed!")
    print(f"📁 Generated content saved in: {agent.content_dir}")
    print(f"💾 Session data saved to: generated_content/")
    print("=" * 70)

def show_help():
    """Show help information"""
    print("=" * 70)
    print("           Clara AI Local LiveKit Agent - Help")
    print("=" * 70)
    print()
    print("This is an interactive demo of Clara AI's local LiveKit agent.")
    print("The agent simulates the same functionality as the production Modal deployment.")
    print()
    print("Key Features:")
    print("✅ Local LiveKit simulation")
    print("✅ Clara AI study assistant")
    print("✅ Visual content generation")
    print("✅ Session management")
    print("✅ Local file storage")
    print()
    print("Commands:")
    print("  help                    - Show this help message")
    print("  demo                    - Start interactive demo")
    print("  test                    - Run automated tests")
    print("  exit                    - Exit the program")
    print()
    print("For more information, see: LOCAL_LIVEKIT_AGENT_README.md")
    print("=" * 70)

async def run_tests():
    """Run the test suite"""
    print("Running automated tests...")
    try:
        from test_local_livekit_agent import run_all_tests
        success = await run_all_tests()
        if success:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed.")
    except ImportError:
        print("❌ Test module not found. Make sure test_local_livekit_agent.py exists.")
    except Exception as e:
        print(f"❌ Error running tests: {e}")

async def main():
    """Main function"""
    print("Welcome to Clara AI Local LiveKit Agent!")
    print()
    
    while True:
        try:
            command = input("Enter command (help/demo/test/exit): ").strip().lower()
            
            if command == "help":
                show_help()
            elif command == "demo":
                await interactive_demo()
            elif command == "test":
                await run_tests()
            elif command == "exit":
                print("Goodbye!")
                break
            else:
                print("Unknown command. Type 'help' for available commands.")
            
            print()
            
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            print("Please try again.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!") 