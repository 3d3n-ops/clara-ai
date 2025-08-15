@echo off
echo Starting Modal Endpoints Testing...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available
    pause
    exit /b 1
)

REM Check if the PowerShell script exists
if not exist "test_modal_endpoints.ps1" (
    echo ERROR: test_modal_endpoints.ps1 not found in current directory
    echo Current directory: %CD%
    echo.
    echo Please ensure you're running this batch file from the same directory
    echo that contains the PowerShell scripts.
    pause
    exit /b 1
)

REM Run the comprehensive test
echo Running comprehensive endpoint tests...
echo Script location: %CD%\test_modal_endpoints.ps1
powershell -ExecutionPolicy Bypass -File "test_modal_endpoints.ps1"

echo.
echo Tests completed. Press any key to exit...
pause >nul 