#!/bin/bash
# Quick test script for the refactored backend

echo "🧪 Testing Course Pilot Hybrid RAG Backend"
echo "=========================================="
echo ""

# Check if running
echo "1️⃣  Testing health endpoint..."
curl -s http://localhost:8080/api/health | python3 -m json.tool
echo ""

# Test semantic search
echo "2️⃣  Testing semantic search (machine learning)..."
curl -s -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "machine learning",
    "skills": ["python", "math"],
    "resume": "interested in AI and data science",
    "schedule": []
  }' | python3 -m json.tool | head -n 50
echo ""

# Test exact course ID search
echo "3️⃣  Testing keyword search (15-112)..."
curl -s -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "15-112",
    "skills": [],
    "resume": "",
    "schedule": []
  }' | python3 -m json.tool | head -n 50
echo ""

echo "✅ Test complete!"
