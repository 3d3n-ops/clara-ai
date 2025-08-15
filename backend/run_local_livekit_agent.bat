@echo off
echo.
echo ========================================
echo    Clara AI Local LiveKit Agent
echo ========================================
echo.
echo This script runs the LiveKit agent locally
echo without requiring Modal deployment.
echo.
echo Features:
echo - Local LiveKit agent simulation
echo - Text-based chat interface
echo - Visual content generation
echo - Session management
echo - Local file storage
echo.
echo Commands you can try:
echo - create diagram [topic]
echo - make flashcards [topic]  
echo - show quiz [topic]
echo - create mindmap [topic]
echo - help
echo - time
echo - bye
echo.
echo ========================================
echo.

cd /d "%~dp0"
python local_livekit_agent.py

echo.
echo ========================================
echo Session ended. Generated content saved in:
echo generated_content/
echo ========================================
pause 