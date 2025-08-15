#!/usr/bin/env python3
"""
Test Script for Local LiveKit Agent

This script tests the basic functionality of the local LiveKit agent
without running a full session.

Usage:
    python test_local_livekit_agent.py
"""

import asyncio
import json
from pathlib import Path
import sys
import os

# Add the current directory to the path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from local_livekit_agent import LocalClaraAssistant, VisualCommand

async def test_agent_initialization():
    """Test agent initialization"""
    print("Testing agent initialization...")
    
    agent = LocalClaraAssistant(user_id="test-user-123")
    
    assert agent.user_id == "test-user-123"
    assert agent.session_duration == 600
    assert not agent.session_complete
    assert not agent.winding_down
    
    print("✅ Agent initialization: PASSED")
    return agent

def test_visual_command_detection():
    """Test visual command detection"""
    print("Testing visual command detection...")
    
    agent = LocalClaraAssistant()
    
    # Test diagram commands
    diagram_cmd = agent.detect_visual_command("create diagram photosynthesis")
    assert diagram_cmd is not None
    assert diagram_cmd.command_type == "diagram"
    assert diagram_cmd.topic == "photosynthesis"
    
    # Test flashcard commands
    flashcard_cmd = agent.detect_visual_command("make flashcards math formulas")
    assert flashcard_cmd is not None
    assert flashcard_cmd.command_type == "flashcard"
    assert flashcard_cmd.topic == "math formulas"
    
    # Test quiz commands
    quiz_cmd = agent.detect_visual_command("show quiz biology")
    assert quiz_cmd is not None
    assert quiz_cmd.command_type == "quiz"
    assert quiz_cmd.topic == "biology"
    
    # Test mindmap commands
    mindmap_cmd = agent.detect_visual_command("create mindmap history timeline")
    assert mindmap_cmd is not None
    assert mindmap_cmd.command_type == "mindmap"
    assert mindmap_cmd.topic == "history timeline"
    
    # Test no command
    no_cmd = agent.detect_visual_command("hello how are you")
    assert no_cmd is None
    
    print("✅ Visual command detection: PASSED")

async def test_visual_content_generation():
    """Test visual content generation"""
    print("Testing visual content generation...")
    
    agent = LocalClaraAssistant()
    
    # Test diagram generation
    diagram_cmd = VisualCommand("diagram", "test topic")
    diagram_content = await agent.generate_diagram("test topic")
    
    assert diagram_content["type"] == "diagram"
    assert diagram_content["topic"] == "test topic"
    assert "elements" in diagram_content
    assert "filename" in diagram_content
    
    # Test flashcard generation
    flashcard_content = await agent.generate_flashcards("test topic")
    
    assert flashcard_content["type"] == "flashcards"
    assert flashcard_content["topic"] == "test topic"
    assert "cards" in flashcard_content
    assert len(flashcard_content["cards"]) > 0
    
    # Test quiz generation
    quiz_content = await agent.generate_quiz("test topic")
    
    assert quiz_content["type"] == "quiz"
    assert quiz_content["topic"] == "test topic"
    assert "questions" in quiz_content
    assert len(quiz_content["questions"]) > 0
    
    # Test mindmap generation
    mindmap_content = await agent.generate_mindmap("test topic")
    
    assert mindmap_content["type"] == "mindmap"
    assert mindmap_content["topic"] == "test topic"
    assert "nodes" in mindmap_content
    assert "connections" in mindmap_content
    
    print("✅ Visual content generation: PASSED")

async def test_message_processing():
    """Test message processing"""
    print("Testing message processing...")
    
    agent = LocalClaraAssistant()
    
    # Test help command
    help_response = await agent.process_message("help")
    assert "Clara" in help_response
    assert "commands" in help_response.lower()
    
    # Test visual command
    diagram_response = await agent.process_message("create diagram photosynthesis")
    assert "diagram" in diagram_response.lower()
    assert "photosynthesis" in diagram_response
    
    # Test time command
    time_response = await agent.process_message("time")
    assert "minutes" in time_response.lower()
    assert "seconds" in time_response.lower()
    
    # Test bye command
    bye_response = await agent.process_message("bye")
    assert "thank you" in bye_response.lower()
    assert agent.session_complete
    
    print("✅ Message processing: PASSED")

def test_session_management():
    """Test session management"""
    print("Testing session management...")
    
    agent = LocalClaraAssistant()
    
    # Test session start
    agent.start_session()
    assert agent.session_start_time is not None
    assert not agent.session_complete
    assert not agent.winding_down
    
    # Test time remaining
    remaining = agent.get_session_time_remaining()
    assert remaining <= 600
    assert remaining > 590  # Should be close to 600 initially
    
    # Test winding down (should not trigger initially)
    assert not agent.should_wind_down()
    
    print("✅ Session management: PASSED")

async def test_file_operations():
    """Test file operations"""
    print("Testing file operations...")
    
    # Clean up any existing test files
    content_dir = Path("generated_content")
    if content_dir.exists():
        for file in content_dir.glob("test_*"):
            try:
                file.unlink()
            except:
                pass
    
    agent = LocalClaraAssistant()
    
    # Test content directory creation
    assert agent.content_dir.exists()
    
    # Test file saving
    agent.start_session()
    await agent.generate_diagram("test file operation")
    
    # Check if file was created
    files = list(agent.content_dir.glob("diagram_test_file_operation_*.json"))
    assert len(files) > 0
    
    # Test session saving
    agent.save_session()
    session_files = list(agent.content_dir.glob("session_*.json"))
    assert len(session_files) > 0
    
    print("✅ File operations: PASSED")

async def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("           Local LiveKit Agent Tests")
    print("=" * 60)
    print()
    
    try:
        # Run all tests
        await test_agent_initialization()
        test_visual_command_detection()
        await test_visual_content_generation()
        await test_message_processing()
        test_session_management()
        await test_file_operations()
        
        print()
        print("=" * 60)
        print("🎉 All tests passed successfully!")
        print("The local LiveKit agent is working correctly.")
        print("=" * 60)
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1) 