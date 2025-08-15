@echo off
echo Starting Clara AI Local Agent Server...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
pip install -r local_agent_server_requirements.txt

REM Start the server
echo.
echo Starting local agent server on http://localhost:5001
echo Press Ctrl+C to stop the server
echo.
python run_local_agent_server.py

pause 