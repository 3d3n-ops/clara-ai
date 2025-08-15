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

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
echo Batch file directory: %SCRIPT_DIR%

REM Check if the PowerShell script exists in the same directory
if not exist "%SCRIPT_DIR%test_modal_endpoints.ps1" (
    echo ERROR: test_modal_endpoints.ps1 not found in %SCRIPT_DIR%
    echo.
    echo Please ensure the PowerShell scripts are in the same directory
    echo as this batch file.
    pause
    exit /b 1
)

REM Change to the script directory and run the test
echo Changing to script directory: %SCRIPT_DIR%
cd /d "%SCRIPT_DIR%"

REM Run the comprehensive test
echo Running comprehensive endpoint tests...
echo Script location: %CD%\test_modal_endpoints.ps1
powershell -ExecutionPolicy Bypass -File "test_modal_endpoints.ps1"

echo.
echo Tests completed. Press any key to exit...
pause >nul 