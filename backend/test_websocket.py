#!/usr/bin/env python3
"""
Simple test script for the voice agent websocket functionality
"""

import asyncio
import websockets
import json
import sys

async def test_voice_agent():
    """Test the voice agent websocket connection"""
    
    uri = "ws://localhost:8765"
    
    try:
        print("Connecting to voice agent...")
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            
            # Test session start
            session_start = {
                "type": "session_start",
                "user_id": "test-user-123"
            }
            
            print("Sending session start...")
            await websocket.send(json.dumps(session_start))
            
            # Wait for response
            response = await websocket.recv()
            data = json.loads(response)
            print(f"Received: {data}")
            
            # Test text message
            text_message = {
                "type": "text",
                "text": "Hello Clara, can you create a diagram for photosynthesis?",
                "user_id": "test-user-123"
            }
            
            print("Sending text message...")
            await websocket.send(json.dumps(text_message))
            
            # Wait for response
            response = await websocket.recv()
            data = json.loads(response)
            print(f"Received: {data}")
            
            # Test session end
            session_end = {
                "type": "session_end",
                "user_id": "test-user-123"
            }
            
            print("Sending session end...")
            await websocket.send(json.dumps(session_end))
            
            print("Test completed successfully!")
            
    except websockets.exceptions.ConnectionRefused:
        print("Error: Could not connect to voice agent. Make sure it's running on ws://localhost:8765")
        sys.exit(1)
    except Exception as e:
        print(f"Error during test: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Testing Clara Voice Agent WebSocket...")
    asyncio.run(test_voice_agent()) 