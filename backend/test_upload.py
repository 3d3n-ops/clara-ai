#!/usr/bin/env python3
"""
Simple test script to verify file upload functionality
"""

import asyncio
import tempfile
import os
from rag_engine import rag_engine

async def test_file_upload():
    """Test file upload functionality"""
    try:
        # Create a test file
        test_content = "This is a test file for Clara AI. It contains some sample text to verify that the upload functionality is working correctly."
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
            temp_file.write(test_content)
            temp_file_path = temp_file.name
        
        try:
            # Test the upload
            result = await rag_engine.process_file(
                file_path=temp_file_path,
                filename="test_file.txt",
                user_id="test_user_123",
                folder_id=None
            )
            
            print(f"Upload result: {result}")
            
            if result.get("success"):
                print("✅ Upload test passed!")
            else:
                print(f"❌ Upload test failed: {result.get('error')}")
                
        finally:
            # Clean up
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_file_upload()) 