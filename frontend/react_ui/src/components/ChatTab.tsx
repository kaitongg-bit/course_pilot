import React, { useState } from "react";
import { ScottyLoader } from "./ScottyLoader";
import { CourseCard } from "./CourseCard";

type CourseMatch = {
  id?: string;
  course_id?: string;
  code?: string;
  number?: string;
  title?: string;
  name?: string;
  summary?: string;
  reason?: string;
  similarity?: number;
  // Add other fields expected by CourseCard if needed, or rely on 'any'
  [key: string]: any;
};

interface ChatTabProps {
  onViewCourse: (course: any) => void;
}

export function ChatTab({ onViewCourse }: ChatTabProps) {
  const [goal, setGoal] = useState("");
  const [skills, setSkills] = useState("");
  const [resume, setResume] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseMatch[]>([]);

  async function handleFindCourses() {
    setError(null);
    setCourses([]);
    setLoading(true);

    try {
      const payload = {
        goal: goal.trim() || null,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        resume: resume.trim() || null,
      };

      console.log("[ChatTab] sending payload:", payload);

      const res = await fetch("http://127.0.0.1:3002/api/courses/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[ChatTab] response status:", res.status);

      if (!res.ok) {
        let msg = `Server error (${res.status})`;
        try {
          const data = await res.json();
          console.log("[ChatTab] non-OK response JSON:", data);
          if (data && typeof (data as any).error === "string") {
            msg = (data as any).error;
          }
        } catch {
          // ignore JSON parse errors
        }
        console.error("[ChatTab] fetch error:", msg);
        setError("Oops, the course server returned an error. Try again.");
        return;
      }

      const data = await res.json();
      console.log("[ChatTab] match response JSON:", data);

      // --- more robust extraction of the course list ---
      let matchesRaw: unknown = (data as any).matches;

      // fallback if backend uses a different key
      if (!Array.isArray(matchesRaw)) {
        matchesRaw = (data as any).courses;
      }
      // fallback if backend returns the array directly
      if (!Array.isArray(matchesRaw)) {
        matchesRaw = data;
      }

      if (!Array.isArray(matchesRaw)) {
        console.error(
          "[ChatTab] Unexpected response shape, could not find course list:",
          data
        );
        setError(
          "Got an unexpected response from the course server (no course list found)."
        );
        return;
      }

      console.log(
        "[ChatTab] parsed course list length:",
        (matchesRaw as any[]).length
      );

      setCourses(matchesRaw as CourseMatch[]);
    } catch (err) {
      console.error("[ChatTab] network error:", err);
      setError(
        "Could not reach the local course server. Is the backend running on port 3002?"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* Top banner / header is handled by parent; this is the inner card */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#FFBF24]/60 p-1">
          <div className="px-6 pt-5 pb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFE8B3] flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <div className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
                Your Goal &amp; Skills Profile
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-5">
            {/* Target Career */}
            <div>
              <label className="block text-sm text-[#2E2E2E] mb-2.5">
                Target Career
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#CC0033] focus:outline-none text-sm"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., SWE Backend"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm text-[#2E2E2E] mb-2.5">
                Skills
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#CC0033] focus:outline-none text-sm"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g., python, machine learning"
              />
            </div>

            {/* Resume */}
            <div>
              <label className="block text-sm text-[#2E2E2E] mb-2.5">
                Paste Resume
              </label>
              <textarea
                className="w-full px-4 py-3 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#CC0033] focus:outline-none resize-none min-h-[120px] text-sm"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume text here..."
              />
            </div>

            {/* Button */}
            <div className="pt-2 pb-4">
              <button
                type="button"
                onClick={handleFindCourses}
                disabled={loading}
                className="w-full bg-[#CC0033] hover:bg-[#AA0028] text-white py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ScottyLoader />
                    <span className="text-sm font-medium">Searching…</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🎯</span>
                    <span className="text-sm font-medium">Find Courses</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-white rounded-2xl shadow-sm border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {courses.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#CC0033] flex items-center justify-center text-white font-bold text-xs">
                AI
              </div>
              <p className="text-sm text-[#2E2E2E]">
                Based on your profile, here are the top courses that match your goals:
              </p>
            </div>

            {courses.map((course, idx) => (
              <CourseCard
                key={course.course_id || course.id || idx}
                course={course}
                onViewMore={() => onViewCourse(course)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Also provide a default export in case the app expects it
export default ChatTab;
