@echo off
echo Starting Course Pilot Backend...

:: Check if venv exists
if exist venv (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment 'venv' not found.
    echo Please run the setup steps in README.md first.
)

:: Set environment variables to disable Metal (just in case, though ignored on Windows)
set GGML_METAL_PATH_RESOURCES=
set GGML_USE_METAL=0

:: Run the server
echo Starting Flask server on port 3002...
python backend/llm-proxy.py

pause
