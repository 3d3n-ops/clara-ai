#!/usr/bin/env python3
"""
Check environment variables for Clara AI backend
"""

import os
from dotenv import load_dotenv

def check_environment():
    """Check if all required environment variables are set"""
    load_dotenv()
    
    required_vars = [
        'OPENAI_API_KEY',
        'PINECONE_API_KEY',
        'PINECONE_INDEX_NAME'
    ]
    
    optional_vars = [
        'PORT',
        'ENVIRONMENT'
    ]
    
    print("🔍 Checking environment variables...")
    print("=" * 50)
    
    # Check required variables
    missing_required = []
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * min(len(value), 10)}...")
        else:
            print(f"❌ {var}: NOT SET")
            missing_required.append(var)
    
    print("\n" + "=" * 50)
    
    # Check optional variables
    print("Optional variables:")
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {value}")
        else:
            print(f"⚠️  {var}: NOT SET (optional)")
    
    print("\n" + "=" * 50)
    
    if missing_required:
        print(f"❌ Missing required environment variables: {', '.join(missing_required)}")
        print("Please set these variables in your .env file")
        return False
    else:
        print("✅ All required environment variables are set!")
        return True

if __name__ == "__main__":
    check_environment() 