#!/usr/bin/env python3
"""
Modal Deployment Test Script

This script helps test and diagnose Modal deployment issues by:
1. Testing the health check endpoint
2. Testing the LiveKit connection endpoint
3. Testing webhook functionality
4. Providing debugging information

Usage:
    python test_modal_deployment.py
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime

# Modal deployment URLs (update these with your actual deployment URLs)
MODAL_BASE_URL = "https://d3n-ops--clara-voice-agent"
HEALTH_CHECK_URL = f"{MODAL_BASE_URL}-health-check.modal.run"
LIVEKIT_TEST_URL = f"{MODAL_BASE_URL}-test-livekit-connection.modal.run"
WEBHOOK_TEST_URL = f"{MODAL_BASE_URL}-test-webhook.modal.run"
CREATE_ROOM_URL = f"{MODAL_BASE_URL}-create-room-and-start-agent.modal.run"

async def test_endpoint(session, url, method="GET", data=None, name="Endpoint"):
    """Test a Modal endpoint and return the result"""
    try:
        headers = {"Content-Type": "application/json"} if data else {}
        
        if method == "GET":
            async with session.get(url) as response:
                status = response.status
                try:
                    result = await response.json()
                except:
                    result = await response.text()
        else:
            async with session.post(url, json=data or {}, headers=headers) as response:
                status = response.status
                try:
                    result = await response.json()
                except:
                    result = await response.text()
        
        print(f"✅ {name}: {status} - {result}")
        return {"status": status, "result": result, "success": True}
        
    except Exception as e:
        print(f"❌ {name}: Error - {str(e)}")
        return {"status": None, "result": str(e), "success": False}

async def test_modal_deployment():
    """Test all Modal endpoints and provide diagnostics"""
    print("🔍 Modal Deployment Test Script")
    print("=" * 50)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Base URL: {MODAL_BASE_URL}")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Test 1: Health Check
        print("1. Testing Health Check Endpoint")
        print("-" * 40)
        health_result = await test_endpoint(
            session, 
            HEALTH_CHECK_URL, 
            name="Health Check"
        )
        print()
        
        # Test 2: LiveKit Connection Test
        print("2. Testing LiveKit Connection")
        print("-" * 40)
        livekit_result = await test_endpoint(
            session, 
            LIVEKIT_TEST_URL, 
            method="POST",
            data={},
            name="LiveKit Connection Test"
        )
        print()
        
        # Test 3: Webhook Test
        print("3. Testing Webhook Endpoint")
        print("-" * 40)
        webhook_result = await test_endpoint(
            session, 
            WEBHOOK_TEST_URL, 
            method="POST",
            name="Webhook Test"
        )
        print()
        
        # Test 4: Create Room Test
        print("4. Testing Room Creation")
        print("-" * 40)
        room_name = f"test-room-{int(datetime.now().timestamp())}"
        room_result = await test_endpoint(
            session, 
            CREATE_ROOM_URL, 
            method="POST",
            data={"room_name": room_name},
            name="Room Creation Test"
        )
        print()
        
        # Summary
        print("📊 Test Summary")
        print("=" * 50)
        tests = [
            ("Health Check", health_result),
            ("LiveKit Connection", livekit_result),
            ("Webhook", webhook_result),
            ("Room Creation", room_result)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, result in tests:
            if result["success"]:
                passed += 1
                print(f"✅ {test_name}: PASSED")
            else:
                failed += 1
                print(f"❌ {test_name}: FAILED")
        
        print()
        print(f"Results: {passed} passed, {failed} failed")
        
        # Recommendations
        print()
        print("💡 Recommendations")
        print("=" * 50)
        
        if not health_result["success"]:
            print("• Modal deployment may not be running or accessible")
            print("• Check if the app is deployed: modal app list")
            print("• Check app status: modal app logs <app-name>")
        
        if not livekit_result["success"]:
            print("• LiveKit connection is failing")
            print("• Check environment variables in Modal secrets")
            print("• Verify LiveKit credentials and URL")
        
        if not webhook_result["success"]:
            print("• Webhook endpoint is not working")
            print("• Check if the function is properly deployed")
        
        if not room_result["success"]:
            print("• Room creation is failing")
            print("• Check Modal function logs for errors")
            print("• Verify the worker function is working")
        
        if passed == 4:
            print("🎉 All tests passed! Modal deployment appears to be working correctly.")
            print("• Try starting a voice session from the frontend")
            print("• Check Modal logs for agent connection messages")
        
        return passed, failed

def main():
    """Main function to run the tests"""
    try:
        passed, failed = asyncio.run(test_modal_deployment())
        
        if failed > 0:
            print(f"\n⚠️  {failed} test(s) failed. Check the recommendations above.")
            sys.exit(1)
        else:
            print(f"\n✅ All {passed} tests passed!")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 