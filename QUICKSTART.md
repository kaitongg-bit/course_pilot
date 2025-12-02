# 🚀 Quick Start Guide

## Prerequisites

1. **Groq API Key** (Free)
   - Sign up at: https://console.groq.com/
   - Get your API key: https://console.groq.com/keys
   - Copy the key (starts with `gsk_...`)

2. **Python 3.9+**
   ```bash
   python3 --version  # Should be 3.9 or higher
   ```

---

## Option 1: Local Development (Fastest)

### 1. Set Environment Variable
```bash
export GROQ_API_KEY="gsk_your_actual_key_here"
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- ChromaDB (vector database)
- Sentence Transformers (embeddings)
- Groq (LLM API)

**Note:** First install takes ~2-3 minutes to download models.

### 3. Start the Server
```bash
python llm-proxy.py
```

**First run output:**
```
🔧 Initializing vector database...
✓ Loaded sentence-transformers model
📦 Creating new course collection...
📥 Ingesting courses into vector database...
🔄 Embedding 3289 courses...
✓ Successfully indexed 3289 courses
✓ Groq client initialized
✓ Loaded 3289 courses from CSV
✓ Loaded reviews for 1234 courses
✅ Initialization complete!
 * Running on http://0.0.0.0:8080
```

**Subsequent runs:** ~5 seconds (ChromaDB index is cached)

### 4. Test It
Open a new terminal:
```bash
./test_backend.sh
```

Or manually:
```bash
# Health check
curl http://localhost:8080/api/health

# Search for courses
curl -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{"goal": "machine learning", "skills": ["python"], "resume": "", "schedule": []}'
```

---

## Option 2: Docker (Production-like)

### 1. Build the Image
```bash
docker build -t course-pilot-backend .
```

**Build time:** ~5-10 minutes (first time)

### 2. Run the Container
```bash
docker run -p 8080:8080 \
  -e GROQ_API_KEY="gsk_your_actual_key_here" \
  course-pilot-backend
```

### 3. Test It
```bash
curl http://localhost:8080/api/health
```

---

## Option 3: Google Cloud Run (Production)

### Prerequisites
- Google Cloud account
- `gcloud` CLI installed: https://cloud.google.com/sdk/docs/install

### 1. Authenticate
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Build and Push
```bash
export PROJECT_ID=$(gcloud config get-value project)

docker build -t gcr.io/$PROJECT_ID/course-pilot-backend .
docker push gcr.io/$PROJECT_ID/course-pilot-backend
```

### 3. Deploy
```bash
gcloud run deploy course-pilot-backend \
  --image gcr.io/$PROJECT_ID/course-pilot-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY="gsk_your_actual_key_here" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300
```

### 4. Get Your URL
```bash
gcloud run services describe course-pilot-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

Output: `https://course-pilot-backend-xxxxx-uc.a.run.app`

### 5. Test It
```bash
curl https://your-cloud-run-url.run.app/api/health
```

---

## 🧪 Testing the API

### 1. Health Check
```bash
curl http://localhost:8080/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "courses_count": 3289,
  "vector_db_count": 3289,
  "groq_enabled": true
}
```

### 2. Semantic Search
```bash
curl -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "I want to learn artificial intelligence",
    "skills": ["python", "math"],
    "resume": "interested in machine learning",
    "schedule": []
  }'
```

**Expected:** Courses about AI, ML, neural networks

### 3. Exact Course ID
```bash
curl -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "15-112",
    "skills": [],
    "resume": "",
    "schedule": []
  }'
```

**Expected:** 15-112 as the top result

### 4. Schedule Filtering
```bash
curl -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "machine learning",
    "skills": [],
    "resume": "",
    "schedule": [
      {"day": "M", "times": ["9:00 AM", "9:30 AM", "10:00 AM"]},
      {"day": "W", "times": ["9:00 AM", "9:30 AM", "10:00 AM"]},
      {"day": "F", "times": ["9:00 AM", "9:30 AM", "10:00 AM"]}
    ]
  }'
```

**Expected:** Only ML courses on MWF 9-10 AM

---

## 🔧 Troubleshooting

### "ModuleNotFoundError: No module named 'chromadb'"
**Solution:** Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### "Error: GROQ_API_KEY not found"
**Solution:** Set environment variable
```bash
export GROQ_API_KEY="gsk_your_key_here"
```

### "Port 8080 already in use"
**Solution:** Kill existing process or use different port
```bash
# Kill existing
lsof -ti:8080 | xargs kill -9

# Or use different port
PORT=8081 python llm-proxy.py
```

### "ChromaDB initialization taking too long"
**Solution:** This is normal on first run (indexing 3289 courses)
- Expected time: 30-60 seconds
- Subsequent runs: ~5 seconds (cached)

### "Groq API rate limit exceeded"
**Solution:** Wait a minute or upgrade your Groq plan
- Free tier: 30 requests/minute
- Check limits: https://console.groq.com/settings/limits

---

## 📊 Performance Expectations

| Metric | Value |
|--------|-------|
| **First startup** | 30-60 seconds (indexing) |
| **Subsequent startups** | 5-10 seconds |
| **Health check** | < 10ms |
| **Course search** | 300-600ms |
| **Memory usage** | ~2GB |
| **CPU usage** | ~50% (during search) |

---

## 🎯 Next Steps

1. ✅ Backend is running
2. 🔲 Update Chrome Extension API endpoint
3. 🔲 Test end-to-end flow
4. 🔲 Deploy to Cloud Run (optional)
5. 🔲 Monitor performance

---

## 📚 Documentation

- **DEPLOYMENT.md** - Full deployment guide
- **HYBRID_RAG_EXPLAINED.md** - Technical deep dive
- **REFACTORING_SUMMARY.md** - Complete refactoring summary
- **README.md** - Original project README

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the full documentation in `DEPLOYMENT.md`
3. Check Groq API status: https://status.groq.com/
4. Verify your API key: https://console.groq.com/keys

---

## 🎉 You're Ready!

Your hybrid RAG backend is now running and ready to serve intelligent course recommendations!

**Test it now:**
```bash
./test_backend.sh
```
