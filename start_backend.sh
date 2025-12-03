#!/bin/bash
# Start Course Pilot Backend Server

echo "🚀 Starting Course Pilot Backend"
echo "=============================="
echo ""

# Always run relative to this script's directory
cd "$(dirname "$0")" || exit 1

# Check for venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Running with system Python..."
fi

# Check for .env
if [ -f "backend/.env" ]; then
    echo "🔑 Loading configuration from backend/.env..."
    export $(cat backend/.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "🔑 Loading configuration from .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found."
    echo "Please set GROQ_API_KEY in backend/.env"
fi

# Start server
echo "🔧 Starting server..."
echo ""
python3 backend/llm-proxy.py
