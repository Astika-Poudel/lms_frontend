import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { UserData } from "../../context/UserContext";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle, Award, Lock, ChevronDown, ChevronUp, Star, X, MessageSquare } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { progress, loading, fetchStudentCourseProgress, markLectureWatched, submitTutorRating } = CourseData();
  const { user } = UserData();
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState([0]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const videoRef = useRef(null);
  const certificateRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Debounce the API call to prevent rapid repeated requests
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await func(...args);
          resolve(result);
        }, delay);
      });
    };
  };

  // Memoized function to load progress with retry logic
  const loadProgress = useCallback(
    debounce(async () => {
      try {
        setError(null);
        const result = await fetchStudentCourseProgress(courseId);
        if (!result) {
          throw new Error("Failed to load course progress");
        }
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          toast.error(`Retrying... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => loadProgress(), 2000); // Retry after 2 seconds
        } else {
          setError("Failed to load course progress after multiple attempts. Please check your network and try again.");
          toast.error("Network error. Please try again later.");
        }
      }
    }, 1000),
    [courseId, fetchStudentCourseProgress, retryCount]
  );

  useEffect(() => {
    loadProgress();
  }, [courseId, loadProgress]);

  useEffect(() => {
    if (currentPhase > 0 && currentPhase <= 4) {
      setExpandedPhases((prev) => [...new Set([...prev, currentPhase])]);
    }
    if (currentPhase === 4 && !hasRated) {
      setShowRatingModal(true);
    }
  }, [currentPhase, hasRated]);

  const handleVideoEnd = async (lectureId) => {
    await markLectureWatched(courseId, lectureId);
    toast.success("Lecture completed!");
    const nextIndex = currentLectureIndex + 1;
    const lectures = currentPhase === 0 ? course?.beginnerLectures : course?.advancedLectures;
    if (nextIndex < (lectures?.length || 0)) {
      setCurrentLectureIndex(nextIndex);
    } else {
      setCurrentPhase(currentPhase + 1);
      setCurrentLectureIndex(0);
    }
    setWatchProgress(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setWatchProgress(progress.toFixed(0));
    }
  };

  const togglePhase = (index) => {
    setExpandedPhases((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating before submitting!");
      return;
    }
    try {
      const success = await submitTutorRating(courseId, rating, feedback);
      if (success) {
        setHasRated(true);
        setShowRatingModal(false);
        toast.success("Thank you for your feedback!");
      }
    } catch (error) {
      toast.error("Failed to submit rating. Please try again.");
    }
  };

  const downloadCertificate = () => {
    const certificate = certificateRef.current;
    html2canvas(certificate, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${course?.title || "Certificate"}.pdf`);
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading && !error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#134e4a]"></div>
    </div>
  );
  if (error) return (
    <div className="text-center py-10">
      <p className="text-red-500 mb-4">{error}</p>
      <button
        onClick={() => {
          setRetryCount(0);
          loadProgress();
        }}
        className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38]"
      >
        Retry
      </button>
    </div>
  );
  if (!progress) return <div className="text-center py-10 text-gray-600">No progress found</div>;

  const { course, watchedBeginnerLectures, completedBeginnerLectures, beginnerQuizScore, 
          watchedAdvancedLectures, completedAdvancedLectures, advancedQuizScore, certificateAwarded } = progress;

  const phases = [
    { 
      name: "Beginner Lectures", 
      enabled: true, 
      icon: <PlayCircle className="w-5 h-5" />, 
      lectures: course?.beginnerLectures || [],
      watched: watchedBeginnerLectures
    },
    { name: "Beginner Quiz", enabled: completedBeginnerLectures, icon: <CheckCircle className="w-5 h-5" /> },
    { 
      name: "Advanced Lectures", 
      enabled: beginnerQuizScore >= course.passingScore, 
      icon: <PlayCircle className="w-5 h-5" />, 
      lectures: course?.advancedLectures || [],
      watched: watchedAdvancedLectures
    },
    { name: "Advanced Quiz", enabled: completedAdvancedLectures, icon: <CheckCircle className="w-5 h-5" /> },
    { name: "Certification", enabled: certificateAwarded, icon: <Award className="w-5 h-5" /> },
    { name: "Course Forum", enabled: true, icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const totalSteps = (course?.beginnerLectures?.length || 0) + 1 + 
                    (phases[2].enabled ? (course?.advancedLectures?.length || 0) : 0) + 
                    (phases[3].enabled ? 1 : 0) + 1;
  const completedSteps = watchedBeginnerLectures.length + (beginnerQuizScore !== null ? 1 : 0) + 
                        (phases[2].enabled ? watchedAdvancedLectures.length : 0) + 
                        (phases[3].enabled && advancedQuizScore !== null ? 1 : 0) + 
                        (certificateAwarded ? 1 : 0);
  const overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-base font-medium">Back</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{course?.title || "Course"}</h1>
          </div>
          <div className="w-full md:w-60 flex flex-col items-center">
            <div className="w-full bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#134e4a] to-[#0c3c38] h-1.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">{overallProgress.toFixed(0)}% Complete</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-full md:w-1/3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Content</h2>
            <div className="space-y-2">
              {phases.map((phase, index) => (
                <div key={index}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentPhase === index 
                        ? "bg-[#134e4a]/10 text-[#134e4a]" 
                        : phase.enabled 
                          ? "bg-gray-50 hover:bg-gray-100 text-gray-700" 
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (phase.enabled) {
                        setCurrentPhase(index);
                        setCurrentLectureIndex(0);
                        setWatchProgress(0);
                        if (phase.name === "Course Forum") {
                          navigate(`/student/course/forum/${courseId}`);
                        }
                      }
                      if (phase.lectures) togglePhase(index);
                    }}
                  >
                    {phase.icon}
                    <span className="font-medium flex-1">{phase.name}</span>
                    {!phase.enabled && <Lock className="w-4 h-4" />}
                    {phase.lectures && (expandedPhases.includes(index) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />)}
                  </div>
                  {phase.lectures && expandedPhases.includes(index) && (
                    <div className="pl-6 pt-2 space-y-1">
                      {phase.lectures.map((lecture, lectureIndex) => (
                        <div
                          key={lecture._id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                            currentPhase === index && currentLectureIndex === lectureIndex
                              ? "bg-[#134e4a]/10 text-[#134e4a] font-semibold"
                              : phase.watched.includes(lecture._id)
                                ? "text-gray-600"
                                : "text-gray-500"
                          }`}
                          onClick={() => {
                            setCurrentPhase(index);
                            setCurrentLectureIndex(lectureIndex);
                            setWatchProgress(0);
                          }}
                        >
                          <span>{lectureIndex + 1}. {lecture.title || "Untitled"}</span>
                          {phase.watched.includes(lecture._id) && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Content Area */}
        <section className={`${showSidebar ? "w-full md:w-2/3" : "w-full"} bg-white rounded-lg shadow-sm p-4 md:p-6 relative`}>
          <div className="flex justify-end mb-4 gap-4">
            <button
              onClick={() => navigate(`/student/course/forum/${courseId}`)}
              className="text-[#134e4a] hover:text-[#0c3c38] font-medium text-base flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Course Forum
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-[#134e4a] hover:text-[#0c3c38] font-medium text-base"
            >
              {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            </button>
          </div>

          {currentPhase === 0 && (
            <div>
              {course?.beginnerLectures?.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                      Lecture {currentLectureIndex + 1}: {course.beginnerLectures[currentLectureIndex]?.title || "Untitled"}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentLectureIndex === 0}
                        onClick={() => setCurrentLectureIndex(currentLectureIndex - 1)}
                        className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button 
                        disabled={currentLectureIndex === course.beginnerLectures.length - 1}
                        onClick={() => setCurrentLectureIndex(currentLectureIndex + 1)}
                        className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  {videoError?.lectureId === course.beginnerLectures[currentLectureIndex]._id ? (
                    <p className="text-red-500">Error: {videoError.message}</p>
                  ) : (
                    <div>
                      <video
                        ref={videoRef}
                        controls
                        className="w-full rounded-lg shadow-sm"
                        onEnded={() => handleVideoEnd(course.beginnerLectures[currentLectureIndex]._id)}
                        onTimeUpdate={handleTimeUpdate}
                        onError={(e) => setVideoError({ lectureId: course.beginnerLectures[currentLectureIndex]._id, message: e.target.error.message })}
                      >
                        <source src={`${LMS_Backend}/${course.beginnerLectures[currentLectureIndex].video}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-3 bg-gray-200 h-1.5 rounded-full">
                        <div className="bg-[#134e4a] h-1.5 rounded-full transition-all duration-300" style={{ width: `${watchProgress}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{watchProgress}% Watched</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No lectures available</p>
              )}
            </div>
          )}

          {currentPhase === 1 && (
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Beginner Quiz</h2>
              {beginnerQuizScore !== null ? (
                <p className="text-lg text-gray-600">
                  Score: {beginnerQuizScore}% - {beginnerQuizScore >= course.passingScore ? "Passed 🎉" : "Failed"}
                </p>
              ) : (
                <button 
                  onClick={() => navigate(`/student/quiz/${course.beginnerQuiz?._id}`)}
                  className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                >
                  Start Quiz
                </button>
              )}
            </div>
          )}

          {currentPhase === 2 && (
            <div>
              {course?.advancedLectures?.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                      Lecture {(course?.beginnerLectures?.length || 0) + currentLectureIndex + 1}: {course.advancedLectures[currentLectureIndex]?.title || "Untitled"}
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentLectureIndex === 0}
                        onClick={() => setCurrentLectureIndex(currentLectureIndex - 1)}
                        className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button 
                        disabled={currentLectureIndex === course.advancedLectures.length - 1}
                        onClick={() => setCurrentLectureIndex(currentLectureIndex + 1)}
                        className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  {videoError?.lectureId === course.advancedLectures[currentLectureIndex]._id ? (
                    <p className="text-red-500">Error: {videoError.message}</p>
                  ) : (
                    <div>
                      <video
                        ref={videoRef}
                        controls
                        className="w-full rounded-lg shadow-sm"
                        onEnded={() => handleVideoEnd(course.advancedLectures[currentLectureIndex]._id)}
                        onTimeUpdate={handleTimeUpdate}
                        onError={(e) => setVideoError({ lectureId: course.advancedLectures[currentLectureIndex]._id, message: e.target.error.message })}
                      >
                        <source src={`${LMS_Backend}/${course.advancedLectures[currentLectureIndex].video}`} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-3 bg-gray-200 h-1.5 rounded-full">
                        <div className="bg-[#134e4a] h-1.5 rounded-full transition-all duration-300" style={{ width: `${watchProgress}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{watchProgress}% Watched</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No lectures available</p>
              )}
            </div>
          )}

          {currentPhase === 3 && (
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">Advanced Quiz</h2>
              {advancedQuizScore !== null ? (
                <p className="text-lg text-gray-600">
                  Score: {advancedQuizScore}% - {advancedQuizScore >= course.passingScore ? "Passed 🎉" : "Failed"}
                </p>
              ) : (
                <button 
                  onClick={() => navigate(`/student/quiz/${course.advancedQuiz?._id}`)}
                  className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                >
                  Start Quiz
                </button>
              )}
            </div>
          )}

          {currentPhase === 4 && (
            <div className="text-center relative">
              <Confetti width={window.innerWidth} height={window.innerHeight} />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Certification Earned!</h2>
              <p className="text-lg text-green-600 mb-6">🎉 Congratulations on completing the course!</p>

              <div ref={certificateRef} className="bg-white border-2 border-gray-300 rounded-lg p-8 mx-auto max-w-4xl shadow-lg relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="text-left">
                    <h1 className="text-2xl font-semibold text-gray-800">LearnNepal</h1>
                  </div>
                  <div className="text-right">
                    <Award className="w-12 h-12 text-yellow-400" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-gray-800 mb-6">Certificate of Completion</h1>
                <p className="text-lg text-gray-600 mb-4">This certificate is proudly presented to</p>
                <p className="text-4xl font-semibold text-gray-800 mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  {user?.firstname || "Student"} {user?.lastname || "Name"}
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  for successfully completing the <span className="font-semibold">{course?.title || "Course Name"}</span> from LearnNepal on {currentDate}.
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2" style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.5rem" }}>
                      Signature
                    </p>
                    <p className="text-sm text-gray-600">LearnNepal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2" style={{ fontFamily: "'Dancing Script', cursive", fontSize: "1.5rem" }}>
                      Signature
                    </p>
                    <p className="text-sm text-gray-600">Tutor</p>
                  </div>
                </div>
              </div>

              <button
                onClick={downloadCertificate}
                className="mt-6 bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
              >
                Download Certificate
              </button>

              {showRatingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                    <button
                      onClick={() => setShowRatingModal(false)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Rate Your Tutor</h3>
                    {hasRated ? (
                      <p className="text-gray-600">Thank you for your feedback!</p>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-8 h-8 cursor-pointer transition-colors ${
                                star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                              }`}
                              onClick={() => setRating(star)}
                            />
                          ))}
                        </div>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Please provide your feedback (optional)"
                          className="w-full p-2 border rounded-lg resize-none"
                          rows="4"
                        />
                        <button
                          onClick={handleRating}
                          className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                        >
                          Submit Rating & Feedback
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CourseProgress;