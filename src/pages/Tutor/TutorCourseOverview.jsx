import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";
import { ChevronLeft, MessagesSquare } from "lucide-react";

const TutorCourseOverview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = UserData();
    const { fetchLectures } = CourseData();

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourseDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${LMS_Backend}/api/course/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setCourse(response.data.course);
            } else {
                setError("Failed to load course details");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load course details");
            console.error("Error fetching course details:", err);
        }
    };

    const loadLectures = async () => {
        try {
            const lecturesData = await fetchLectures(id);
            setLectures(lecturesData || []);
        } catch (err) {
            setError(err.message || "Failed to load lectures");
            console.error("Error fetching lectures:", err);
        }
    };

    const fetchQuizzes = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${LMS_Backend}/api/course/${id}/quizzes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setQuizzes(response.data.quizzes || []);
            } else {
                setError("Failed to load quizzes");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load quizzes");
            console.error("Error fetching quizzes:", err);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCourseDetails(), loadLectures(), fetchQuizzes()]);
            setLoading(false);
        };
        if (user && id) {
            loadData();
        } else {
            setError("User not logged in or invalid course ID");
            setLoading(false);
        }
    }, [id, user]);

    const handleCreateQuiz = () => {
        navigate(`/tutor/course/${id}/create-quiz`);
    };

    const handleViewQuiz = (quizId) => {
        navigate(`/tutor/quiz/${quizId}`);
    };

    const handleViewStudentProgress = () => {
        navigate(`/tutor/course/${id}/students`);
    };

    // Updated back button handler
    const handleBack = () => {
        navigate("/tutor/courses");
    };

    if (loading) return <div className="flex items-center justify-center h-screen text-gray-600 text-lg">Loading...</div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-500 text-lg">{error}</div>;
    if (!course) return <div className="flex items-center justify-center h-screen text-gray-600 text-lg">Course not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto relative">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Go back"
                >
                    <ChevronLeft className="w-6 h-6 mr-2" />
                    Back
                </button>

                {/* Join Discussion Forum Button */}
                <div className="flex items-center gap-4 absolute top-4 right-8 md:top-6 md:right-10">
                    <button
                        onClick={() => navigate(`/course/forum/${course._id}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium bg-[#134e4a] hover:bg-[#0c3c38] transition-all duration-300"
                    >
                        <MessagesSquare className="w-4 h-4" />
                        Join Course Discussion
                    </button>
                </div>

                {/* Course Header */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{course.title}</h1>
                    <p className="text-gray-600 mb-6 text-lg">{course.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <span className="block text-sm font-semibold text-gray-700">Category</span>
                            <span className="text-gray-900">{course.category || "N/A"}</span>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <span className="block text-sm font-semibold text-gray-700">Price</span>
                            <span className="text-gray-900">NPR {course.price || 0}</span>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <span className="block text-sm font-semibold text-gray-700">Duration</span>
                            <span className="text-gray-900">{course.duration || 0} weeks</span>
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                            <span className="block text-sm font-semibold text-gray-700">Students</span>
                            <span className="text-gray-900">{course.enrolledStudents?.length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Lectures Section */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Lecture Videos</h2>
                    {lectures.length === 0 ? (
                        <p className="text-gray-600">No lectures available for this course yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {lectures.map((lecture) => (
                                <div key={lecture._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{lecture.title}</h3>
                                    <p className="text-gray-600 mb-4">{lecture.description}</p>
                                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                        <video
                                            src={`${LMS_Backend}/${lecture.video}`}
                                            controls
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            poster="/video-thumbnail.jpg"
                                            onError={(e) => console.error("Video load error:", e)}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quizzes Section */}
                <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
                        <button
                            onClick={handleCreateQuiz}
                            className="bg-[#134e4a] text-white px-5 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                        >
                            Create Quiz
                        </button>
                    </div>
                    {quizzes.length === 0 ? (
                        <p className="text-gray-600">No quizzes for this course yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                                    onClick={() => handleViewQuiz(quiz._id)}
                                >
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{quiz.title}</h3>
                                    <p className="text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>
                                            Type: {quiz._id.toString() === course.beginnerQuiz?.toString() ? "Beginner" : "Advanced"}
                                        </span>
                                        <span>{quiz.submissions?.length || 0} submissions</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Student Progress Section */}
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Progress</h2>
                    <button
                        onClick={handleViewStudentProgress}
                        className="bg-[#134e4a] text-white px-5 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
                    >
                        View Student Progress
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorCourseOverview;