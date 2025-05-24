import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { UserData } from "../../context/UserContext";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  MessagesSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import _ from "lodash";

// Memoized VideoPlayer component to prevent unnecessary re-renders
const VideoPlayer = React.memo(({ src, lectureId, onEnded, onTimeUpdate, onError }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load(); // Reload video when src changes
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      className="w-full rounded-lg shadow-sm"
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      onError={onError}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
});

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    progress,
    loading,
    fetchStudentCourseProgress,
    markLectureWatched,
    submitTutorRating,
    submitCourseRating,
    courseRatingSubmitted,
    setCourseRatingSubmitted,
    notes,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  } = CourseData();
  const { user } = UserData();
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const [state, setState] = useState({
    currentPhase: 0,
    currentLectureIndex: 0,
    watchProgress: 0,
    showSidebar: true,
    expandedPhases: [0],
    rating: 0,
    feedback: "",
    hasRated: false,
    showRatingModal: false,
    showCourseRatingModal: false,
    showNotesSidebar: false,
    activeNotesTab: "new",
    noteTitle: "",
    noteDescription: "",
    notesFilter: "section",
    editingNote: null,
  });
  const [isDataReady, setIsDataReady] = useState(false);
  const videoRef = useRef(null);
  const certificateRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // Debounced time update handler
  const handleTimeUpdate = useCallback(
    _.debounce(() => {
      if (videoRef.current) {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setState((prev) => ({ ...prev, watchProgress: progress.toFixed(0) }));
      }
    }, 500),
    []
  );

  // Reset video on lecture/phase change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setState((prev) => ({ ...prev, watchProgress: 0 }));
    }
  }, [state.currentLectureIndex, state.currentPhase]);

  // Determine current phase
  const determineCurrentPhase = useCallback((progressData) => {
    const {
      completedBeginnerLectures,
      beginnerQuizScore,
      completedAdvancedLectures,
      advancedQuizScore,
      certificateAwarded,
      course,
    } = progressData || {};

    if (certificateAwarded) return 4;
    if (completedAdvancedLectures && advancedQuizScore === null) return 3;
    if (beginnerQuizScore >= course?.passingScore) return 2;
    if (completedBeginnerLectures && beginnerQuizScore === null) return 1;
    return 0;
  }, []);

  // Fetch progress and notes
  const loadProgressAndNotes = useCallback(
    async (forceRefresh = false) => {
      try {
        console.time("loadProgressAndNotes");
        const [progressResult, notesResult] = await Promise.all([
          fetchStudentCourseProgress(courseId, forceRefresh || location.state?.fromQuiz),
          fetchNotes(courseId),
        ]);
        const userData = JSON.parse(localStorage.getItem("user"));
        const studentId = userData?._id;
        const existingRating = await axios
          .get(`${LMS_Backend}/api/course/ratings/${courseId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          })
          .then((res) => res.data.ratings.find((r) => r.studentId._id === studentId));

        if (!progressResult || !notesResult) {
          throw new Error("Failed to load data");
        }

        const newPhase = determineCurrentPhase(progressResult);
        setState((prev) => ({
          ...prev,
          currentPhase: newPhase,
          currentLectureIndex: 0,
          expandedPhases: [...new Set([...prev.expandedPhases, newPhase])],
        }));
        setCourseRatingSubmitted(!!existingRating);
        setIsDataReady(true);
        hasFetchedRef.current = true;
        console.timeEnd("loadProgressAndNotes");
      } catch (err) {
        setError("An error occurred while loading data");
        console.error(err);
      }
    },
    [
      courseId,
      location.state,
      fetchStudentCourseProgress,
      fetchNotes,
      setCourseRatingSubmitted,
      determineCurrentPhase,
    ]
  );

  // Initial fetch with cleanup
  useEffect(() => {
    let mounted = true;
    if (!hasFetchedRef.current || location.state?.fromQuiz) {
      setIsDataReady(false);
      loadProgressAndNotes(true).then(() => {
        if (mounted) setError(null);
      });
    } else {
      setIsDataReady(true);
    }
    return () => {
      mounted = false;
    };
  }, [loadProgressAndNotes, location.state]);

  // Handle phase changes and modals
  useEffect(() => {
    if (state.currentPhase === 4 && !courseRatingSubmitted) {
      setState((prev) => ({ ...prev, showCourseRatingModal: true }));
    } else if (state.currentPhase === 4 && courseRatingSubmitted && !state.hasRated) {
      setState((prev) => ({ ...prev, showRatingModal: true }));
    }
  }, [state.currentPhase, courseRatingSubmitted, state.hasRated]);

  const handleVideoEnd = useCallback(
    async (lectureId) => {
      try {
        await markLectureWatched(courseId, lectureId);
        const updatedProgress = await fetchStudentCourseProgress(courseId, true);

        const nextIndex = state.currentLectureIndex + 1;
        const lectures = state.currentPhase === 0 ? progress?.course?.beginnerLectures : progress?.course?.advancedLectures;
        if (nextIndex < (lectures?.length || 0)) {
          setState((prev) => ({ ...prev, currentLectureIndex: nextIndex, watchProgress: 0 }));
        } else {
          const newPhase = determineCurrentPhase(updatedProgress);
          setState((prev) => ({ ...prev, currentPhase: newPhase, currentLectureIndex: 0, watchProgress: 0 }));
        }
      } catch (err) {
        toast.error("Failed to mark lecture as watched");
      }
    },
    [courseId, state.currentLectureIndex, state.currentPhase, fetchStudentCourseProgress, markLectureWatched, determineCurrentPhase]
  );

  const togglePhase = useCallback((index) => {
    setState((prev) => ({
      ...prev,
      expandedPhases: prev.expandedPhases.includes(index)
        ? prev.expandedPhases.filter((i) => i !== index)
        : [...prev.expandedPhases, index],
    }));
  }, []);

  const handleCourseRating = useCallback(async () => {
    if (state.rating === 0) {
      toast.error("Please select a rating before submitting!");
      return;
    }
    try {
      const success = await submitCourseRating(courseId, state.rating, state.feedback);
      if (success) {
        setCourseRatingSubmitted(true);
        setState((prev) => ({
          ...prev,
          showCourseRatingModal: false,
          rating: 0,
          feedback: "",
          showRatingModal: true,
        }));
        toast.success("Thank you for your feedback!");
      }
    } catch (err) {
      toast.error("Failed to submit course rating. Please try again.");
    }
  }, [state.rating, state.feedback, courseId, submitCourseRating, setCourseRatingSubmitted]);

  const handleRating = useCallback(async () => {
    if (state.rating === 0) {
      toast.error("Please select a rating before submitting!");
      return;
    }
    try {
      const success = await submitTutorRating(courseId, state.rating, state.feedback);
      if (success) {
        setState((prev) => ({
          ...prev,
          hasRated: true,
          showRatingModal: false,
          rating: 0,
          feedback: "",
        }));
        toast.success("Thank you for your feedback!");
      }
    } catch (err) {
      toast.error("Failed to submit rating. Please try again.");
    }
  }, [state.rating, state.feedback, courseId, submitTutorRating]);

  const closeCourseRatingModal = useCallback(() => {
    setState((prev) => ({ ...prev, showCourseRatingModal: false, rating: 0, feedback: "" }));
  }, []);

  const closeTutorRatingModal = useCallback(() => {
    setState((prev) => ({ ...prev, showRatingModal: false, rating: 0, feedback: "" }));
  }, []);

  const downloadCertificate = useCallback(
    _.debounce(() => {
      const certificate = certificateRef.current;
      html2canvas(certificate, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("l", "mm", "a4");
        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`${progress?.course?.title || "Certificate"}.pdf`);
      });
    }, 500),
    [progress?.course?.title]
  );

  const handleBack = useCallback(() => {
    navigate("/student/courses");
  }, [navigate]);

  const handleSaveNote = useCallback(async () => {
    if (!state.noteTitle || !state.noteDescription) {
      toast.error("Please fill in both title and description.");
      return;
    }

    const lectureId =
      state.currentPhase === 0 || state.currentPhase === 2
        ? state.currentPhase === 0
          ? progress?.course?.beginnerLectures[state.currentLectureIndex]?._id
          : progress?.course?.advancedLectures[state.currentLectureIndex]?._id
        : null;

    if (!lectureId) {
      toast.error("Notes can only be created for lectures.");
      return;
    }

    const noteData = {
      title: state.noteTitle,
      description: state.noteDescription,
      lectureId,
      courseId,
    };

    try {
      if (state.editingNote) {
        const success = await updateNote(state.editingNote._id, noteData);
        if (success) {
          setState((prev) => ({
            ...prev,
            noteTitle: "",
            noteDescription: "",
            editingNote: null,
            activeNotesTab: "my",
          }));
        }
      } else {
        const success = await createNote(noteData);
        if (success) {
          setState((prev) => ({
            ...prev,
            noteTitle: "",
            noteDescription: "",
            activeNotesTab: "my",
          }));
        }
      }
    } catch (err) {
      toast.error("Failed to save note.");
    }
  }, [
    state.noteTitle,
    state.noteDescription,
    state.currentPhase,
    state.currentLectureIndex,
    state.editingNote,
    progress?.course,
    courseId,
    createNote,
    updateNote,
  ]);

  const handleEditNote = useCallback((note) => {
    setState((prev) => ({
      ...prev,
      noteTitle: note.title,
      noteDescription: note.description,
      editingNote: note,
      activeNotesTab: "new",
    }));
  }, []);

  const handleDeleteNote = useCallback(async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (err) {
      toast.error("Failed to delete note.");
    }
  }, [deleteNote]);

  // Memoized filtered notes
  const currentLectureId = useMemo(
    () =>
      state.currentPhase === 0
        ? progress?.course?.beginnerLectures[state.currentLectureIndex]?._id
        : state.currentPhase === 2
        ? progress?.course?.advancedLectures[state.currentLectureIndex]?._id
        : null,
    [state.currentPhase, state.currentLectureIndex, progress?.course]
  );

  const filteredNotes = useMemo(
    () =>
      state.notesFilter === "section"
        ? notes.filter((note) => note.lectureId?.toString() === currentLectureId?.toString())
        : notes.filter((note) => note.courseId?.toString() === courseId),
    [notes, state.notesFilter, currentLectureId, courseId]
  );

  // Memoized phases
  const phases = useMemo(
    () => [
      {
        name: "Beginner Lectures",
        enabled: true,
        icon: <PlayCircle className="w-5 h-5 text-gray-600" />,
        lectures: progress?.course?.beginnerLectures || [],
        watched: progress?.watchedBeginnerLectures || [],
      },
      {
        name: "Beginner Quiz",
        enabled: progress?.completedBeginnerLectures,
        icon: <PlayCircle className="w-5 h-5 text-gray-600" />,
      },
      {
        name: "Advanced Lectures",
        enabled:
          progress?.beginnerQuizScore !== null &&
          progress?.beginnerQuizScore >= progress?.course?.passingScore,
        icon: <PlayCircle className="w-5 h-5 text-gray-600" />,
        lectures: progress?.course?.advancedLectures || [],
        watched: progress?.watchedAdvancedLectures || [],
      },
      {
        name: "Advanced Quiz",
        enabled: progress?.completedAdvancedLectures,
        icon: <PlayCircle className="w-5 h-5 text-gray-600" />,
      },
      {
        name: "Certification",
        enabled: progress?.certificateAwarded,
        icon: <Award className="w-5 h-5 text-gray-600" />,
      },
    ],
    [progress]
  );

  // Memoized progress calculations
  const { totalSteps, completedSteps, overallProgress } = useMemo(() => {
    const total = (progress?.course?.beginnerLectures?.length || 0) +
      1 +
      (phases[2].enabled ? progress?.course?.advancedLectures?.length || 0 : 0) +
      (phases[3].enabled ? 1 : 0) +
      (progress?.certificateAwarded ? 1 : 0);
    const completed = (progress?.watchedBeginnerLectures?.length || 0) +
      (progress?.beginnerQuizScore !== null ? 1 : 0) +
      (phases[2].enabled ? progress?.watchedAdvancedLectures?.length || 0 : 0) +
      (phases[3].enabled && progress?.advancedQuizScore !== null ? 1 : 0) +
      (progress?.certificateAwarded ? 1 : 0);
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { totalSteps: total, completedSteps: completed, overallProgress: percentage };
  }, [progress, phases]);

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  // Loading state with skeleton
  if (loading || !isDataReady) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Skeleton width={200} height={24} />
            <Skeleton width="100%" height={8} className="mt-4" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-4 flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-1/3">
            <Skeleton count={5} height={40} className="mb-2" />
          </aside>
          <section className="w-full md:w-2/3">
            <Skeleton height={400} />
            <Skeleton count={3} height={20} className="mt-4" />
          </section>
        </main>
      </div>
    );
  }

  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!progress)
    return <div className="text-center py-10 text-gray-600">No progress found</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 md:p-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center text-black hover:text-gray-700 transition duration-300"
              >
                <ChevronLeft className="w-8 h-8 text-black" />
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {progress?.course?.title || "Course"}
              </h1>
            </div>
            <div className="flex items-center gap-4 absolute top-4 right-8 md:top-6 md:right-10">
              <button
                onClick={() => navigate(`/course/forum/${courseId}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium bg-[#134e4a] hover:bg-[#0c3c38] transition-all duration-300"
              >
                <MessagesSquare className="w-4 h-4" />
                Join Course Discussion
              </button>
              <button
                onClick={() => setState((prev) => ({ ...prev, showNotesSidebar: true }))}
                className="text-[#134e4a] hover:text-[#0c3c38] font-semibold text-lg flex items-center gap-2"
              >
                <Pencil className="w-6 h-6" />
                Notes
              </button>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="w-full max-w-[400px] bg-gray-200 rounded-full h-2 relative overflow-hidden">
              <div
                className="bg-[#134e4a] h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium">
              {overallProgress.toFixed(0)}% Complete
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 flex flex-col md:flex-row gap-6">
        {state.showSidebar && (
          <aside className="w-full md:w-1/3 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Content</h2>
            <div className="space-y-2">
              {phases.map((phase, index) => (
                <div key={index}>
                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      state.currentPhase === index
                        ? "bg-[#134e4a]/10 text-[#134e4a]"
                        : phase.enabled
                        ? "hover:bg-gray-100 text-gray-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (phase.enabled) {
                        setState((prev) => ({
                          ...prev,
                          currentPhase: index,
                          currentLectureIndex: 0,
                          watchProgress: 0,
                        }));
                      }
                      if (phase.lectures) togglePhase(index);
                    }}
                  >
                    {phase.icon}
                    <span className="font-medium flex-1 text-sm">{phase.name}</span>
                    {!phase.enabled && phases[index - 1]?.enabled && (
                      <Lock className="w-4 h-4" />
                    )}
                    {phase.lectures &&
                      (state.expandedPhases.includes(index) ? (
                        <ChevronUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ))}
                  </div>
                  {phase.lectures && state.expandedPhases.includes(index) && (
                    <div className="pl-6 pt-2 space-y-1">
                      {phase.lectures.map((lecture, lectureIndex) => (
                        <div
                          key={lecture._id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 text-sm ${
                            state.currentPhase === index && state.currentLectureIndex === lectureIndex
                              ? "bg-[#134e4a]/10 text-[#134e4a] font-semibold"
                              : phase.watched.some((w) => w.lecture.toString() === lecture._id)
                              ? "text-gray-600 hover:bg-gray-100"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setState((prev) => ({
                              ...prev,
                              currentPhase: index,
                              currentLectureIndex: lectureIndex,
                              watchProgress: 0,
                            }));
                          }}
                        >
                          <span>
                            {lectureIndex + 1}. {lecture.title || "Untitled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        <section
          className={`${state.showSidebar ? "w-full md:w-2/3" : "w-full"} bg-white rounded-lg shadow-sm p-4 md:p-6 relative`}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setState((prev) => ({ ...prev, showSidebar: !prev.showSidebar }))}
              className="text-[#134e4a] hover:text-[#0c3c38] font-medium text-sm"
            >
              {state.showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            </button>
          </div>

          {state.showNotesSidebar && (
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setState((prev) => ({ ...prev, activeNotesTab: "new" }))}
                    className={`text-base font-medium ${
                      state.activeNotesTab === "new"
                        ? "text-[#134e4a] border-b-2 border-[#134e4a]"
                        : "text-gray-600"
                    }`}
                  >
                    New Note
                  </button>
                  <button
                    onClick={() => setState((prev) => ({ ...prev, activeNotesTab: "my" }))}
                    className={`text-base font-medium ${
                      state.activeNotesTab === "my"
                        ? "text-[#134e4a] border-b-2 border-[#134e4a]"
                        : "text-gray-600"
                    }`}
                  >
                    My Notes
                  </button>
                </div>
                <button
                  onClick={() => setState((prev) => ({ ...prev, showNotesSidebar: false }))}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {state.activeNotesTab === "new" ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={state.noteTitle}
                      onChange={(e) => setState((prev) => ({ ...prev, noteTitle: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                      placeholder="Enter note title"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={state.noteDescription}
                      onChange={(e) => setState((prev) => ({ ...prev, noteDescription: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                      rows="5"
                      placeholder="Enter note description"
                    />
                  </div>
                  <button
                    onClick={handleSaveNote}
                    className="w-full bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setState((prev) => ({ ...prev, notesFilter: "section" }))}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        state.notesFilter === "section"
                          ? "bg-[#134e4a] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      This Section
                    </button>
                    <button
                      onClick={() => setState((prev) => ({ ...prev, notesFilter: "course" }))}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        state.notesFilter === "course"
                          ? "bg-[#134e4a] text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      Course
                    </button>
                  </div>
                  {filteredNotes.length === 0 ? (
                    <p className="text-gray-600 text-sm">No notes available.</p>
                  ) : (
                    filteredNotes.map((note) => (
                      <div key={note._id} className="border-b border-gray-200 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString("en-US", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })}
                            </p>
                            <p className="font-medium text-sm">{note.title}</p>
                            <p className="text-gray-600 text-sm">{note.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {state.currentPhase === 0 && (
            <div key={`beginner-lectures-${state.currentLectureIndex}`}>
              {progress?.course?.beginnerLectures?.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      Lecture {state.currentLectureIndex + 1}:{" "}
                      {progress.course.beginnerLectures[state.currentLectureIndex]?.title || "Untitled"}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        disabled={state.currentLectureIndex === 0}
                        onClick={() => setState((prev) => ({ ...prev, currentLectureIndex: prev.currentLectureIndex - 1 }))}
                        className="p-1 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        disabled={state.currentLectureIndex === progress.course.beginnerLectures.length - 1}
                        onClick={() => setState((prev) => ({ ...prev, currentLectureIndex: prev.currentLectureIndex + 1 }))}
                        className="p-1 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  {videoError?.lectureId === progress.course.beginnerLectures[state.currentLectureIndex]?._id ? (
                    <p className="text-red-500 text-sm">Error: {videoError.message}</p>
                  ) : (
                    <div>
                      <VideoPlayer
                        ref={videoRef}
                        src={`${LMS_Backend}/${progress.course.beginnerLectures[state.currentLectureIndex].video}`}
                        lectureId={progress.course.beginnerLectures[state.currentLectureIndex]._id}
                        onEnded={() => handleVideoEnd(progress.course.beginnerLectures[state.currentLectureIndex]._id)}
                        onTimeUpdate={handleTimeUpdate}
                        onError={(e) =>
                          setVideoError({
                            lectureId: progress.course.beginnerLectures[state.currentLectureIndex]._id,
                            message: e.target.error.message,
                          })
                        }
                      />
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div
                          className="bg-[#134e4a] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${state.watchProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{state.watchProgress}% Watched</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm">No lectures available</p>
                </div>
              )}
            </div>
          )}

          {state.currentPhase === 1 && (
            <div key="beginner-quiz">
              <div className="text-center">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Beginner Quiz</h2>
                {progress?.beginnerQuizScore !== null ? (
                  <div className="space-y-4">
                    <p className="text-base text-gray-600">
                      Score: {progress.beginnerQuizScore}% -{" "}
                      {progress.beginnerQuizScore >= progress?.course?.passingScore ? "Passed 🎉" : "Failed"}
                    </p>
                    {progress.beginnerQuizScore < progress?.course?.passingScore && (
                      <button
                        onClick={() =>
                          navigate(`/student/quiz/${progress.course.beginnerQuiz?._id}`, {
                            state: { currentPhase: 1, fromQuiz: true },
                          })
                        }
                        className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/student/quiz/${progress.course.beginnerQuiz?._id}`, {
                        state: { currentPhase: 1, fromQuiz: true },
                      })
                    }
                    className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          {state.currentPhase === 2 && (
            <div key={`advanced-lectures-${state.currentLectureIndex}`}>
              {progress?.course?.advancedLectures?.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      Lecture {(progress?.course?.beginnerLectures?.length || 0) + state.currentLectureIndex + 1}:{" "}
                      {progress.course.advancedLectures[state.currentLectureIndex]?.title || "Untitled"}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        disabled={state.currentLectureIndex === 0}
                        onClick={() => setState((prev) => ({ ...prev, currentLectureIndex: prev.currentLectureIndex - 1 }))}
                        className="p-1 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        disabled={state.currentLectureIndex === progress.course.advancedLectures.length - 1}
                        onClick={() => setState((prev) => ({ ...prev, currentLectureIndex: prev.currentLectureIndex + 1 }))}
                        className="p-1 disabled:opacity-50 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  {videoError?.lectureId === progress.course.advancedLectures[state.currentLectureIndex]?._id ? (
                    <p className="text-red-500 text-sm">Error: {videoError.message}</p>
                  ) : (
                    <div>
                      <VideoPlayer
                        ref={videoRef}
                        src={`${LMS_Backend}/${progress.course.advancedLectures[state.currentLectureIndex].video}`}
                        lectureId={progress.course.advancedLectures[state.currentLectureIndex]._id}
                        onEnded={() => handleVideoEnd(progress.course.advancedLectures[state.currentLectureIndex]._id)}
                        onTimeUpdate={handleTimeUpdate}
                        onError={(e) =>
                          setVideoError({
                            lectureId: progress.course.advancedLectures[state.currentLectureIndex]._id,
                            message: e.target.error.message,
                          })
                        }
                      />
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div
                          className="bg-[#134e4a] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${state.watchProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{state.watchProgress}% Watched</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm">No lectures available</p>
                </div>
              )}
            </div>
          )}

          {state.currentPhase === 3 && (
            <div key="advanced-quiz">
              <div className="text-center">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Advanced Quiz</h2>
                {progress?.advancedQuizScore !== null ? (
                  <div className="space-y-4">
                    <p className="text-base text-gray-600">
                      Score: {progress.advancedQuizScore}% -{" "}
                      {progress.advancedQuizScore >= progress?.course?.passingScore ? "Passed 🎉" : "Failed"}
                    </p>
                    {progress.advancedQuizScore < progress?.course?.passingScore && (
                      <button
                        onClick={() =>
                          navigate(`/student/quiz/${progress.course.advancedQuiz?._id}`, {
                            state: { currentPhase: 3, fromQuiz: true },
                          })
                        }
                        className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      navigate(`/student/quiz/${progress.course.advancedQuiz?._id}`, {
                        state: { currentPhase: 3, fromQuiz: true },
                      })
                    }
                    className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          {state.currentPhase === 4 && (
            <div key="certification">
              <div className="text-center relative">
                <Confetti
                  width={window.innerWidth}
                  height={window.innerHeight}
                  recycle={false}
                  numberOfPieces={200}
                  tweenDuration={5000}
                />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Certification Earned!
                </h2>
                <p className="text-base text-green-600 mb-6">
                  🎉 Congratulations on completing the course!
                </p>

                <div
                  ref={certificateRef}
                  className="bg-white border-2 border-gray-300 rounded-lg p-8 mx-auto max-w-4xl shadow-lg relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                      <h1 className="text-xl font-semibold text-gray-800">LearnNepal</h1>
                    </div>
                    <div className="text-right">
                      <Award className="w-10 h-10 text-yellow-400" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-6">Certificate of Completion</h1>
                  <p className="text-base text-gray-600 mb-4">
                    This certificate is proudly presented to
                  </p>
                  <p
                    className="text-3xl font-semibold text-gray-800 mb-6"
                    style={{ fontFamily: "'Dancing Script', cursive" }}
                  >
                    {user?.firstname || "Student"} {user?.lastname || "Name"}
                  </p>
                  <p className="text-base text-gray-600 mb-8">
                    for successfully completing the{" "}
                    <span className="font-semibold">{progress?.course?.title || "Course Name"}</span>{" "}
                    from LearnNepal on {currentDate}.
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <p
                        className="text-gray-600 mb-2"
                        style={{
                          fontFamily: "'Dancing Script', cursive",
                          fontSize: "1.25rem",
                        }}
                      >
                        Signature
                      </p>
                      <p className="text-xs text-gray-600">LearnNepal</p>
                    </div>
                    <div className="text-center">
                      <p
                        className="text-gray-600 mb-2"
                        style={{
                          fontFamily: "'Dancing Script', cursive",
                          fontSize: "1.25rem",
                        }}
                      >
                        Signature
                      </p>
                      <p className="text-xs text-gray-600">Tutor</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadCertificate}
                  className="mt-6 bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                >
                  Download Certificate
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {state.showCourseRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Rate this Course</h2>
              <button
                onClick={closeCourseRatingModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${
                      state.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setState((prev) => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={state.feedback}
                onChange={(e) => setState((prev) => ({ ...prev, feedback: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                rows="4"
                placeholder="Share your thoughts about the course..."
              />
            </div>
            <button
              onClick={handleCourseRating}
              className="w-full bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
            >
              Submit Course Rating
            </button>
          </div>
        </div>
      )}

      {state.showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Rate this Tutor</h2>
              <button
                onClick={closeTutorRatingModal}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${
                      state.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                    onClick={() => setState((prev) => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (Optional)
              </label>
              <textarea
                value={state.feedback}
                onChange={(e) => setState((prev) => ({ ...prev, feedback: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#134e4a]"
                rows="4"
                placeholder="Share your thoughts about the tutor..."
              />
            </div>
            <button
              onClick={handleRating}
              className="w-full bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
            >
              Submit Tutor Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseProgress;