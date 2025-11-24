import { X } from 'lucide-react';
import { useState } from 'react';
import { UserReview } from '../App';

interface ContributeModalProps {
  isLoggedIn: boolean;
  onClose: () => void;
  onSubmitReview: (review: UserReview) => void;
  onRequestSignIn: () => void;
}

export function ContributeModal({ isLoggedIn, onClose, onSubmitReview, onRequestSignIn }: ContributeModalProps) {
  const [courseNumber, setCourseNumber] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [workload, setWorkload] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [interestRating, setInterestRating] = useState('');
  const [utilityRating, setUtilityRating] = useState('');
  const [overallRating, setOverallRating] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      return;
    }

    const currentDate = new Date();
    const semester = `${currentDate.getMonth() < 6 ? 'Spring' : 'Fall'} ${currentDate.getFullYear()}`;
    
    const newReview: UserReview = {
      id: Date.now().toString(),
      courseNumber,
      courseTitle,
      semester,
      rating: parseInt(overallRating),
      comment,
      workload: workload ? `${workload} hours/week` : undefined,
      workflow: workflow || undefined,
      interestRating: interestRating ? parseInt(interestRating) : undefined,
      utilityRating: utilityRating ? parseInt(utilityRating) : undefined,
      likes: 0,
    };

    onSubmitReview(newReview);
    onClose();
  };

  // Sign-in prompt screen
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-[#CC0033] mb-1">
                Sign In Required
              </h2>
              <p className="text-sm text-[#6B7280] mt-2">
                Please sign in to submit a course review.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#2E2E2E] p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-[#FEF2F2] rounded-xl p-4 border border-[#FEE2E2]">
              <p className="text-sm text-[#2E2E2E]">
                You need to be signed in to contribute course reviews. Sign in from the Profile tab to get started!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onRequestSignIn}
                className="flex-1 bg-[#CC0033] hover:bg-[#A60000] text-white py-3 rounded-xl transition-colors"
              >
                Go to Profile
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#2E2E2E] py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular form screen
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#E5E7EB] flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-[#CC0033] mb-1">
              Submit Your Course Experience
            </h2>
            <p className="text-xs text-[#6B7280] mt-2">
              Please fill out the form below to contribute your course review.
            </p>
            <p className="text-xs text-[#2E2E2E] mt-1">
              Only <span className="font-medium">Course Number, Course Title, Overall Rating, Comment</span> are mandatory, others optional.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#2E2E2E] p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Course Number<span className="text-[#CC0033]">*</span>
            </label>
            <input
              type="text"
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              placeholder="e.g., 15-445"
              required
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Course Title<span className="text-[#CC0033]">*</span>
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="e.g., Database Systems"
              required
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Workload (number only, hr/week)
            </label>
            <input
              type="number"
              value={workload}
              onChange={(e) => setWorkload(e.target.value)}
              placeholder="e.g., 10"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Workflow
            </label>
            <input
              type="text"
              value={workflow}
              onChange={(e) => setWorkflow(e.target.value)}
              placeholder="e.g., group project, lots of readings"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Interest Rating (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={interestRating}
              onChange={(e) => setInterestRating(e.target.value)}
              placeholder="1-5"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Utility Rating (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={utilityRating}
              onChange={(e) => setUtilityRating(e.target.value)}
              placeholder="1-5"
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Overall Rating (1-5)<span className="text-[#CC0033]">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={overallRating}
              onChange={(e) => setOverallRating(e.target.value)}
              placeholder="1-5"
              required
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E]"
            />
          </div>

          <div>
            <label className="block text-sm text-[#2E2E2E] mb-2">
              Comment<span className="text-[#CC0033]">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={6}
              required
              className="w-full px-4 py-2 bg-[#F5F5F5] rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#CC0033] text-[#2E2E2E] resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#CC0033] hover:bg-[#A60000] text-white py-3 rounded-xl transition-colors"
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}