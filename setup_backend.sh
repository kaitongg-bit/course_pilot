#!/bin/bash
# Setup script for Course Pilot Backend

echo "🚀 Setting up Course Pilot Backend..."

# Always run relative to this script's directory
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

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "🎉 Setup complete!"
echo "Run './start_backend.sh' to start the server."
