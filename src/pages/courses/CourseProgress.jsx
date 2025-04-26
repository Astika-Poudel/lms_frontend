import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { UserData } from "../../context/UserContext";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { ChevronLeft, ChevronRight, CheckCircle, PlayCircle, Award, Lock, ChevronDown, ChevronUp, Star, X, MessagesSquare, Pencil, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { progress, loading, fetchStudentCourseProgress, markLectureWatched, submitTutorRating, notes, fetchNotes, createNote, updateNote, deleteNote } = CourseData();
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
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [activeNotesTab, setActiveNotesTab] = useState("new"); // "new" or "my"
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [notesFilter, setNotesFilter] = useState("section"); // "section" or "course"
  const [editingNote, setEditingNote] = useState(null); // Track note being edited
  const videoRef = useRef(null);
  const certificateRef = useRef(null);

  useEffect(() => {
    const loadProgressAndNotes = async () => {
      const progressResult = await fetchStudentCourseProgress(courseId);
      if (!progressResult) setError("Failed to load course progress");

      const notesResult = await fetchNotes(courseId);
      if (!notesResult) setError("Failed to load notes");
    };
    loadProgressAndNotes();
  }, [courseId]);

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

  const handleSaveNote = async () => {
    if (!noteTitle || !noteDescription) {
      toast.error("Please fill in both title and description.");
      return;
    }

    const lectureId = currentPhase === 0 || currentPhase === 2 ? 
      (currentPhase === 0 ? course?.beginnerLectures[currentLectureIndex]?._id : course?.advancedLectures[currentLectureIndex]?._id) : 
      null;

    if (!lectureId) {
      toast.error("Notes can only be created for lectures.");
      return;
    }

    const noteData = {
      title: noteTitle,
      description: noteDescription,
      lectureId,
      courseId,
    };

    if (editingNote) {
      const success = await updateNote(editingNote._id, noteData);
      if (success) {
        setNoteTitle("");
        setNoteDescription("");
        setEditingNote(null);
        setActiveNotesTab("my");
      }
    } else {
      const success = await createNote(noteData);
      if (success) {
        setNoteTitle("");
        setNoteDescription("");
        setActiveNotesTab("my");
      }
    }
  };

  const handleEditNote = (note) => {
    setNoteTitle(note.title);
    setNoteDescription(note.description);
    setEditingNote(note);
    setActiveNotesTab("new");
  };

  const handleDeleteNote = async (noteId) => {
    await deleteNote(noteId);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#134e4a]"></div>
    </div>
  );
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
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

  const currentLectureId = currentPhase === 0 ? course?.beginnerLectures[currentLectureIndex]?._id :
                          currentPhase === 2 ? course?.advancedLectures[currentLectureIndex]?._id : null;

  const filteredNotes = notesFilter === "section" ?
    notes.filter(note => note.lectureId.toString() === currentLectureId?.toString()) :
    notes.filter(note => note.courseId.toString() === courseId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 md:p-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
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
            <button
              onClick={() => setShowNotesSidebar(true)}
              className="text-[#134e4a] hover:text-[#0c3c38] font-medium text-lg flex items-center gap-2 absolute top-4 right-4 md:top-6 md:right-6"
            >
              <Pencil className="w-6 h-6" />
              Notes
            </button>
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="w-full max-w-[calc(100%-150px)] bg-gray-200 rounded-full h-1.5 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#134e4a] to-[#0c3c38] h-1.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-xs text-gray-600 font-medium">{overallProgress.toFixed(0)}% Complete</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 flex flex-col md:flex-row gap-6 relative">
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
                              : phase.watched.some(w => w.lecture.toString() === lecture._id)
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
                          {phase.watched.some(w => w.lecture.toString() === lecture._id) && <CheckCircle className="w-4 h-4 text-green-500" />}
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
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-[#134e4a] hover:text-[#0c3c38] font-medium text-base"
            >
              {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
            </button>
          </div>

          {/* Notes Sidebar */}
          {showNotesSidebar && (
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveNotesTab("new")}
                    className={`text-lg font-medium ${activeNotesTab === "new" ? "text-[#134e4a] border-b-2 border-[#134e4a]" : "text-gray-600"}`}
                  >
                    New note
                  </button>
                  <button
                    onClick={() => setActiveNotesTab("my")}
                    className={`text-lg font-medium ${activeNotesTab === "my" ? "text-[#134e4a] border-b-2 border-[#134e4a]" : "text-gray-600"}`}
                  >
                    My notes
                  </button>
                </div>
                <button onClick={() => setShowNotesSidebar(false)} className="text-gray-600 hover:text-gray-800">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {activeNotesTab === "new" ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full border rounded p-2 mt-1"
                      placeholder="Enter note title"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      value={noteDescription}
                      onChange={(e) => setNoteDescription(e.target.value)}
                      className="w-full border rounded p-2 mt-1"
                      rows="5"
                      placeholder="Enter note description"
                    />
                  </div>
                  <button
                    onClick={handleSaveNote}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setNotesFilter("section")}
                      className={`px-3 py-1 rounded ${notesFilter === "section" ? "bg-[#134e4a] text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      This section
                    </button>
                    <button
                      onClick={() => setNotesFilter("course")}
                      className={`px-3 py-1 rounded ${notesFilter === "course" ? "bg-[#134e4a] text-white" : "bg-gray-200 text-gray-600"}`}
                    >
                      Course
                    </button>
                  </div>
                  {filteredNotes.length === 0 ? (
                    <p className="text-gray-600">No notes available.</p>
                  ) : (
                    filteredNotes.map(note => (
                      <div key={note._id} className="border-b py-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-gray-500">{new Date(note.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
                            <p className="font-medium">{note.title}</p>
                            <p className="text-gray-600">{note.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditNote(note)} className="text-blue-500">
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteNote(note._id)} className="text-red-500">
                              <Trash2 className="w-5 h-5" />
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
                  {/* Forum Button */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => navigate(`/student/course/forum/${courseId}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                    >
                      <MessagesSquare className="w-5 h-5 animate-pulse" />
                      Join Course Discussion
                    </button>
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
                <div>
                  {/* Forum Button */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => navigate(`/student/course/forum/${courseId}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                    >
                      <MessagesSquare className="w-5 h-5 animate-pulse" />
                      Join Course Discussion
                    </button>
                  </div>
                  <p className="text-gray-600">No lectures available</p>
                </div>
              )}
            </div>
          )}

          {currentPhase === 1 && (
            <div>
              {/* Forum Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => navigate(`/student/course/forum/${courseId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                >
                  <MessagesSquare className="w-5 h-5 animate-pulse" />
                  Join Course Discussion
                </button>
              </div>
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
                  {/* Forum Button */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => navigate(`/student/course/forum/${courseId}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                    >
                      <MessagesSquare className="w-5 h-5 animate-pulse" />
                      Join Course Discussion
                    </button>
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
                <div>
                  {/* Forum Button */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => navigate(`/student/course/forum/${courseId}`)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                    >
                      <MessagesSquare className="w-5 h-5 animate-pulse" />
                      Join Course Discussion
                    </button>
                  </div>
                  <p className="text-gray-600">No lectures available</p>
                </div>
              )}
            </div>
          )}

          {currentPhase === 3 && (
            <div>
              {/* Forum Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => navigate(`/student/course/forum/${courseId}`)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                >
                  <MessagesSquare className="w-5 h-5 animate-pulse" />
                  Join Course Discussion
                </button>
              </div>
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
            </div>
          )}

          {currentPhase === 4 && (
            <div>
              <div className="text-center relative">
                {/* Forum Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => navigate(`/student/course/forum/${courseId}`)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold bg-gradient-to-r from-[#134e4a] to-[#0c3c38] shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-fit ml-auto"
                  >
                    <MessagesSquare className="w-5 h-5 animate-pulse" />
                    Join Course Discussion
                  </button>
                </div>
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
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Rate this Course</h2>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-600 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Feedback (Optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full border rounded p-2 mt-1"
                rows="4"
                placeholder="Share your thoughts about the course..."
              />
            </div>
            <button
              onClick={handleRating}
              className="w-full bg-[#134e4a] text-white px-4 py-2 rounded hover:bg-[#0c3c38]"
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseProgress;