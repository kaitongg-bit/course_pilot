import { useState } from 'react';
import { Search, Star, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { ScottyLoader } from './ScottyLoader';

interface SearchSectionProps {
  onViewCourse: (course: any) => void;
}

interface Review {
  id: string;
  author: string;
  semester: string;
  rating: number;
  text: string;
  likes: number;
  workload: string;
  workflow: string;
  interest: number;
  utility: number;
  course_id: string;
  course_name: string;
}

export function SearchSection({ onViewCourse }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const API_URL = 'https://script.google.com/macros/s/AKfycbzNPXIkV94kFCUk7hAxsg0xlva3QgrvHdqjuLNwgu48ILWvJmt72wiv5YXSPb7QcUIPvw/exec';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    setReviews([]);

    try {
      // 直接调用 Google Sheets API 搜索评论
      const url = `${API_URL}?action=search&course_id=${encodeURIComponent(searchQuery.trim())}`;
      console.log('Searching reviews from URL:', url);

      // 添加 credentials: 'omit' 防止发送 Cookie，避免多账号重定向
      const res = await fetch(url, {
        redirect: 'follow',
        credentials: 'omit'
      });

      // 检查是否被重定向到了登录页面
      if (res.url.includes('accounts.google.com') || res.url.includes('/u/')) {
        console.error('Redirected to Google Login or wrong account:', res.url);
        throw new Error('Browser redirected request. Please check your Google login status.');
      }

      const text = await res.text(); // 先按文本读取，防止 JSON 解析失败
      console.log('Raw response text:', text.substring(0, 100) + '...'); // 打印前100个字符

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from server. Likely HTML error page.');
      }

      console.log('Search response data:', data);

      if (data.success && Array.isArray(data.data)) {
        const formattedReviews = data.data.map((r: any) => ({
          id: r.RowID || Math.random().toString(),
          author: r.UserID || 'Anonymous',
          semester: r.Timestamp ? new Date(r.Timestamp).toLocaleDateString() : 'Unknown',
          rating: Number(r.OverallRating) || 3,
          text: r.Comment || '',
          likes: Number(r.LikeCount) || 0,
          workload: r.Workload ? `${r.Workload} hours/week` : 'Not specified',
          workflow: r.Workflow || 'Not specified',
          interest: Number(r.InterestRating) || 3,
          utility: Number(r.UtilityRating) || 3,
          course_id: r.course_id || '',
          course_name: r.course_name || ''
        }));
        setReviews(formattedReviews);
      } else {
        setReviews([]);
      }

    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to load reviews. Please check your network connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDetails = (reviewId: string) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex-shrink-0">
        <h2 className="text-[#2E2E2E] mb-4 font-bold text-lg">Search Course Reviews</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#6B7280] mb-2">
              Search by Course Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="e.g., 15-445"
                className="flex-1 px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#CC0033] hover:bg-[#AA0028] text-white px-6 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? <ScottyLoader /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {hasSearched && (
          <>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {!error && reviews.length === 0 && !isSearching && (
              <div className="text-gray-500 text-center py-8 bg-white rounded-2xl border border-dashed border-gray-300">
                No reviews found for "{searchQuery}". <br />
                Try searching for another course ID (e.g., 15-112).
              </div>
            )}

            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
                {/* Review Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#CC0033]">{review.course_id}</span>
                    <span className="text-xs text-[#6B7280]">{review.course_name}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <span className="text-sm font-bold text-[#B45309]">{review.rating}</span>
                    <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-sm text-[#2E2E2E] mb-3 leading-relaxed">{review.text}</p>

                {/* Footer & Details Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                    <span>{review.semester}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> {review.likes}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleDetails(review.id)}
                    className="flex items-center gap-1 text-xs text-[#CC0033] hover:text-[#800000] transition-colors font-medium"
                  >
                    <span>{expandedReview === review.id ? 'Hide Details' : 'Show Details'}</span>
                    {expandedReview === review.id ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedReview === review.id && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2 bg-gray-50 p-3 rounded-xl">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#6B7280] block mb-1">Workload</span>
                        <span className="font-medium text-[#2E2E2E]">{review.workload}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block mb-1">Workflow</span>
                        <span className="font-medium text-[#2E2E2E]">{review.workflow}</span>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block mb-1">Interest</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.interest ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#6B7280] block mb-1">Utility</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.utility ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}