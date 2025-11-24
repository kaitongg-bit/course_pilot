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
from pathlib import Path
from typing import Any, Dict, List, Tuple

from flask import Flask, jsonify, request

app = Flask(__name__)

# ---------------------------------------------------------------------
# Loading course data
# ---------------------------------------------------------------------





def load_courses() -> List[Dict[str, Any]]:
    """Load courses from cmu_labeled_llm_final.csv"""
    backend_dir = Path(__file__).resolve().parent
    repo_root = backend_dir.parent

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
      "resume": "..."
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

        # Tags from keywords field (purple badges)
        tags: List[str] = []
        keywords_str = c.get("keywords", "")
        if keywords_str:
            # Handle stringified lists like "['a', 'b']"
            if keywords_str.startswith("[") and keywords_str.endswith("]"):
                keywords_str = keywords_str[1:-1]
            
            # Split by comma
            parts = keywords_str.split(",")
            
            for p in parts:
                # Clean up quotes and whitespace
                clean_p = p.strip().replace("'", "").replace('"', "")
                if clean_p:
                    tags.append(clean_p)

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
def api_summarize_course() -> Any:
    """
    Return the course description_clean as the summary.
    """
    try:
        payload = request.get_json(force=True, silent=False) or {}
    except Exception:
        payload = {}
    
    course = payload.get("course", {})
    
    # Try to get the course_id from the payload
    course_id = course.get("course_id") or course.get("id")
    
    # Look up the course in COURSES to get the description_clean
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
    
    return jsonify({
        "summary": description
    })


# ---------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------


def main() -> None:
    # Simple Flask dev server; no waitress dependency
    app.run(host="0.0.0.0", port=3002, debug=True)


if __name__ == "__main__":
    main()

