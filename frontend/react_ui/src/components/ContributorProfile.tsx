import { Award, FileText, Lock, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { UserReview } from '../App';

interface ContributorProfileProps {
  isLoggedIn: boolean;
  userReviews: UserReview[];
  onSignIn: () => void;
  onSignOut: () => void;
}

export function ContributorProfile({ isLoggedIn, userReviews, onSignIn, onSignOut }: ContributorProfileProps) {
  const [email, setEmail] = useState('');

  const reviewCount = userReviews.length;
  const totalLikes = userReviews.reduce((sum, review) => sum + review.likes, 0);

  const badges = [
    { name: 'Course Explorer', threshold: 1, color: 'bg-[#DBEAFE] text-[#1E3A8A]', icon: '🧭' },
    { name: 'Insight Contributor', threshold: 3, color: 'bg-[#FEF3C7] text-[#92400E]', icon: '💡' },
    { name: 'Wisdom Sharer', threshold: 5, color: 'bg-[#D1FAE5] text-[#065F46]', icon: '🌟' },
    { name: 'Knowledge Architect', threshold: 10, color: 'bg-[#E9D5FF] text-[#6B21A8]', icon: '🏗️' },
    { name: 'Master Mentor', threshold: 20, color: 'bg-[#FECACA] text-[#991B1B]', icon: '👑' },
  ];

  const handleSignIn = () => {
    onSignIn();
  };

  const handleSignOut = () => {
    setEmail('');
    onSignOut();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[#0066CC]">My Contributor Profile</h2>

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
              <p className="text-sm text-[#0066CC]">a3f8e2c9d1b4f7a6</p>
            </div>
            <button 
              onClick={handleSignOut}
              className="bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#2E2E2E] px-6 py-2 rounded-xl transition-colors text-sm"
            >
              Sign Out
            </button>
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
                  <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isUnlocked
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
                {userReviews.map((review) => (
                  <div key={review.id} className="bg-[#F5F5F5] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#CC0033]">{review.courseNumber}</span>
                      <span className="text-xs text-[#6B7280]">{review.semester}</span>
                    </div>
                    <p className="text-sm text-[#2E2E2E] mb-2">{review.courseTitle}</p>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{review.comment}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#10B981]">{review.likes} likes</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-[#6B7280]">
                {isLoggedIn ? 'No reviews yet. Contribute your first review!' : 'Sign in to see your reviews.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}