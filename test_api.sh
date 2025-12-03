#!/bin/bash
# Quick test script for the backend API

echo "🧪 Testing Course Pilot Backend API"
echo "==================================="
echo ""

PORT=3002

# Check if running
echo "1️⃣  Testing health endpoint..."
curl -s http://localhost:$PORT/api/health | python3 -m json.tool
echo ""

# Test semantic search
echo "2️⃣  Testing semantic search (machine learning)..."
curl -s -X POST http://localhost:$PORT/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "machine learning",
    "skills": ["python", "math"],
    "resume": "interested in AI and data science",
    "schedule": []
  }' | python3 -m json.tool | head -n 20
echo ""

echo "✅ Test complete!"
