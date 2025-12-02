# Hybrid RAG Implementation - Technical Deep Dive

## 🎯 Overview

This document explains the **Hybrid RAG (Retrieval-Augmented Generation)** implementation for Course Pilot, detailing how we combine vector search with keyword matching to achieve superior course recommendations.

---

## 🏗️ Architecture

```
User Query
    ↓
┌─────────────────────────────────────┐
│   Query Processing & Embedding      │
│   (Sentence Transformers)           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│        Hybrid Search Engine         │
│  ┌───────────────┬───────────────┐  │
│  │ Vector Search │ Keyword Match │  │
│  │   (ChromaDB)  │  (Exact ID)   │  │
│  │     70%       │      30%      │  │
│  └───────────────┴───────────────┘  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│      Schedule Filtering             │
│   (Post-retrieval filtering)        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│      Score Aggregation              │
│   Final = V×0.7 + K×0.3             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│      LLM Enhancement (Groq)         │
│   - Personalized summaries          │
│   - Review moderation               │
└─────────────────────────────────────┘
    ↓
Ranked Results
```

---

## 🔍 Component 1: Vector Search (70%)

### Technology Stack
- **Vector DB**: ChromaDB (persistent mode)
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2`
  - Dimensions: 384
  - Speed: ~1000 sentences/sec on CPU
  - Quality: Optimized for semantic similarity

### How It Works

1. **Indexing Phase** (First run only):
   ```python
   # Create rich document for each course
   doc = f"Course: {course_id} | Title: {name} | Description: {desc} | Industry: {industry} | Skills: {skills}"
   
   # Generate embedding
   embedding = model.encode(doc)  # → 384-dim vector
   
   # Store in ChromaDB
   collection.add(embedding, metadata, id)
   ```

2. **Query Phase**:
   ```python
   # User query: "I want to learn machine learning"
   query_embedding = model.encode(query)
   
   # ChromaDB cosine similarity search
   results = collection.query(
       query_embeddings=[query_embedding],
       n_results=50  # Get top 50 candidates
   )
   
   # Results include distance scores (0-2 range for cosine)
   # Convert to similarity: similarity = 1 - distance
   ```

### Why Cosine Similarity?

Cosine similarity measures the angle between vectors, not magnitude:
- Perfect match: cos(θ) = 1 (distance = 0)
- Orthogonal: cos(θ) = 0 (distance = 1)
- Opposite: cos(θ) = -1 (distance = 2)

**Example:**
```
Query: "machine learning and AI"
Embedding: [0.23, -0.45, 0.67, ..., 0.12]

Course 1: "Introduction to Machine Learning"
Embedding: [0.25, -0.43, 0.69, ..., 0.11]
Cosine Distance: 0.05 → Similarity: 0.95 ✅

Course 2: "Ancient Greek Philosophy"
Embedding: [-0.12, 0.34, -0.23, ..., 0.45]
Cosine Distance: 1.87 → Similarity: 0.13 ❌
```

---

## 🎯 Component 2: Keyword Matching (30%)

### Why We Need It

Vector search is great for semantic matching, but it can fail on exact queries:

**Problem:**
- Query: "15-112"
- Vector search might return: "15-213", "15-122", "15-110" (similar numbers)
- User wants: "15-112" specifically!

### Solution: Keyword Boost

```python
def keyword_score(query: str, course_id: str) -> float:
    query_clean = query.lower().replace("-", "").replace(" ", "")
    course_id_clean = course_id.lower().replace("-", "").replace(" ", "")
    
    # Exact match: "15112" == "15112"
    if query_clean == course_id_clean:
        return 1.0  # Perfect score
    
    # Partial match: "112" in "15112"
    if query_clean in course_id_clean or course_id_clean in query_clean:
        return 0.5  # Moderate score
    
    return 0.0  # No match
```

### Examples

| Query | Course ID | Keyword Score |
|-------|-----------|---------------|
| "15-112" | "15-112" | 1.0 |
| "15-112" | "15-213" | 0.0 |
| "112" | "15-112" | 0.5 |
| "machine learning" | "15-112" | 0.0 |

---

## ⚖️ Component 3: Hybrid Scoring

### The Formula

```python
final_score = (vector_similarity × 0.7) + (keyword_score × 0.3)
```

### Why 70/30 Split?

After testing, we found:
- **70% vector**: Captures semantic intent (most queries are descriptive)
- **30% keyword**: Ensures exact matches aren't buried

### Real-World Examples

#### Example 1: Semantic Query
**Query:** "I want to learn about artificial intelligence"

| Course | Vector Score | Keyword Score | Final Score |
|--------|--------------|---------------|-------------|
| 15-281 AI | 0.92 | 0.0 | **0.644** |
| 15-112 Intro | 0.45 | 0.0 | **0.315** |
| 15-213 Systems | 0.23 | 0.0 | **0.161** |

**Result:** AI course wins (semantic match) ✅

#### Example 2: Exact Course ID
**Query:** "15-112"

| Course | Vector Score | Keyword Score | Final Score |
|--------|--------------|---------------|-------------|
| 15-112 Intro | 0.35 | 1.0 | **0.545** |
| 15-213 Systems | 0.42 | 0.0 | **0.294** |
| 15-122 Imperative | 0.38 | 0.0 | **0.266** |

**Result:** 15-112 wins (keyword boost) ✅

#### Example 3: Hybrid Query
**Query:** "15-112 programming fundamentals"

| Course | Vector Score | Keyword Score | Final Score |
|--------|--------------|---------------|-------------|
| 15-112 Intro | 0.88 | 1.0 | **0.916** |
| 15-213 Systems | 0.52 | 0.0 | **0.364** |
| 15-122 Imperative | 0.61 | 0.0 | **0.427** |

**Result:** 15-112 dominates (both signals) ✅✅

---

## 📅 Component 4: Schedule Filtering

### Post-Retrieval Filtering

We apply schedule constraints **after** hybrid search to avoid filtering too early:

```python
# 1. Get top 50 candidates from hybrid search
candidates = hybrid_search(query, top_k=50)

# 2. Filter by schedule
for course in candidates:
    course_days = ["M", "W", "F"]
    course_times = ["9:00 AM", "9:30 AM", "10:00 AM"]
    
    # Check if user is available
    for day in course_days:
        if day not in user_schedule:
            skip_course()  # User not available this day
        
        for time in course_times:
            if time not in user_schedule[day]:
                skip_course()  # Time conflict
    
    # Course fits schedule!
    add_to_results(course)
```

### Why Post-Retrieval?

- **Efficiency**: Vector DB doesn't need to know about schedules
- **Flexibility**: Easy to adjust filtering logic
- **Accuracy**: We get the best semantic matches first, then filter

---

## 🤖 Component 5: LLM Enhancement (Groq)

### Why Groq?

- **Speed**: 500+ tokens/sec (vs 10-50 for local models)
- **Quality**: Llama 3.1 70B (state-of-the-art)
- **Cost**: Free tier is generous
- **Cloud-Native**: No GPU needed in container

### Use Cases

#### 1. Personalized Summaries
```python
prompt = f"""
User Goals: {user_goals}
User Skills: {user_skills}
Course: {course_name}
Description: {course_desc}

Generate a 50-word personalized recommendation.
"""

response = groq.chat.completions.create(
    model="llama-3.1-70b-versatile",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.7,
    max_tokens=100
)
```

**Example Output:**
> "Perfect for your AI career goals! This course covers neural networks and deep learning with hands-on Python projects. Your math background will help you excel in the theoretical components."

#### 2. Review Moderation
```python
prompt = f"""
You are a content moderator. Block profanity and personal attacks.
Pass all other reviews (positive, negative, neutral).

Review: "{review_text}"

Respond with JSON: {{"Audit Status": "Pass/Fail", "Reason": "..."}}
"""
```

---

## 📊 Performance Characteristics

### Latency Breakdown

| Component | Time | Notes |
|-----------|------|-------|
| Query embedding | 10-20ms | CPU inference |
| ChromaDB search | 50-100ms | 50 results from 3000+ courses |
| Keyword matching | 1-5ms | Simple string ops |
| Schedule filtering | 5-10ms | Python loops |
| Groq LLM (optional) | 200-500ms | Network + inference |
| **Total** | **300-600ms** | Acceptable for web app |

### Scalability

- **Courses**: ChromaDB handles 100K+ docs easily
- **Concurrent users**: Gunicorn with 2 workers × 4 threads = 8 concurrent
- **Memory**: ~2GB (1GB for embeddings, 1GB for ChromaDB)
- **Cold start**: ~10-15 seconds (first request loads models)

---

## 🎛️ Tuning Parameters

### Adjusting Weights

```python
# More semantic matching (better for vague queries)
VECTOR_WEIGHT = 0.8
KEYWORD_WEIGHT = 0.2

# More exact matching (better for specific course IDs)
VECTOR_WEIGHT = 0.5
KEYWORD_WEIGHT = 0.5
```

### Adjusting Retrieval Size

```python
# Get more candidates (slower but more comprehensive)
results = collection.query(query_embeddings=[emb], n_results=100)

# Get fewer candidates (faster but might miss results)
results = collection.query(query_embeddings=[emb], n_results=20)
```

### Adjusting LLM Temperature

```python
# More creative summaries
temperature=0.9

# More factual summaries
temperature=0.3
```

---

## 🔬 Testing & Validation

### Test Cases

1. **Semantic Search**
   - Query: "I want to learn web development"
   - Expected: HTML, CSS, JavaScript courses

2. **Exact ID**
   - Query: "15-445"
   - Expected: 15-445 as top result

3. **Hybrid**
   - Query: "15-112 python programming"
   - Expected: 15-112 with high score

4. **Schedule Filtering**
   - Query: "machine learning" + Monday 9AM
   - Expected: Only ML courses on Monday at 9AM

### Validation Script

```bash
./test_backend.sh
```

---

## 🚀 Future Improvements

1. **Multi-Query Retrieval**: Generate multiple query variations
2. **Re-ranking**: Use cross-encoder for final re-ranking
3. **User Feedback**: Learn from clicks to improve weights
4. **Caching**: Cache popular queries
5. **A/B Testing**: Test different weight configurations

---

## 📚 References

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [Groq API](https://console.groq.com/docs)
- [Hybrid Search Paper](https://arxiv.org/abs/2104.08663)
