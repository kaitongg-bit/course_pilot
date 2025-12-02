#!/usr/bin/env python3
"""
Course Pilot - Cloud-Native Hybrid RAG Backend
Powered by ChromaDB (vector search) + Groq (LLM inference)
Designed for Google Cloud Run deployment
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Tuple

import chromadb
from chromadb.config import Settings
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for Chrome Extension

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"  # Stable general model
PORT = int(os.environ.get("PORT", 8080))  # Cloud Run compatibility

# Vector search weights
VECTOR_WEIGHT = 0.7
KEYWORD_WEIGHT = 0.3

# ---------------------------------------------------------------------
# Initialize Vector Database (ChromaDB)
# ---------------------------------------------------------------------

embedding_model = None
chroma_client = None
course_collection = None


def init_vector_db():
    """Initialize ChromaDB with persistent storage and sentence transformers."""
    global embedding_model, chroma_client, course_collection
    
    print("🔧 Initializing vector database...")
    
    # Load embedding model
    embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print("✓ Loaded sentence-transformers model")
    
    # Initialize ChromaDB with persistent storage
    backend_dir = Path(__file__).resolve().parent
    db_path = backend_dir / "chroma_db"
    db_path.mkdir(exist_ok=True)
    
    chroma_client = chromadb.PersistentClient(
        path=str(db_path),
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
    
    # Get or create collection
    try:
        course_collection = chroma_client.get_collection(name="courses")
        print(f"✓ Loaded existing collection with {course_collection.count()} courses")
    except Exception:
        print("📦 Creating new course collection...")
        course_collection = chroma_client.create_collection(
            name="courses",
            metadata={"hnsw:space": "cosine"}
        )
        # Ingest courses into vector DB
        ingest_courses_to_vector_db()


def ingest_courses_to_vector_db():
    """Load courses from CSV and index them in ChromaDB."""
    global course_collection
    
    print("📥 Ingesting courses into vector database...")
    
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    csv_path = repo_root / "courses_full_dataset_combined_courses.csv"
    
    if not csv_path.exists():
        csv_path = repo_root / "cmu_labeled_llm_final.csv"
    
    if not csv_path.exists():
        raise FileNotFoundError(f"Course data CSV not found at {csv_path}")
    
    courses = []
    documents = []
    metadatas = []
    ids = []
    
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader):
            course_id = row.get("course_id", f"course_{idx}")
            
            # Create rich text representation for embedding
            doc_text = create_course_document(row)
            
            courses.append(row)
            documents.append(doc_text)
            # Use row index as unique ID to avoid duplicates in CSV
            ids.append(f"row_{idx}")
            
            # Store metadata for filtering (keep original course_id in metadata)
            metadatas.append({
                "course_id": course_id,
                "course_name": row.get("course_name", ""),
                "industry": row.get("industry", ""),
                "level": row.get("level", ""),
                "weekday": row.get("weekday", ""),
                "start": row.get("start", ""),
                "end": row.get("end", "")
            })
    
    # Batch embed and add to ChromaDB
    print(f"🔄 Embedding {len(documents)} courses...")
    embeddings = embedding_model.encode(documents, show_progress_bar=True).tolist()
    
    course_collection.add(
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✓ Successfully indexed {len(courses)} courses")


def create_course_document(course: Dict[str, Any]) -> str:
    """Create a rich text document for embedding."""
    parts = []
    
    # Course ID and name (high importance)
    if course.get("course_id"):
        parts.append(f"Course: {course['course_id']}")
    if course.get("course_name"):
        parts.append(f"Title: {course['course_name']}")
    
    # Description
    desc = course.get("description_clean") or course.get("description", "")
    if desc:
        parts.append(f"Description: {desc}")
    
    # Industry and skills
    if course.get("industry"):
        parts.append(f"Industry: {course['industry']}")
    
    skills = course.get("skills", "")
    if skills:
        # Clean up stringified list format
        skills_clean = skills.replace("[", "").replace("]", "").replace("'", "").replace('"', "")
        parts.append(f"Skills: {skills_clean}")
    
    # Keywords
    if course.get("keywords"):
        parts.append(f"Keywords: {course['keywords']}")
    
    return " | ".join(parts)


# ---------------------------------------------------------------------
# Initialize Groq Client
# ---------------------------------------------------------------------

groq_client = None

def init_groq():
    """Initialize Groq API client."""
    global groq_client
    
    if not GROQ_API_KEY:
        print("⚠️  GROQ_API_KEY not found. LLM features will be disabled.")
        return
    
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✓ Groq client initialized")
    except Exception as e:
        print(f"✗ Error initializing Groq: {e}")


# ---------------------------------------------------------------------
# Course Data Loading (for metadata and filtering)
# ---------------------------------------------------------------------

def parse_time_slots(start_str: str, end_str: str) -> List[str]:
    """Convert start/end times into 30-min slots."""
    if not start_str or not end_str:
        return []
    
    start_str = start_str.strip().upper()
    end_str = end_str.strip().upper()
    
    def to_mins(t_str):
        try:
            parts = t_str.replace(".", "").split()
            if len(parts) != 2:
                return -1
            time_part, period = parts
            h, m = map(int, time_part.split(":"))
            if period == "PM" and h != 12:
                h += 12
            if period == "AM" and h == 12:
                h = 0
            return h * 60 + m
        except:
            return -1
    
    start_mins = to_mins(start_str)
    end_mins = to_mins(end_str)
    
    if start_mins == -1 or end_mins == -1:
        return []
    
    slots = []
    current_mins = start_mins
    
    while current_mins < end_mins:
        h = current_mins // 60
        m = current_mins % 60
        period = "AM"
        if h >= 12:
            period = "PM"
            if h > 12:
                h -= 12
        if h == 0:
            h = 12
        
        time_str = f"{h}:{m:02d} {period}"
        slots.append(time_str)
        current_mins += 30
    
    return slots


def parse_days(weekday_str: str) -> List[str]:
    """Convert 'MWF' -> ['M', 'W', 'F']"""
    if not weekday_str or weekday_str == "TBA":
        return []
    
    days = []
    valid_chars = set(['M', 'T', 'W', 'R', 'F', 'S', 'U'])
    for char in weekday_str.upper():
        if char in valid_chars:
            days.append(char)
    return days


def load_courses() -> List[Dict[str, Any]]:
    """Load courses from CSV with schedule parsing."""
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    csv_path = repo_root / "courses_full_dataset_combined_courses.csv"
    
    if not csv_path.exists():
        csv_path = repo_root / "cmu_labeled_llm_final.csv"
    
    if not csv_path.exists():
        raise FileNotFoundError(f"Course data CSV not found at {csv_path}")
    
    courses = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            weekday = row.get("weekday", "")
            start = row.get("start", "")
            end = row.get("end", "")
            
            row["_days"] = parse_days(weekday)
            row["_times"] = parse_time_slots(start, end)
            
            if weekday and start and end:
                row["_meetingTime"] = f"{weekday} {start}-{end}"
            else:
                row["_meetingTime"] = "TBA"
            
            # Parse tags
            industry = row.get("industry", "").strip()
            skills_str = row.get("skills", "")
            skills_str = skills_str.replace("[", "").replace("]", "").replace("'", "").replace('"', "")
            skills_list = [s.strip() for s in skills_str.split(",") if s.strip()]
            
            row["skills"] = skills_list
            tags = []
            if industry:
                tags.append(industry)
            tags.extend(skills_list)
            row["tags"] = tags
            
            courses.append(row)
    
    print(f"✓ Loaded {len(courses)} courses from CSV")
    return courses


def load_reviews() -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, float], Dict[str, float]]:
    """Load reviews from CSV."""
    reviews_map = {}
    workload_hours_map = {}
    ratings_map = {}
    
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    csv_path = repo_root / "course_review.csv"
    
    if not csv_path.exists():
        print(f"⚠️  Reviews file not found at {csv_path}")
        return {}, {}, {}
    
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row.get("CourseID", "").strip()
                if not cid:
                    continue
                
                # Workload hours
                try:
                    hours = int(row.get("WorkloadHours", 0))
                    if hours > 0:
                        if cid not in workload_hours_map:
                            workload_hours_map[cid] = []
                        workload_hours_map[cid].append(hours)
                except ValueError:
                    pass
                
                # Ratings
                try:
                    overall_rating = int(row.get("OverallRating", 0))
                    if overall_rating > 0:
                        if cid not in ratings_map:
                            ratings_map[cid] = []
                        ratings_map[cid].append(overall_rating)
                except ValueError:
                    pass
                
                # Workload label
                try:
                    wl_rating = int(row.get("WorkloadRating", "3"))
                    if wl_rating <= 2:
                        wl_label = "Light"
                    elif wl_rating == 3:
                        wl_label = "Medium"
                    else:
                        wl_label = "Heavy"
                except ValueError:
                    wl_label = "Medium"
                
                review = {
                    "id": row.get("RowID", ""),
                    "author": "Student",
                    "semester": row.get("Timestamp", "").split("T")[0],
                    "rating": int(row.get("OverallRating", 5) or 5),
                    "text": row.get("Comment", ""),
                    "likes": 0,
                    "workload": wl_label,
                    "workflow": row.get("Workflow", ""),
                    "interest": int(row.get("InterestRating", 5) or 5),
                    "utility": int(row.get("UtilityRating", 5) or 5)
                }
                
                if cid not in reviews_map:
                    reviews_map[cid] = []
                reviews_map[cid].append(review)
        
        # Calculate averages
        avg_workload_map = {}
        for cid, hours_list in workload_hours_map.items():
            avg_workload_map[cid] = sum(hours_list) / len(hours_list)
        
        avg_rating_map = {}
        for cid, rating_list in ratings_map.items():
            avg_rating_map[cid] = round(sum(rating_list) / len(rating_list), 1)
        
        print(f"✓ Loaded reviews for {len(reviews_map)} courses")
        return reviews_map, avg_workload_map, avg_rating_map
    
    except Exception as e:
        print(f"✗ Error loading reviews: {e}")
        return {}, {}, {}


# Load course data
COURSES = load_courses()
REVIEWS_MAP, WORKLOAD_HOURS_MAP, RATINGS_MAP = load_reviews()

# Create course lookup by ID
COURSES_BY_ID = {str(c.get("course_id", "")): c for c in COURSES}

# ---------------------------------------------------------------------
# Hybrid Search Implementation
# ---------------------------------------------------------------------

def keyword_score(query: str, course_id: str) -> float:
    """
    Calculate keyword match score.
    Heavily weights exact course ID matches (e.g., "15-112").
    """
    query_clean = query.lower().replace("-", "").replace(" ", "")
    course_id_clean = course_id.lower().replace("-", "").replace(" ", "")
    
    # Exact match
    if query_clean == course_id_clean:
        return 1.0
    
    # Partial match
    if query_clean in course_id_clean or course_id_clean in query_clean:
        return 0.5
    
    return 0.0


def hybrid_search(query: str, user_schedule: Dict[str, set], top_k: int = 20) -> List[Tuple[float, Dict[str, Any]]]:
    """
    Hybrid search combining:
    1. Vector similarity (70%)
    2. Keyword matching (30%)
    
    Returns: List of (score, course) tuples
    """
    if not query.strip():
        query = "general course"
    
    # Step 1: Vector search using ChromaDB
    results = course_collection.query(
        query_texts=[query],
        n_results=min(50, course_collection.count())  # Get more candidates for reranking
    )
    
    scored_courses = []
    
    
    for i, row_id in enumerate(results['ids'][0]):
        # Get the actual course_id from metadata (ChromaDB ID is now row_X)
        actual_course_id = results['metadatas'][0][i].get('course_id', '')
        
        # Get vector similarity score (ChromaDB returns distances, convert to similarity)
        vector_score = 1.0 - results['distances'][0][i]  # Cosine distance -> similarity
        
        # Get keyword score using actual course_id
        kw_score = keyword_score(query, actual_course_id)
        
        # Hybrid score
        final_score = (vector_score * VECTOR_WEIGHT) + (kw_score * KEYWORD_WEIGHT)
        
        # Get full course data using actual course_id
        course = COURSES_BY_ID.get(actual_course_id)
        if not course:
            continue
        
        # Apply schedule filtering
        if user_schedule:
            course_days = course.get("_days", [])
            course_times = course.get("_times", [])
            
            if not course_days or not course_times:
                continue  # Skip TBA courses if user has schedule preference
            
            is_compatible = True
            for day in course_days:
                if day not in user_schedule:
                    is_compatible = False
                    break
                
                user_times = user_schedule[day]
                for t in course_times:
                    if t not in user_times:
                        is_compatible = False
                        break
                if not is_compatible:
                    break
            
            if not is_compatible:
                continue
        
        scored_courses.append((final_score, course))
    
    # Sort by hybrid score
    scored_courses.sort(key=lambda x: x[0], reverse=True)
    
    return scored_courses[:top_k]


# ---------------------------------------------------------------------
# LLM Generation (Groq)
# ---------------------------------------------------------------------

def generate_course_summary(course: Dict[str, Any], user_profile: Dict[str, Any]) -> str:
    """Generate personalized course summary using Groq."""
    if not groq_client:
        # Fallback to description
        return course.get("description_clean") or course.get("description") or "No description available."
    
    try:
        prompt = f"""Based on the user profile and course information below, generate a personalized course recommendation (max 60 words).

STRICT RULES:
1. Do NOT start with "Unlock", "Discover", "Elevate", "Take your...", or "This course...".
2. Do NOT use marketing fluff or clichés.
3. Start directly with WHY this course fits the user's specific goals or skills.
4. Be conversational but professional.
5. Output ONLY the recommendation text.

User Goals: {user_profile.get("career_goals", "Not specified")}
User Skills: {", ".join(user_profile.get("skills", [])) if user_profile.get("skills") else "Not specified"}
Course: {course.get("course_name", "")}
Description: {course.get("description_clean") or course.get("description", "")}

Recommendation:"""
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise, practical career advisor. You give direct, personalized advice without marketing jargon."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=GROQ_MODEL,
            temperature=0.7,
            max_tokens=300,  # Increased to prevent cutoff
        )
        
        summary = chat_completion.choices[0].message.content.strip()
        
        # Clean up quotes if present
        if summary.startswith('"') and summary.endswith('"'):
            summary = summary[1:-1]
            
        return summary
    
    except Exception as e:
        print(f"✗ Groq error: {e}")
        return course.get("description_clean") or course.get("description") or "No description available."


def audit_review_with_groq(review_text: str) -> Dict[str, str]:
    """Audit review using Groq for content moderation."""
    # Basic validation
    if len(review_text) < 15:
        return {"Audit Status": "Fail", "Reason": "Review is less than 15 characters long."}
    
    # Python-based safety checks
    text_lower = review_text.lower()
    positive_words = ["awesome", "loved", "great", "best", "amazing", "excellent", "good", "helpful", "enjoyed", "cool"]
    neutral_words = ["alright", "ok", "okay", "fine", "average", "decent", "fair", "middle", "mediocre", "passable"]
    severe_bad_words = ["fuck", "shit", "bitch", "asshole", "idiot", "stupid", "jerk", "hate", "terrible", "horrible"]
    
    has_positive = any(w in text_lower for w in positive_words)
    has_neutral = any(w in text_lower for w in neutral_words)
    has_bad = any(w in text_lower for w in severe_bad_words)
    
    if (has_positive or has_neutral) and not has_bad:
        return {"Audit Status": "Pass", "Reason": "Safe content (Auto-validated)"}
    
    if not groq_client:
        return {"Audit Status": "Pass", "Reason": "Basic validation passed"}
    
    try:
        prompt = f"""You are a content moderator. Your ONLY job is to block profanity, hate speech, and personal attacks.
You must PASS all other reviews, whether they are positive, negative, or neutral.

Review to audit: "{review_text}"

Respond with ONLY a JSON object in this exact format:
{{"Audit Status": "Pass" or "Fail", "Reason": "brief reason"}}"""
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a content moderator. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model=GROQ_MODEL,
            temperature=0.0,
            max_tokens=100,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        result = json.loads(response_text)
        
        if "Audit Status" not in result or "Reason" not in result:
            raise ValueError("Invalid JSON structure")
        
        return result
    
    except Exception as e:
        print(f"✗ Groq audit error: {e}")
        return {"Audit Status": "Pass", "Reason": "Fallback validation"}


# ---------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health() -> Any:
    """Health check endpoint for Cloud Run."""
    return jsonify({
        "status": "ok",
        "courses_count": len(COURSES),
        "vector_db_count": course_collection.count() if course_collection else 0,
        "groq_enabled": groq_client is not None
    })


@app.route("/api/courses/match", methods=["POST"])
def api_match_courses() -> Any:
    """
    Match courses using hybrid RAG search.
    
    Request body:
    {
      "goal": "machine learning",
      "skills": ["python", "math"],
      "resume": "...",
      "schedule": [
        {"day": "M", "times": ["9:00 AM", "9:30 AM"]},
        ...
      ]
    }
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"Invalid JSON: {e}"}), 400
    
    goal = payload.get("goal", "")
    skills = payload.get("skills", [])
    resume = payload.get("resume", "")
    
    # Build query
    query_parts = [goal]
    if isinstance(skills, list):
        query_parts.extend(skills)
    else:
        query_parts.append(str(skills))
    query_parts.append(resume)
    
    query = " ".join(str(p) for p in query_parts if p).strip()
    
    # Parse schedule
    user_schedule_map = {}
    for item in payload.get("schedule", []):
        day = item.get("day")
        times = item.get("times", [])
        if day and times:
            user_schedule_map[day] = set(times)
    
    # Perform hybrid search
    results = hybrid_search(query, user_schedule_map, top_k=20)
    
    # Build response
    courses_payload = []
    for score, course in results:
        cid = course.get("course_id", "")
        name = course.get("course_name", "Untitled Course")
        
        rating = RATINGS_MAP.get(str(cid), 4.5)
        match_percent = int(round(max(0.0, min(1.0, score)) * 100))
        
        avg_hours = WORKLOAD_HOURS_MAP.get(str(cid), 0)
        if avg_hours == 0:
            workload_label = "Unknown"
        elif avg_hours <= 7:
            workload_label = "Light Workload"
        elif avg_hours <= 11:
            workload_label = "Medium Workload"
        else:
            workload_label = "Heavy Workload"
        
        level = course.get("level", "unknown")
        tags = course.get("tags", [])
        summary = course.get("description_clean", "No description available.")
        reviews = REVIEWS_MAP.get(str(cid), [])
        
        courses_payload.append({
            "course_id": cid,
            "course_name": name,
            "rating": rating,
            "match_percent": match_percent,
            "workload_label": workload_label,
            "level": level,
            "tags": tags[:10],
            "ai_summary": summary,
            "reviews": reviews,
            "industry": course.get("industry", ""),
            "meetingTime": course.get("_meetingTime", ""),
            "days": course.get("_days", []),
            "times": course.get("_times", []),
            "raw": course,
        })
    
    return jsonify({
        "courses": courses_payload,
        "debug": {
            "query": query,
            "total_courses": len(COURSES),
            "vector_db_count": course_collection.count()
        }
    })


@app.route("/api/courses/summarize", methods=["POST"])
def summarize_course() -> Any:
    """Generate personalized course summary using Groq."""
    try:
        data = request.json
        course = data.get('course', {})
        user_profile = data.get('user_profile', {})
        
        summary = generate_course_summary(course, user_profile)
        
        return jsonify({'status': 'success', 'summary': summary})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/review/audit', methods=['POST'])
def audit_review() -> Any:
    """Audit user-submitted reviews using Groq."""
    try:
        review_data = request.json
        review_text = review_data.get("review_text", "")
        
        result = audit_review_with_groq(review_text)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({'Audit Status': "Fail", 'Reason': str(e)}), 500


# ---------------------------------------------------------------------
# Initialization & Entry Point
# ---------------------------------------------------------------------

def initialize():
    """Initialize all components."""
    print("🚀 Initializing Course Pilot Backend...")
    init_vector_db()
    init_groq()
    print("✅ Initialization complete!")


def main() -> None:
    """Main entry point for Cloud Run."""
    initialize()
    app.run(host="0.0.0.0", port=PORT, debug=False)


if __name__ == "__main__":
    main()
