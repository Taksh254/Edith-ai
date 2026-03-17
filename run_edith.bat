@echo off
echo Starting EDITH AI Assistant...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

:: Install dependencies if not present
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate

echo Installing requirements...
pip install -r requirements.txt >nul 2>&1

:: Check for API Key
if "%GROQ_API_KEY%"=="" (
    set /p GROQ_API_KEY="Enter your Groq API Key: "
    setx GROQ_API_KEY "%GROQ_API_KEY%"
)

:: Check for ElevenLabs API Key
if "%ELEVENLABS_API_KEY%"=="" (
    set /p ELEVENLABS_API_KEY="Enter your ElevenLabs API Key (optional, press enter to skip): "
    if not "!ELEVENLABS_API_KEY!"=="" (
        setx ELEVENLABS_API_KEY "%ELEVENLABS_API_KEY%"
    ) else (
        if not "%ELEVENLABS_API_KEY%"=="" (
            setx ELEVENLABS_API_KEY "%ELEVENLABS_API_KEY%"
        )
    )
)

echo Launching EDITH GUI...
start python gui.py
