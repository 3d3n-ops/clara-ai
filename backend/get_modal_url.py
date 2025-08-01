#!/usr/bin/env python3

import modal
import subprocess
import sys

try:
    # Try to get the URL from modal serve (this will show the URL)
    result = subprocess.run(['modal', 'serve', 'modal_app.py', '--lookup-name', 'clara-voice-agent'], 
                          capture_output=True, text=True, timeout=30)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    if result.returncode == 0:
        # Extract URL from output
        lines = result.stdout.split('\n')
        for line in lines:
            if 'https://' in line and 'modal.com' in line:
                print(f"Modal URL: {line.strip()}")
    else:
        print(f"Command failed with return code: {result.returncode}")
        
except subprocess.TimeoutExpired:
    print("Command timed out")
except Exception as e:
    print(f"Error: {e}")