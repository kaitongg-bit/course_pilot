#!/bin/bash

echo "🚀 Installing local LLM dependencies..."

# ALWAYS cd into the directory where the script is located
cd "$(dirname "$0")" || exit 1

# Ensure virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚙️ Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
echo "📦 Activating environment..."
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install llama-cpp-python for Intel Mac (your computer)
echo "📥 Installing llama-cpp-python..."
pip install "llama-cpp-python==0.2.32" --no-cache-dir

# Install other dependencies
echo "📥 Installing Python dependencies..."
pip install numpy flask flask-cors scikit-learn nltk

echo "🎉 Installation complete!"
echo "Run 'bash start_llm_server.sh' to start the backend."

