import { X, Star, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CourseReviewModalProps {
  course: {
    number?: string;
    course_id?: string;
    title?: string;
    course_name?: string;
    rating?: number;
    reviews?: any[];
  };
  onClose: () => void;
}

interface Review {
  id: number;
  author: string;
  semester: string;
  rating: number;
  text: string;
  likes: number;
  workload: string;
  workflow: string;
  interest: number;
  utility: number;
}

export function CourseReviewModal({ course, onClose }: CourseReviewModalProps) {
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://script.google.com/macros/s/AKfycbzNPXIkV94kFCUk7hAxsg0xlva3QgrvHdqjuLNwgu48ILWvJmt72wiv5YXSPb7QcUIPvw/exec';

  // 从 Google Sheets 加载评论
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const courseId = course.course_id || course.number || '';
        if (!courseId) {
          setLoading(false);
          return;
        }

        // 和旧版本保持一致，加上 action=search
        const url = `${API_URL}?action=search&course_id=${encodeURIComponent(courseId)}`;
        console.log('Fetching reviews from:', url);

        // 添加 credentials: 'omit' 防止发送 Cookie，避免多账号重定向
        const response = await fetch(url, {
          redirect: 'follow',
          credentials: 'omit'
        });

        // 检查是否被重定向到了登录页面
        if (response.url.includes('accounts.google.com') || response.url.includes('/u/')) {
          console.error('Redirected to Google Login or wrong account:', response.url);
          throw new Error('Browser redirected request. Please check your Google login status.');
        }

        const data = await response.json();

        console.log('Reviews response:', data);

        if (data.success && Array.isArray(data.data)) {
          // 转换 Google Sheets 数据格式为组件需要的格式
          const formattedReviews = data.data.map((r: any, idx: number) => ({
            id: idx,
            author: r.UserID || 'Anonymous',
            semester: r.Timestamp ? new Date(r.Timestamp).toLocaleDateString() : 'Unknown',
            rating: r.OverallRating || 3,
            text: r.Comment || '',
            likes: r.LikeCount || 0,
            workload: r.Workload ? `${r.Workload} hours/week` : 'Not specified',
            workflow: r.Workflow || 'Not specified',
            interest: r.InterestRating || 3,
            utility: r.UtilityRating || 3
          }));
          setReviews(formattedReviews);
        }
      } catch (error) {
        console.error('Failed to load reviews from Google Sheets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [course]);

  const toggleDetails = (reviewId: number) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  const toggleLike = (reviewId: number) => {
    setLikedReviews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-[#A60000] mb-1">
              {course.number}
            </h2>
            <p className="text-[#2E2E2E] text-sm">{course.title}</p>
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
              <span className="text-sm text-[#2E2E2E]">{course.rating} Average Rating</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#2E2E2E] p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reviews */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {reviews.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No reviews yet. Be the first to contribute!
            </div>
          )}
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-sm">
              {/* Review Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#2E2E2E]">{review.author}</span>
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-[#6B7280] mb-3">{review.semester}</p>

              {/* Review Text */}
              <p className="text-sm text-[#2E2E2E] mb-3">{review.text}</p>

              {/* Likes and Show Details */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(review.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors cursor-pointer ${likedReviews.has(review.id)
                      ? 'bg-[#A60000] hover:bg-[#8B0000]'
                      : 'bg-[#F5F5F5] hover:bg-[#E5E7EB]'
                      }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${likedReviews.has(review.id) ? 'fill-white text-white' : 'text-[#6B7280]'
                      }`} />
                    <span className={`text-xs ${likedReviews.has(review.id) ? 'text-white' : 'text-[#2E2E2E]'
                      }`}>
                      {likedReviews.has(review.id) ? review.likes + 1 : review.likes}
                    </span>
                  </button>
                </div>
                <button
                  onClick={() => toggleDetails(review.id)}
                  className="flex items-center gap-1 text-xs text-[#A60000] hover:text-[#800000] transition-colors"
                >
                  <span>Show Details</span>
                  {expandedReview === review.id ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedReview === review.id && (
                <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-3">
                  <div className="bg-[#F5F5F5] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">Workload</span>
                      <span className="text-xs text-[#2E2E2E] px-2 py-1 bg-white rounded-lg">{review.workload}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-[#6B7280]">Workflow</span>
                      <p className="text-xs text-[#2E2E2E] leading-relaxed">{review.workflow}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">Interest Rating</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.interest ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-[#2E2E2E]">{review.interest}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6B7280]">Utility Rating</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.utility ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-[#2E2E2E]">{review.utility}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-xs text-[#2E2E2E]">Overall Rating</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-[#E5E7EB]'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-[#2E2E2E]">{review.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}