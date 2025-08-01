#!/usr/bin/env python3
"""
Test script for the local voice agent

This script demonstrates the functionality of the local voice agent
without requiring user interaction.
"""

import asyncio
import json
from local_voice_agent import LocalClaraAssistant

async def test_voice_agent():
    """Test the local voice agent with sample interactions"""
    
    print("🧪 Testing Local Voice Agent...")
    print("=" * 50)
    
    # Create assistant
    assistant = LocalClaraAssistant()
    assistant.start_session()
    
    # Test messages
    test_messages = [
        "hello",
        "help",
        "create diagram photosynthesis",
        "make flashcards math",
        "show quiz history",
        "create mindmap biology",
        "what is machine learning?",
        "bye"
    ]
    
    print("\n📝 Running test conversations...")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- Test {i}: '{message}' ---")
        
        # Process message
        response = await assistant.process_message(message)
        print(f"Response: {response}")
        
        # Show session time
        remaining = assistant.get_session_time_remaining()
        minutes = remaining // 60
        seconds = remaining % 60
        print(f"Session time remaining: {minutes}m {seconds}s")
    
    # Save session
    assistant.save_session()
    
    print("\n" + "=" * 50)
    print("✅ Test completed successfully!")
    print(f"📊 Total messages processed: {len(assistant.conversation_history)}")
    print(f"📁 Generated content saved in: {assistant.output_dir}")
    
    # Show generated files
    if assistant.output_dir.exists():
        files = list(assistant.output_dir.glob("*.json"))
        print(f"📄 Generated files: {len(files)}")
        for file in files:
            print(f"  - {file.name}")

def test_visual_commands():
    """Test visual command detection"""
    print("\n🔍 Testing visual command detection...")
    
    assistant = LocalClaraAssistant()
    
    test_commands = [
        "create diagram photosynthesis",
        "make flashcards math",
        "show quiz history",
        "create mindmap biology",
        "just a regular message",
        "draw this for chemistry",
        "generate flashcards for physics"
    ]
    
    for command in test_commands:
        visual_command = assistant.detect_visual_command(command)
        if visual_command:
            print(f"✅ '{command}' -> {visual_command.command_type}: {visual_command.topic}")
        else:
            print(f"❌ '{command}' -> No visual command detected")

if __name__ == "__main__":
    print("🎓 Clara AI Local Voice Agent - Test Suite")
    print("This script tests the functionality of the local voice agent.")
    print()
    
    # Test visual command detection
    test_visual_commands()
    
    # Test full conversation
    asyncio.run(test_voice_agent())
    
    print("\n🎉 All tests completed!") 