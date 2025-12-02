# Course Pilot - Cloud Deployment Guide

## 🚀 Hybrid RAG Architecture

This backend has been completely refactored to use a **Hybrid RAG** (Retrieval-Augmented Generation) system:

### Architecture Components

1. **Vector Search (70% weight)** - ChromaDB + Sentence Transformers
   - Model: `all-MiniLM-L6-v2` (384-dimensional embeddings)
   - Persistent storage in `backend/chroma_db/`
   - Cosine similarity for semantic matching

2. **Keyword Matching (30% weight)**
   - Exact course ID matching (e.g., "15-112")
   - Partial ID matching with reduced weight
   - Ensures specific course queries return correct results

3. **LLM Generation** - Groq API
   - Model: `llama-3.1-70b-versatile`
   - Fast inference for course summaries
   - Content moderation for reviews

### Hybrid Search Formula

```
Final Score = (Vector Similarity × 0.7) + (Keyword Match × 0.3)
```

**Why this works:**
- Vector search captures semantic meaning ("machine learning" matches "ML", "AI", "neural networks")
- Keyword matching ensures exact course IDs are prioritized
- Schedule filtering happens AFTER retrieval for efficiency

---

## 📦 Local Testing

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the project root:

```bash
GROQ_API_KEY=your_groq_api_key_here
PORT=8080
```

Get your Groq API key from: https://console.groq.com/keys

### 3. Run Locally

```bash
cd backend
python llm-proxy.py
```

The server will:
1. Initialize ChromaDB (first run will index all courses - takes ~30 seconds)
2. Load course and review data
3. Initialize Groq client
4. Start Flask server on `http://0.0.0.0:8080`

### 4. Test the API

```bash
# Health check
curl http://localhost:8080/api/health

# Course matching
curl -X POST http://localhost:8080/api/courses/match \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "machine learning",
    "skills": ["python", "math"],
    "resume": "interested in AI",
    "schedule": []
  }'
```

---

## 🐳 Docker Build & Test

### Build the image:

```bash
docker build -t course-pilot-backend .
```

### Run locally:

```bash
docker run -p 8080:8080 \
  -e GROQ_API_KEY=your_key_here \
  course-pilot-backend
```

---

## ☁️ Google Cloud Run Deployment

### Prerequisites

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Authenticate: `gcloud auth login`
3. Set project: `gcloud config set project YOUR_PROJECT_ID`

### Deploy Steps

1. **Build and push to Google Container Registry:**

```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id

# Build and tag
docker build -t gcr.io/$PROJECT_ID/course-pilot-backend .

# Push to GCR
docker push gcr.io/$PROJECT_ID/course-pilot-backend
```

2. **Deploy to Cloud Run:**

```bash
gcloud run deploy course-pilot-backend \
  --image gcr.io/$PROJECT_ID/course-pilot-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=your_groq_api_key_here \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300
```

3. **Get your service URL:**

```bash
gcloud run services describe course-pilot-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

4. **Update Chrome Extension:**

Update your extension's API endpoint to the Cloud Run URL:
```javascript
const API_BASE_URL = 'https://course-pilot-backend-xxxxx-uc.a.run.app';
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | - | Groq API key for LLM inference |
| `PORT` | No | 8080 | Server port (Cloud Run overrides this) |

### Resource Requirements

- **Memory**: 2GB recommended (ChromaDB + embeddings)
- **CPU**: 2 vCPU recommended
- **Disk**: Persistent storage for ChromaDB (~500MB)
- **Cold start**: ~10-15 seconds (first request initializes vector DB)

---

## 🧪 Testing the Hybrid Search

### Example 1: Semantic Search

**Query:** "I want to learn about artificial intelligence"

**Result:** Returns courses about ML, AI, neural networks, deep learning (vector similarity)

### Example 2: Exact Course ID

**Query:** "15-112"

**Result:** Returns "15-112 Fundamentals of Programming" as top result (keyword boost)

### Example 3: Schedule Filtering

**Query:** "machine learning" with schedule `[{day: "M", times: ["9:00 AM", "9:30 AM"]}]`

**Result:** Only returns ML courses that meet on Monday at 9:00-9:30 AM

---

## 📊 Performance Metrics

- **Vector search**: ~50-100ms (ChromaDB query)
- **Keyword matching**: ~1-5ms
- **Groq LLM**: ~200-500ms (summary generation)
- **Total latency**: ~300-600ms per request

---

## 🔒 Security Notes

1. **CORS**: Currently set to `*` for development. Update for production:
   ```python
   CORS(app, origins=["chrome-extension://YOUR_EXTENSION_ID"])
   ```

2. **API Key**: Store `GROQ_API_KEY` as a Cloud Run secret:
   ```bash
   echo -n "your_key" | gcloud secrets create groq-api-key --data-file=-
   ```

3. **Rate Limiting**: Consider adding rate limiting for production

---

## 🐛 Troubleshooting

### ChromaDB not initializing
- Check disk space
- Ensure write permissions to `backend/chroma_db/`
- Delete `chroma_db/` folder and restart to rebuild index

### Groq API errors
- Verify API key is correct
- Check Groq API status: https://status.groq.com/
- Review rate limits: https://console.groq.com/settings/limits

### Low match scores
- Adjust weights in `llm-proxy.py`:
  ```python
  VECTOR_WEIGHT = 0.7  # Increase for more semantic matching
  KEYWORD_WEIGHT = 0.3  # Increase for more exact matching
  ```

---

## 📝 Next Steps

1. ✅ Backend refactored to Hybrid RAG
2. ✅ Dockerfile created
3. ✅ Cloud Run ready
4. 🔲 Update Chrome Extension API endpoints
5. 🔲 Deploy to Cloud Run
6. 🔲 Test end-to-end flow
7. 🔲 Monitor performance and adjust weights

---

## 📚 Additional Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Groq API Documentation](https://console.groq.com/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Sentence Transformers](https://www.sbert.net/)
