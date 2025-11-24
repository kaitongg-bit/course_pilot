import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { ScottyLoader } from './ScottyLoader';

interface SearchSectionProps {
  onViewCourse: (course: any) => void;
}

export function SearchSection({ onViewCourse }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    setCourses([]);

    try {
      const res = await fetch("http://127.0.0.1:3002/api/courses/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: searchQuery,
          skills: [],
          resume: ""
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      const results = data.courses || data.matches || [];
      setCourses(results);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search courses. Is the backend running?");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-[#2E2E2E] mb-4">Search Course Reviews</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#6B7280] mb-2">
              Search by Course Number
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., 15445"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full bg-[#CC0033] hover:bg-[#AA0028] text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <ScottyLoader />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search & Quick View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {!error && courses.length === 0 && !isSearching && (
            <div className="text-gray-500 text-center py-8">
              No courses found for "{searchQuery}"
            </div>
          )}

          {courses.map((course) => (
            <CourseCard
              key={course.course_id || course.id}
              course={course}
              onViewMore={() => onViewCourse(course)}
            />
          ))}
        </div>
      )}
    </div>
  );
}