/* global chrome */
import { useState } from 'react';
import { Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { ScottyLoader } from './ScottyLoader';

interface CourseCardProps {
  course: any;
  onViewMore: () => void;
}

/** Wrapper to call background.js using Promises */
function sendToBackground(type: string, payload: any) {
  return new Promise<any>((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (!response || response.error) {
        reject(response?.error || "No response from background");
      } else {
        resolve(response.data);
      }
    });
  });
}

export function CourseCard({ course, onViewMore }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const handleViewMore = async () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsLoadingMore(true);

    try {
      const summaryResponse = await sendToBackground("SUMMARIZE_COURSE", {
        course: {
          course_id: course.course_id,
          course_name: course.course_name,
          course_description: course.description || "",
        },
        user_profile: {
          career_goals: localStorage.getItem("career_goal") || "",
          skills: (localStorage.getItem("skills") || "")
            .split(/[ ,，、]+/)
            .filter(Boolean),
        },
      });

      setSummary(summaryResponse?.summary || "No summary available.");
      setIsExpanded(true);

    } catch (err) {
      console.error("Summary error:", err);
      setSummary("Summary unavailable.");
      setIsExpanded(true);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleViewReviews = async () => {
    setIsLoadingReviews(true);
    setTimeout(() => {
      onViewMore();
      setIsLoadingReviews(false);
    }, 300);
  };

  // Field Normalization
  const courseNumber = course.course_id || course.number || "Unknown ID";
  const courseTitle = course.course_name || course.title || "Untitled Course";
  const matchScore = course.match_percent || course.matching_percentage || course.matchScore || 0;
  const rating = course.avg_rating || course.rating || "–";
  const workload = course.workload_label || course.workload || "Unknown";
  const difficulty = course.level || course.difficulty || "Unknown";
  const tags = course.tags || course.skills || [];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[#CC0033] font-semibold">{courseNumber}</h3>
          <p className="text-[#2E2E2E] text-sm mt-1">{courseTitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {difficulty && (
          <span className="px-3 py-1 rounded-full text-xs bg-[#E5E7EB] text-[#6B7280]">
            {difficulty}
          </span>
        )}
        {workload && (
          <span className="px-3 py-1 rounded-full text-xs bg-[#FECACA] text-[#991B1B]">
            {workload.toLowerCase().includes("workload") ? workload : `${workload} Workload`}
          </span>
        )}
        {tags.slice(0, 3).map((tag: string, idx: number) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-full text-xs bg-[#E9D5FF] text-[#6B21A8]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
          <span className="text-sm text-[#2E2E2E]">{rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
          <span className="text-sm text-[#2E2E2E]">{matchScore}% Match</span>
        </div>
      </div>

      {isExpanded && (
        <div className="mb-3 pb-3 border-b border-[#E5E7EB]">
          <h4 className="text-sm text-[#2E2E2E] mb-2">Description</h4>
          <p className="text-sm text-[#6B7280] leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleViewMore}
          disabled={isLoadingMore}
          className="flex-1 flex items-center justify-center gap-2 text-[#CC0033] hover:text-[#AA0028] py-2 border border-[#CC0033] hover:border-[#AA0028] rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? (
            <ScottyLoader />
          ) : (
            <>
              <span>{isExpanded ? "Hide" : "View More"}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </>
          )}
        </button>

        <button
          onClick={handleViewReviews}
          disabled={isLoadingReviews}
          className="flex-1 bg-[#CC0033] hover:bg-[#AA0028] text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoadingReviews ? (
            <>
              <ScottyLoader />
              <span>Loading...</span>
            </>
          ) : (
            <span>View Reviews</span>
          )}
        </button>
      </div>
    </div>
  );
}
