#!/usr/bin/env python3
"""
Test script for the local LiveKit agent server

This script tests the basic functionality of the local agent server
to ensure it's working correctly before connecting the frontend.

Usage:
    python test_local_agent.py
"""

import requests
import json
import time

def test_local_agent_server():
    """Test the local agent server endpoints"""
    base_url = "http://localhost:5001"
    
    print("Testing Local Agent Server...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Status: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to local agent server")
        print("   Make sure the server is running on port 5001")
        return False
    
    # Test 2: Start agent
    print("\n2. Testing agent start...")
    try:
        start_data = {
            "roomName": "test-room-123",
            "participantName": "test-student"
        }
        response = requests.post(
            f"{base_url}/api/local-livekit/start-agent",
            json=start_data
        )
        
        if response.status_code == 200:
            print("✅ Agent start passed")
            result = response.json()
            print(f"   Agent ID: {result.get('agentId')}")
            print(f"   Room: {result.get('roomName')}")
        else:
            print(f"❌ Agent start failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Agent start error: {e}")
        return False
    
    # Test 3: Send chat message
    print("\n3. Testing chat functionality...")
    try:
        chat_data = {
            "message": "Hello Clara, can you help me study?",
            "roomName": "test-room-123"
        }
        response = requests.post(
            f"{base_url}/api/local-livekit/chat",
            json=chat_data
        )
        
        if response.status_code == 200:
            print("✅ Chat functionality passed")
            result = response.json()
            print(f"   Response: {result.get('response')[:100]}...")
            if result.get('visualContent'):
                print(f"   Visual content: {result.get('visualContent', {}).get('title')}")
        else:
            print(f"❌ Chat functionality failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat functionality error: {e}")
        return False
    
    # Test 4: Test visual content generation
    print("\n4. Testing visual content generation...")
    try:
        visual_commands = [
            "create diagram photosynthesis",
            "make flashcards math",
            "show quiz biology",
            "create mindmap chemistry"
        ]
        
        for command in visual_commands:
            chat_data = {
                "message": command,
                "roomName": "test-room-123"
            }
            response = requests.post(
                f"{base_url}/api/local-livekit/chat",
                json=chat_data
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('visualContent'):
                    print(f"✅ {command}: {result.get('visualContent', {}).get('title')}")
                else:
                    print(f"⚠️  {command}: No visual content generated")
            else:
                print(f"❌ {command}: Failed")
    
    except Exception as e:
        print(f"❌ Visual content test error: {e}")
        return False
    
    # Test 5: End session
    print("\n5. Testing session end...")
    try:
        end_data = {
            "roomName": "test-room-123"
        }
        response = requests.post(
            f"{base_url}/api/local-livekit/end-session",
            json=end_data
        )
        
        if response.status_code == 200:
            print("✅ Session end passed")
            result = response.json()
            print(f"   Message: {result.get('message')}")
        else:
            print(f"❌ Session end failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Session end error: {e}")
        return False
    
    # Test 6: Get status
    print("\n6. Testing status endpoint...")
    try:
        response = requests.get(f"{base_url}/api/local-livekit/status")
        
        if response.status_code == 200:
            print("✅ Status endpoint passed")
            result = response.json()
            print(f"   Active agents: {result.get('active_agents')}")
        else:
            print(f"❌ Status endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Status endpoint error: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Local agent server is working correctly.")
    print("\nYou can now start your frontend and connect to the local agent.")
    return True

if __name__ == "__main__":
    print("Local Agent Server Test")
    print("Make sure the server is running on port 5001 before running this test.")
    print()
    
    try:
        success = test_local_agent_server()
        if not success:
            print("\n❌ Some tests failed. Check the server logs for more details.")
            exit(1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        exit(1) 