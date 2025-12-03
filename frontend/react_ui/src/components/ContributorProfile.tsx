import { Award, FileText, Lock, BarChart3, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

// 定义本地使用的 Review 接口，匹配 Google Sheets 返回的数据结构
interface ProfileReview {
  RowID: string;
  course_id: string;
  course_name: string;
  Comment: string;
  LikeCount: number;
  Workload: string;
  Workflow: string;
  InterestRating: number;
  UtilityRating: number;
  OverallRating: number;
  Timestamp: string;
}

interface ContributorProfileProps {
  isLoggedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function ContributorProfile({ isLoggedIn, onSignIn, onSignOut }: ContributorProfileProps) {
  const [email, setEmail] = useState('');
  const [userHash, setUserHash] = useState('');
  const [myReviews, setMyReviews] = useState<ProfileReview[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedReviewIdx, setExpandedReviewIdx] = useState<number | null>(null);

  const API_URL = 'https://script.google.com/macros/s/AKfycbzNPXIkV94kFCUk7hAxsg0xlva3QgrvHdqjuLNwgu48ILWvJmt72wiv5YXSPb7QcUIPvw/exec';

  // 简单的 Base64 hash，与旧版 sidepanel.js 保持一致
  const hashEmail = (email: string) => {
    return btoa(email.trim().toLowerCase());
  };

  const fetchUserProfile = async (hash: string) => {
    setLoading(true);
    try {
      // 添加 credentials: 'omit' 防止重定向
      const url = `${API_URL}?action=get_profile&email_hash=${encodeURIComponent(hash)}`;
      const response = await fetch(url, {
        redirect: 'follow',
        credentials: 'omit'
      });

      if (response.url.includes('accounts.google.com') || response.url.includes('/u/')) {
        console.error('Redirected to Google Login:', response.url);
        throw new Error('Browser redirected request.');
      }

      const data = await response.json();
      console.log('Profile data:', data);

      if (data) {
        setMyReviews(data.reviews || []);
        setTotalLikes(data.total_likes || 0);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化检查
  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    const storedHash = localStorage.getItem('emailHash');
    if (storedEmail && storedHash) {
      setEmail(storedEmail);
      setUserHash(storedHash);
      if (!isLoggedIn) {
        onSignIn(); // 通知父组件已登录
      }
      fetchUserProfile(storedHash);
    }
  }, []);

  const handleSignIn = () => {
    if (!email.trim()) return;
    const hash = hashEmail(email);
    localStorage.setItem('email', email);
    localStorage.setItem('emailHash', hash);
    setUserHash(hash);
    onSignIn();
    fetchUserProfile(hash);
  };

  const handleSignOut = () => {
    localStorage.removeItem('email');
    localStorage.removeItem('emailHash');
    setEmail('');
    setUserHash('');
    setMyReviews([]);
    setTotalLikes(0);
    onSignOut();
  };

  const toggleDetails = (idx: number) => {
    setExpandedReviewIdx(expandedReviewIdx === idx ? null : idx);
  };

  const reviewCount = myReviews.length;

  const badges = [
    { name: 'Course Explorer', threshold: 1, color: 'bg-[#DBEAFE] text-[#1E3A8A]', icon: '🧭' },
    { name: 'Insight Contributor', threshold: 3, color: 'bg-[#FEF3C7] text-[#92400E]', icon: '💡' },
    { name: 'Wisdom Sharer', threshold: 5, color: 'bg-[#D1FAE5] text-[#065F46]', icon: '🌟' },
    { name: 'Knowledge Architect', threshold: 10, color: 'bg-[#E9D5FF] text-[#6B21A8]', icon: '🏗️' },
    { name: 'Master Mentor', threshold: 20, color: 'bg-[#FECACA] text-[#991B1B]', icon: '👑' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[#0066CC]">My Contributor Profile</h2>
        {isLoggedIn && (
          <button
            onClick={() => fetchUserProfile(userHash)}
            className="p-2 text-gray-500 hover:text-[#0066CC] transition-colors"
            title="Refresh Profile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
        {/* Sign In Section */}
        {!isLoggedIn ? (
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="123@andrew.cmu.edu"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
            <button
              onClick={handleSignIn}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white px-6 py-2 rounded-xl transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-[#2E2E2E] mb-1">Your Contributor Hash:</p>
              <p className="text-sm text-[#0066CC] font-mono break-all">{userHash}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{email}</span>
              <button
                onClick={handleSignOut}
                className="bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#2E2E2E] px-4 py-1.5 rounded-lg transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div className="text-sm text-[#6B7280]">
            Sign in above to see your stats.
          </div>
        )}

        {/* Badges */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-[#CC0033]" />
            <h3 className="text-[#2E2E2E]">My Badges</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge, idx) => {
              const isUnlocked = isLoggedIn && reviewCount >= badge.threshold;
              const reviewsNeeded = Math.max(0, badge.threshold - reviewCount);

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center"
                >
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${isUnlocked
                    ? badge.color
                    : 'bg-[#E5E7EB]'
                    }`}>
                    <div className={`text-4xl ${!isUnlocked && 'grayscale opacity-30'}`}>
                      {badge.icon}
                    </div>
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-[#9CA3AF]" />
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-2 text-center ${isUnlocked ? 'text-[#2E2E2E]' : 'text-[#9CA3AF]'}`}>
                    {badge.name}
                  </p>
                  {!isUnlocked && isLoggedIn && (
                    <p className="text-xs text-[#9CA3AF] text-center mt-1">
                      {reviewsNeeded} more
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contribution Impact */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-[#CC0033]" />
            <h3 className="text-[#2E2E2E]">Contribution Impact</h3>
          </div>
          <div className="space-y-3 bg-[#F5F5F5] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-[#2E2E2E] text-sm">Total Reviews Submitted:</span>
              <span className="text-[#0066CC]">{isLoggedIn ? reviewCount : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#2E2E2E] text-sm">Total Likes Received:</span>
              <span className="text-[#10B981]">{isLoggedIn ? totalLikes : '—'}</span>
            </div>
          </div>
        </div>

        {/* My Reviews Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#CC0033]" />
            <h3 className="text-[#2E2E2E]">My Reviews</h3>
          </div>
          <div className="space-y-3">
            {isLoggedIn && reviewCount > 0 ? (
              <>
                {myReviews.map((review, idx) => (
                  <div key={idx} className="bg-[#F5F5F5] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#CC0033] font-semibold">{review.course_id}</span>
                      <span className="text-xs text-[#6B7280]">{review.Timestamp ? new Date(review.Timestamp).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="text-sm text-[#2E2E2E] mb-2 font-medium">{review.course_name}</p>
                    <p className="text-sm text-[#6B7280] mb-2">{review.Comment}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[#10B981] font-bold">👍 {review.LikeCount || 0} Likes</span>
                      <button
                        onClick={() => toggleDetails(idx)}
                        className="text-xs text-[#0066CC] hover:underline"
                      >
                        {expandedReviewIdx === idx ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>

                    {expandedReviewIdx === idx && (
                      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                        <div>Workload: {review.Workload}</div>
                        <div>Workflow: {review.Workflow}</div>
                        <div>Ratings: I:{review.InterestRating} / U:{review.UtilityRating} / O:{review.OverallRating}</div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">
                {isLoggedIn ? 'No reviews found. Contribute your first review!' : 'Sign in to see your reviews.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}