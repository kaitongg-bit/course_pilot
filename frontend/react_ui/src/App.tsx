import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { TabBar } from "./components/TabBar";
import { ChatTab } from "./components/ChatTab";
import { SearchSection } from "./components/SearchSection";
import { ContributorProfile } from "./components/ContributorProfile";
import { CourseReviewModal } from "./components/CourseReviewModal";
import { ContributeModal } from "./components/ContributeModal";

type Tab = "chat" | "search" | "profile";

export interface UserReview {
  id: string;
  courseNumber: string;
  courseTitle: string;
  semester: string;
  rating: number;
  comment: string;
  workload?: string;
  workflow?: string;
  interestRating?: number;
  utilityRating?: number;
  likes: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [modalOpen, setModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] =
    useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userReviews, setUserReviews] = useState<UserReview[]>(
    [],
  );

  useEffect(() => {
    const handleOpenContribute = () => {
      setContributeModalOpen(true);
    };

    window.addEventListener(
      "openContribute",
      handleOpenContribute,
    );
    return () =>
      window.removeEventListener(
        "openContribute",
        handleOpenContribute,
      );
  }, []);

  const handleViewCourse = (course: any) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const handleAddReview = (review: UserReview) => {
    setUserReviews([review, ...userReviews]);
  };

  const handleSignIn = () => {
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserReviews([]);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F5F5]">
      <Header />
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="p-4">
        {activeTab === "chat" && (
          <ChatTab onViewCourse={handleViewCourse} />
        )}
        {activeTab === "search" && (
          <SearchSection onViewCourse={handleViewCourse} />
        )}
        {activeTab === "profile" && (
          <ContributorProfile
            isLoggedIn={isLoggedIn}
            userReviews={userReviews}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        )}
      </div>

      {modalOpen && selectedCourse && (
        <CourseReviewModal
          course={selectedCourse}
          onClose={() => setModalOpen(false)}
        />
      )}

      {contributeModalOpen && (
        <ContributeModal
          isLoggedIn={isLoggedIn}
          onClose={() => setContributeModalOpen(false)}
          onSubmitReview={handleAddReview}
          onRequestSignIn={() => {
            setContributeModalOpen(false);
            setActiveTab("profile");
          }}
        />
      )}
    </div>
  );
}