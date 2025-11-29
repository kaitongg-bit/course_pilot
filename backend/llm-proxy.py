#!/usr/bin/env python3
"""
Very simple, robust course-matching backend for Course Pilot.

- Loads courses from ../courses.json (or backend/courses.json as fallback)
- Does *not* call any LLMs
- Uses super-safe string handling (no regex on non-strings)
- Returns: {"courses": [...]} for /api/courses/match
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS
from llama_cpp import Llama

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ---------------------------------------------------------------------
# LLM Initialization
# ---------------------------------------------------------------------

def init_llm():
    """Initialize the LLM model for course summarization and review auditing."""
    import os
    import traceback
    
    # Disable Metal backend to avoid GPU issues - force CPU only
    os.environ['GGML_METAL_PATH_RESOURCES'] = ''
    os.environ['GGML_USE_METAL'] = '0'
    
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    model_path = repo_root / "models" / "qwen2.5-3b-instruct-q4_k_m.gguf"
    
    if not model_path.exists():
        print(f"Warning: LLM model not found at {model_path}")
        return None
    
    try:
        # CPU-only configuration
        llm = Llama(
            model_path=str(model_path),
            n_ctx=2048,
            n_threads=4,
            n_batch=512,
            n_gpu_layers=0,  # Force CPU only
            use_mmap=True,
            use_mlock=False,
            verbose=False  # Disable verbose output
        )
        print(f"✓ LLM model loaded successfully (CPU mode) from {model_path}")
        return llm
    except Exception as e:
        print(f"✗ Error loading LLM model: {e}")
        traceback.print_exc()
        return None

LLM_MODEL = init_llm()

# ---------------------------------------------------------------------
# Loading course data
# ---------------------------------------------------------------------





def parse_time_slots(start_str: str, end_str: str) -> List[str]:
    """
    Convert start/end times (e.g. '9:00 AM', '9:50 AM') into 30-min slots.
    Slots: 8:00 AM, 8:30 AM, ..., 7:00 PM
    """
    if not start_str or not end_str:
        return []

    # Standardize format
    start_str = start_str.strip().upper()
    end_str = end_str.strip().upper()

    # Helper to convert "9:00 AM" -> minutes from midnight
    def to_mins(t_str):
        try:
            parts = t_str.replace(".", "").split()
            if len(parts) != 2: return -1
            time_part, period = parts
            h, m = map(int, time_part.split(":"))
            if period == "PM" and h != 12: h += 12
            if period == "AM" and h == 12: h = 0
            return h * 60 + m
        except:
            return -1

    start_mins = to_mins(start_str)
    end_mins = to_mins(end_str)

    if start_mins == -1 or end_mins == -1:
        return []

    # Generate 30-min slots
    # We'll use the same strings as the frontend TimeSelector
    # 8:00 AM to 7:00 PM
    
    slots = []
    current_mins = start_mins
    
    # Round down start to nearest 30
    # Actually, for matching, if a class starts at 9:00, it occupies the 9:00 slot.
    # If it goes to 9:50, it occupies 9:00 and 9:30.
    # We'll iterate in 30 min increments.
    
    # Align to 30 min grid
    remainder = current_mins % 30
    if remainder != 0:
        current_mins -= remainder # Round down to capture the slot? 
        # Or should we be strict? Let's say if it overlaps significantly.
        # For simplicity, let's just take the start time's 30-min block.
    
    while current_mins < end_mins:
        # Convert back to string
        h = current_mins // 60
        m = current_mins % 60
        period = "AM"
        if h >= 12:
            period = "PM"
            if h > 12: h -= 12
        if h == 0: h = 12
        
        time_str = f"{h}:{m:02d} {period}"
        slots.append(time_str)
        current_mins += 30
        
    return slots

def parse_days(weekday_str: str) -> List[str]:
    """Convert 'MWF' -> ['M', 'W', 'F'], 'TR' -> ['T', 'R']"""
    if not weekday_str or weekday_str == "TBA":
        return []
    
    # Simple char iteration works for MWF, TR
    # But check for special cases if any
    days = []
    valid_chars = set(['M', 'T', 'W', 'R', 'F', 'S', 'U'])
    for char in weekday_str.upper():
        if char in valid_chars:
            days.append(char)
    return days

def load_courses() -> List[Dict[str, Any]]:
    """Load courses from courses_full _dataset - combined_courses.csv"""
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent

    csv_path = repo_root / "courses_full_dataset_combined_courses.csv"
    
    if not csv_path.exists():
        # Fallback to old name if new one doesn't exist (during dev)
        csv_path = repo_root / "cmu_labeled_llm_final.csv"
    
    if not csv_path.exists():
        raise FileNotFoundError(
            f"Course data CSV file not found at {csv_path}"
        )

    courses = []
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Parse schedule info
                weekday = row.get("weekday", "")
                start = row.get("start", "")
                end = row.get("end", "")
                
                row["_days"] = parse_days(weekday)
                row["_times"] = parse_time_slots(start, end)
                
                # Construct meeting time string for display
                if weekday and start and end:
                    row["_meetingTime"] = f"{weekday} {start}-{end}"
                else:
                    row["_meetingTime"] = "TBA"
                
                # Parse industry and skills for tags
                industry = row.get("industry", "").strip()
                skills_str = row.get("skills", "")
                
                # Clean up stringified list format if present: "['a', 'b']" -> "a, b"
                skills_str = skills_str.replace("[", "").replace("]", "").replace("'", "").replace('"', "")
                
                skills_list = [s.strip() for s in skills_str.split(",") if s.strip()]
                
                # Update row with parsed lists
                row["skills"] = skills_list
                
                # Create tags list: Industry first, then skills
                tags = []
                if industry:
                    tags.append(industry)
                tags.extend(skills_list)
                row["tags"] = tags

                courses.append(row)
        print(f"Loaded {len(courses)} courses from {csv_path}")
        return courses
    except Exception as e:
        raise RuntimeError(f"Error loading courses from CSV: {e}")


def load_reviews() -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, float], Dict[str, float]]:
    """
    Load reviews from course_review.csv and group by CourseID.
    Returns: (Dict[course_id, list_of_reviews], Dict[course_id, avg_workload_hours], Dict[course_id, avg_rating])
    """
    reviews_map = {}
    workload_hours_map = {}  # course_id -> list of hours
    ratings_map = {}  # course_id -> list of ratings
    
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent
    csv_path = repo_root / "course_review.csv"

    if not csv_path.exists():
        print(f"Warning: Reviews file not found at {csv_path}")
        return {}, {}, {}

    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row.get("CourseID", "").strip()
                if not cid:
                    continue
                
                # Collect workload hours
                try:
                    hours = int(row.get("WorkloadHours", 0))
                    if hours > 0:
                        if cid not in workload_hours_map:
                            workload_hours_map[cid] = []
                        workload_hours_map[cid].append(hours)
                except ValueError:
                    pass
                
                # Collect overall ratings
                try:
                    overall_rating = int(row.get("OverallRating", 0))
                    if overall_rating > 0:
                        if cid not in ratings_map:
                            ratings_map[cid] = []
                        ratings_map[cid].append(overall_rating)
                except ValueError:
                    pass
                
                # Map workload rating to label
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
                    "author": "Student", # Anonymized
                    "semester": row.get("Timestamp", "").split("T")[0], # Just the date
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
    except Exception as e:
        print(f"Error loading reviews: {e}")
        return {}, {}, {}
    
    # Calculate average workload hours per course
    avg_workload_map = {}
    for cid, hours_list in workload_hours_map.items():
        avg_workload_map[cid] = sum(hours_list) / len(hours_list)
    
    # Calculate average rating per course
    avg_rating_map = {}
    for cid, rating_list in ratings_map.items():
        avg_rating_map[cid] = round(sum(rating_list) / len(rating_list), 1)
    
    return reviews_map, avg_workload_map, avg_rating_map

COURSES: List[Dict[str, Any]] = load_courses()
REVIEWS_MAP, WORKLOAD_HOURS_MAP, RATINGS_MAP = load_reviews()

# ---------------------------------------------------------------------
# Helpers: safe text + scoring
# ---------------------------------------------------------------------


def safe_text(x: Any) -> str:
    """Convert anything to a lowercased, single-spaced string."""
    if x is None:
        return ""
    s = str(x)
    # Normalize whitespace without regex, to avoid type issues
    return " ".join(s.strip().lower().split())


def join_parts(parts: List[Any]) -> str:
    out: List[str] = []
    for p in parts:
        if isinstance(p, list):
            out.extend([safe_text(v) for v in p])
        else:
            out.append(safe_text(p))
    return " ".join(out)


def build_course_search_text(course: Dict[str, Any]) -> str:
    """Combine likely useful fields into a single search string."""
    # Try a range of key names to be robust to schema differences
    key_candidates = [
        "course_id",
        "Course ID",
        "id",
        "course_name",
        "Course Name",
        "name",
        "title",
        "short_desc",
        "short_description",
        "description",
        "long_desc",
        "long_description",
        "keywords",
        "tags",
        "Topics",
        "skills",
    ]
    parts: List[Any] = []
    for k in key_candidates:
        if k in course:
            parts.append(course[k])
    return join_parts(parts)


# Precompute search text for each course
for c in COURSES:
    c["_search_text"] = build_course_search_text(c)


def score_course(query_text: str, course: Dict[str, Any]) -> float:
    """Very simple token-overlap score."""
    q_tokens = [t for t in query_text.split() if t]
    if not q_tokens:
        return 0.0

    c_text = course.get("_search_text", "")
    if not c_text:
        return 0.0

    score = 0.0
    for t in q_tokens:
        if t in c_text:
            score += 1.0
    return score / len(q_tokens)


# ---------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "courses_count": len(COURSES)})


@app.route("/api/courses/match", methods=["POST"])
def api_match_courses() -> Any:
    """
    Request body:
    {
      "goal": "drama",
      "skills": ["acting"],
      "resume": "...",
      "schedule": [
        {"day": "M", "times": ["9:00 AM", "9:30 AM"]},
        ...
      ]
    }

    Response:
    {
      "courses": [ ... top matches ... ]
    }
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
    except Exception as e:
        return jsonify({"error": f"Invalid JSON body: {e}"}), 400

    goal = safe_text(payload.get("goal", ""))
    skills_raw = payload.get("skills", [])
    if isinstance(skills_raw, list):
        skills_text = join_parts(skills_raw)
    else:
        skills_text = safe_text(skills_raw)

    resume = safe_text(payload.get("resume", ""))
    
    # Schedule filtering
    schedule = payload.get("schedule", [])
    # Convert schedule to a more usable format: map of day -> set of times
    user_schedule_map = {}
    for item in schedule:
        day = item.get("day")
        times = item.get("times", [])
        if day and times:
            user_schedule_map[day] = set(times)

    query_text = join_parts([goal, skills_text, resume]).strip()
    if not query_text:
        # Avoid empty queries so every course doesn't get score 0
        query_text = "course"

    # 1. Exact ID match check
    # We'll look for an exact match on course_id (or similar fields)
    exact_matches = []
    other_candidates = []

    # Normalize query for ID check (remove spaces, lowercase)
    # e.g. "15-445" -> "15445"
    query_id_clean = query_text.replace("-", "").replace(" ", "").lower()

    for c in COURSES:
        # --- Time Filtering Check ---
        if user_schedule_map:
            # If user provided a schedule, filter out courses that don't fit
            # Logic: The course must fit WITHIN the user's available slots.
            # i.e. For every day the course meets, the user must have that day available,
            # AND for every time slot the course occupies, the user must have that slot available.
            
            course_days = c.get("_days", [])
            course_times = c.get("_times", [])
            
            if not course_days or not course_times:
                # If course has no schedule info (TBA), do we show it?
                # Let's assume NO if the user is filtering by time.
                # Or maybe YES? Let's be strict for now.
                continue
                
            is_compatible = True
            for day in course_days:
                if day not in user_schedule_map:
                    is_compatible = False
                    break
                
                # Check if all course times are in user's available times for this day
                user_times = user_schedule_map[day]
                for t in course_times:
                    if t not in user_times:
                        is_compatible = False
                        break
                if not is_compatible:
                    break
            
            if not is_compatible:
                continue
        # -----------------------------

        # Calculate score as before
        s = score_course(query_text, c)
        
        # Check for exact ID match
        cid = str(c.get("course_id") or c.get("id") or c.get("number") or "").lower()
        cid_clean = cid.replace("-", "").replace(" ", "")
        
        # If the query looks like an ID (digits/numbers) and matches exactly
        if query_id_clean and query_id_clean == cid_clean:
            # Boost score to 1.0 (or higher) to ensure it's top
            s = 2.0 
            exact_matches.append((s, c))
        else:
            other_candidates.append((s, c))

    # STRICT SEARCH REQUIREMENT:
    # If we have exact matches, return ONLY those.
    if exact_matches:
        top = exact_matches
    else:
        # Sort others by score
        other_candidates.sort(key=lambda x: x[0], reverse=True)
        top = other_candidates[:20]

    def build_match_obj(score: float, c: Dict[str, Any]) -> Dict[str, Any]:
        # CSV fields are already clean
        cid = c.get("course_id", "")
        name = c.get("course_name", "Untitled Course")
        
        # Rating - use average from reviews, default to 4.5 if no reviews
        rating = RATINGS_MAP.get(str(cid), 4.5)

        # Match percent (0–100)
        match_percent = int(round(max(0.0, min(1.0, score)) * 100))

        # Workload - calculate from average hours
        avg_hours = WORKLOAD_HOURS_MAP.get(str(cid), 0)
        if avg_hours == 0:
            workload_label = "Unknown"
        elif avg_hours <= 7:
            workload_label = "Light Workload"
        elif avg_hours <= 11:
            workload_label = "Medium Workload"
        else:
            workload_label = "Heavy Workload"

        # Level from CSV (grey badge)
        level = c.get("level", "unknown")

        # Tags from pre-calculated field (industry + skills)
        tags = c.get("tags", [])

        # Description from CSV
        summary = c.get("description_clean", "No description available for this course.")

        # Reviews from course_review.csv
        reviews = REVIEWS_MAP.get(str(cid), [])

        return {
            "course_id": cid,
            "course_name": name,
            "rating": rating,
            "match_percent": match_percent,
            "workload_label": workload_label,
            "level": level,
            "tags": tags[:10],
            "ai_summary": summary,
            "reviews": reviews,
            "industry": c.get("industry", ""),
            "meetingTime": c.get("_meetingTime", ""),
            "days": c.get("_days", []),
            "times": c.get("_times", []),
            # Pass through the raw course in case the frontend wants it
            "raw": c,
        }

    courses_payload = [build_match_obj(s, c) for s, c in top]

    return jsonify(
        {
            "courses": courses_payload,
            "debug": {
                "query_text": query_text,
                "total_courses": len(COURSES),
            },
        }
    )


@app.route("/api/courses/summarize", methods=["POST"])
def summarize_course() -> Any:
    """
    Generate an LLM-based personalized course summary.
    """
    try:
        data = request.json
        course = data.get('course', {})
        user_profile = data.get('user_profile', {})
        print(course), print(user_profile)
        
        # If LLM is not available, fall back to description
        if LLM_MODEL is None:
            course_id = course.get("course_id") or course.get("id")
            description = "No description available for this course."
            if course_id:
                for c in COURSES:
                    cid = str(c.get("course_id") or c.get("id") or "")
                    if str(course_id) == cid:
                        description = (
                            c.get("description_clean")
                            or c.get("description")
                            or c.get("Description")
                            or "No description available for this course."
                        )
                        break
            return jsonify({'status': 'success', 'summary': description})
        
        # Construct prompt for LLM - Generate English description
        prompt = f"""
        Based on the user profile and course information below, generate a brief, engaging course recommendation in English (maximum 50 words). 
        Use a lively, enthusiastic tone. Output ONLY the recommendation text, no explanations or labels.
        
        User Career Goals: {user_profile.get("career_goals", "Not specified")}
        User Skills: {", ".join(user_profile.get("skills", [])) if user_profile.get("skills") else "Not specified"}
        Course Name: {course.get("course_name", "")}
        Course Industry: {course.get("industry", "General")}
        Course Keywords: {course.get("keywords", "")}
        Course Description: {course.get("description", "")}
        
        Generate a personalized recommendation in English:
        """
        
        output = LLM_MODEL(prompt, max_tokens=100, temperature=0.9, top_p=0.95, top_k=10)
        summary = output['choices'][0]['text'].strip()
        
        # Clean up the response - take first sentence or first 80 chars
        if '\n' in summary:
            summary = summary.split('\n')[0]
        summary = summary[:150].strip()
        
        return jsonify({'status': 'success', 'summary': summary})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/review/audit', methods=['POST'])
def audit_review() -> Any:
    """
    Audit user-submitted course reviews using LLM.
    """
    try:
        review_data = request.json
        review_text = review_data.get("review_text", "")
        print("收到审核请求:", review_text)
        
        # 1. Deterministic Length Check
        if len(review_text) < 15:
            return jsonify({"Audit Status": "Fail", "Reason": "Review is less than 15 characters long."}), 200

        # 2. Python-based Safety Overrides (LLM is too unstable)
        text_lower = review_text.lower()
        
        # Whitelist: Strong positive OR neutral sentiment + No bad words = PASS
        positive_words = ["awesome", "loved", "great", "best", "amazing", "excellent", "good", "helpful", "enjoyed", "cool"]
        neutral_words = ["alright", "ok", "okay", "fine", "average", "decent", "fair", "middle", "mediocre", "passable"]
        
        severe_bad_words = ["fuck", "shit", "bitch", "asshole", "idiot", "stupid", "jerk", "hate", "terrible", "horrible"]
        
        has_positive = any(w in text_lower for w in positive_words)
        has_neutral = any(w in text_lower for w in neutral_words)
        has_bad = any(w in text_lower for w in severe_bad_words)
        
        if (has_positive or has_neutral) and not has_bad:
            print("Override: Detected positive/neutral sentiment with no bad words. Auto-PASS.")
            return jsonify({"Audit Status": "Pass", "Reason": "Safe content (Auto-validated)"}), 200

        # If LLM is not available, use basic validation
        if LLM_MODEL is None:
            return jsonify({"Audit Status": "Pass", "Reason": "Basic validation passed"}), 200
        
        prompt = f"""
        You are a content moderator. Your ONLY job is to block profanity, hate speech, and personal attacks.
        You must PASS all other reviews, whether they are positive, negative, or neutral.

        Examples:
        Input: "The professor is a jerk."
        Output: {{"Audit Status": "Fail", "Reason": "Personal attack"}}

        Input: "I loved this class, learned a lot."
        Output: {{"Audit Status": "Pass", "Reason": "Positive review"}}

        Input: "This class was very hard and time intensive."
        Output: {{"Audit Status": "Pass", "Reason": "Valid criticism"}}
        
        Input: "I hated this class it was boring."
        Output: {{"Audit Status": "Pass", "Reason": "Valid criticism"}}

        Input: "{review_text}"
        Output:
        """

        output = LLM_MODEL(prompt, max_tokens=200, temperature=0.0, top_p=0.95, top_k=10, stop=["Input:", "\n\n"])
        response_text = output['choices'][0]['text'].strip()
        print("LLM返回内容:", response_text, flush=True)

        # Extract JSON from response
        try:
            json_matches = re.findall(r'\{.*?"Audit Status".*?\}', response_text, re.DOTALL)
            if json_matches:
                # Take the FIRST match, not the last, to avoid hallucinated examples at the end
                first_json = json_matches[0]
                result = json.loads(first_json)
                
                # HEURISTIC OVERRIDE: Fix common model hallucinations
                # If the model says "Positive review" or "Valid criticism" but marks it as Fail, flip it to Pass.
                reason_lower = result.get("Reason", "").lower()
                if result.get("Audit Status") == "Fail":
                    if "positive" in reason_lower or "valid" in reason_lower or "safe" in reason_lower:
                        print(f"Overriding false positive: {result}")
                        result["Audit Status"] = "Pass"
                
                print("解析后result:", result)
            else:
                raise Exception("No valid JSON found in LLM response!")
            if "Audit Status" not in result or "Reason" not in result:
                raise Exception("Missing required JSON keys")
        except Exception as ex:
            print("AI JSON解析失败:", ex)
            result = {"Audit Status": "Fail", "Reason": "AI failed to generate valid JSON: " + str(response_text)}
        
        return jsonify(result), 200
    except Exception as e:
        print("顶层异常:", e)
        return jsonify({'Audit Status': "Fail", 'Reason': str(e)}), 500


# ---------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------


def main() -> None:
    # Simple Flask dev server; no waitress dependency
    app.run(host="0.0.0.0", port=3002, debug=False)


if __name__ == "__main__":
    main()

