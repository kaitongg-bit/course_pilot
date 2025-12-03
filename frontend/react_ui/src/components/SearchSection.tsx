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
  const [isSearching, setIsSearching] = useState(false); // Kept for compatibility if needed, but isLoading is main
  const [reviews, setReviews] = useState<Review[]>([]);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://script.google.com/macros/s/AKfycbzNPXIkV94kFCUk7hAxsg0xlva3QgrvHdqjuLNwgu48ILWvJmt72wiv5YXSPb7QcUIPvw/exec';

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
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
          likes: r.LikeCount || 0,
          workload: r.Workload ? `${r.Workload} hours/week` : 'Not specified',
          workflow: r.Workflow || 'Not specified',
          interest: r.InterestRating || 3,
          utility: r.UtilityRating || 3,
          // Raw data
          RowID: r.RowID,
          course_id: r.course_id,
          course_name: r.course_name,
          Workload: r.Workload,
          Workflow: r.Workflow,
          InterestRating: r.InterestRating,
          UtilityRating: r.UtilityRating,
          OverallRating: r.OverallRating,
          Comment: r.Comment,
          LikeCount: r.LikeCount,
          Timestamp: r.Timestamp
        }));
        setReviews(formattedReviews);
      } else {
        setReviews([]);
      }

    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to load reviews. Please check your network connection or try again.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReview = (index: number) => {
    setExpandedReview(expandedReview === index ? null : index);
  };

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* Search Header */}
      <div className="bg-white p-6 shadow-sm z-10">
        <h2 className="text-2xl font-bold text-[#2E2E2E] mb-6">Search Course Reviews</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter course ID (e.g., 15-112)"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CC0033] focus:border-transparent transition-all"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-[#CC0033] hover:bg-[#AA0028] text-white px-6 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <ScottyLoader /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-4 max-w-3xl mx-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
              <ScottyLoader />
              <p className="mt-3">Searching for reviews...</p>
            </div>
          ) : !error && reviews.length === 0 && hasSearched ? (
            <div className="text-gray-500 text-center py-8 bg-white rounded-2xl border border-dashed border-gray-300">
              No reviews found for "{searchQuery}". <br />
              Try searching for another course ID (e.g., 15-112).
            </div>
          ) : (
            reviews.map((review, index) => (
              <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8F0FE] flex items-center justify-center">
                      <span className="text-[#1967D2] font-bold text-sm">
                        A
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#2E2E2E] text-sm">Anonymous Student</h4>
                      <p className="text-xs text-gray-500">{review.semester}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#FFF8E1] px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
                    <span className="font-bold text-[#B45309] text-sm">{review.rating}/5</span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <p className="text-[#4B5563] text-sm leading-relaxed whitespace-pre-wrap">
                    {review.text}
                  </p>
                </div>

                {/* Review Stats Grid - Expandable */}
                <button
                  onClick={() => toggleReview(index)}
                  className="flex items-center gap-2 text-sm text-[#CC0033] font-medium hover:text-[#AA0028] transition-colors mb-2"
                >
                  {expandedReview === index ? 'Hide Details' : 'Show Details'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedReview === index ? 'rotate-180' : ''}`} />
                </button>

                {expandedReview === index && (
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl animate-in slide-in-from-top-2 duration-200 border border-gray-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workload</span>
                      <span className="text-sm text-gray-700 font-medium">{review.workload}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</span>
                      <span className="text-sm text-gray-700 font-medium">{review.workflow}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Interest</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-700 font-medium">{review.interest}/5</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < review.interest ? 'bg-[#CC0033]' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Utility</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-700 font-medium">{review.utility}/5</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < review.utility ? 'bg-[#1967D2]' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}