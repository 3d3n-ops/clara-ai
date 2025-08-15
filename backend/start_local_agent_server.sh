#!/bin/bash

echo "Starting Clara AI Local Agent Server..."
echo

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ and try again"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r local_agent_server_requirements.txt

# Start the server
echo
echo "Starting local agent server on http://localhost:5001"
echo "Press Ctrl+C to stop the server"
echo
python3 run_local_agent_server.py 