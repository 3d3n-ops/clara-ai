#!/bin/bash

echo ""
echo "========================================"
echo "   Clara AI Local Voice Agent"
echo "========================================"
echo ""
echo "Starting local voice agent..."
echo ""
echo "Commands you can try:"
echo "- create diagram [topic]"
echo "- make flashcards [topic]"  
echo "- show quiz [topic]"
echo "- create mindmap [topic]"
echo "- help"
echo "- bye"
echo ""
echo "========================================"
echo ""

python3 local_voice_agent.py

echo ""
echo "========================================"
echo "Session ended. Generated content saved in:"
echo "generated_content/"
echo "========================================" 