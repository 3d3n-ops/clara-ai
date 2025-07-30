#!/usr/bin/env python3
"""
Test script for the visual generation API endpoint
"""

import requests
import json

def test_visual_generation_api():
    """Test the visual generation API endpoint"""
    
    # Test data
    test_data = {
        "command_type": "diagram",
        "topic": "photosynthesis",
        "context": "Plant biology study session",
        "user_id": "test-user-123"
    }
    
    # Local backend URL
    backend_url = "http://localhost:8000"
    
    try:
        print(f"Testing visual generation API at {backend_url}/voice/generate-visual")
        print(f"Request data: {json.dumps(test_data, indent=2)}")
        
        # Make the request
        response = requests.post(
            f"{backend_url}/voice/generate-visual",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Error! Status: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Backend server is not running")
        print("Start the backend server with: python backend_server.py")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_production_backend():
    """Test the production backend"""
    
    # Test data
    test_data = {
        "command_type": "diagram",
        "topic": "photosynthesis",
        "context": "Plant biology study session",
        "user_id": "test-user-123"
    }
    
    # Production backend URL
    backend_url = "https://clara-ai-kq0a.onrender.com"
    
    try:
        print(f"Testing production visual generation API at {backend_url}/voice/generate-visual")
        print(f"Request data: {json.dumps(test_data, indent=2)}")
        
        # Make the request
        response = requests.post(
            f"{backend_url}/voice/generate-visual",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Error! Status: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Visual Generation API")
    print("=" * 50)
    
    print("\n1. Testing local backend...")
    local_success = test_visual_generation_api()
    
    print("\n2. Testing production backend...")
    production_success = test_production_backend()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"Local backend: {'✅ PASS' if local_success else '❌ FAIL'}")
    print(f"Production backend: {'✅ PASS' if production_success else '❌ FAIL'}")
    
    if not production_success:
        print("\n🔧 Troubleshooting:")
        print("1. The production backend may need to be redeployed")
        print("2. Check if the VisualCommand import is working")
        print("3. Verify the endpoint is properly registered")
        print("4. Check Render logs for any errors") 