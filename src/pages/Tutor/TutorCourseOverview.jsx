// components/TutorCourseOverview.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";

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
      setCourse(response.data.course);
    } catch (err) {
      setError(err.message || "Failed to load course details");
    }
  };

  const loadLectures = async () => {
    try {
      const lecturesData = await fetchLectures(id);
      setLectures(lecturesData || []);
    } catch (err) {
      setError(err.message || "Failed to load lectures");
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
      }
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCourseDetails(), loadLectures(), fetchQuizzes()]);
      setLoading(false);
    };
    if (user && id) loadData();
    else setError("User not logged in or invalid course ID");
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

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!course) return <div className="p-6 text-center">Course not found</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
        <p className="text-gray-600 mb-4">{course.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-100 p-3 rounded-md">
            <span className="font-medium block">Category</span>
            {course.category || "N/A"}
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <span className="font-medium block">Price</span>
            NPR {course.price || 0}
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <span className="font-medium block">Duration</span>
            {course.duration || 0} weeks
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            <span className="font-medium block">Students</span>
            {course.enrolledStudents?.length || 0}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lecture Videos</h2>
        {lectures.length === 0 ? (
          <p className="text-gray-600">No lectures available for this course yet.</p>
        ) : (
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div key={lecture._id} className="bg-white shadow rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{lecture.title}</h3>
                <p className="text-gray-600 mb-3">{lecture.description}</p>
                <div className="aspect-w-16 aspect-h-9">
                  <video
                    src={`${LMS_Backend}/${lecture.video}`}
                    controls
                    className="w-full rounded-md"
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

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Quizzes</h2>
          <button
            onClick={handleCreateQuiz}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
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
                className="bg-white shadow rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => handleViewQuiz(quiz._id)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{quiz.title}</h3>
                <p className="text-gray-600 mb-3 line-clamp-2">{quiz.description}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Due: {new Date(quiz.dueDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-500">
                    {quiz.submissions?.length || 0} submissions
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Student Progress</h2>
        <button
          onClick={handleViewStudentProgress}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition-colors"
        >
          View Student Progress
        </button>
      </div>
    </div>
  );
};

export default TutorCourseOverview;