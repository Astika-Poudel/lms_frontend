// components/TutorQuizzes.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { LMS_Backend } from "../../main";

const TutorQuizzes = () => {
  const navigate = useNavigate();
  const { user } = UserData();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllQuizzes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${LMS_Backend}/api/tutor/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setQuizzes(response.data.quizzes || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load quizzes");
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllQuizzes();
    } else {
      setError("User not logged in");
      setLoading(false);
    }
  }, [user]);

  const handleViewQuiz = (quizId) => {
    navigate(`/tutor/quiz/${quizId}`);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Quizzes</h1>
        <p className="text-gray-600">
          View and manage all quizzes you’ve created across your courses.
        </p>
      </div>

      <div className="mb-8">
        {quizzes.length === 0 ? (
          <p className="text-gray-600">You haven’t created any quizzes yet.</p>
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
                    Course: {quiz.course?.title || "Unknown"}
                  </span>
                  <span className="text-gray-500">
                    Due: {new Date(quiz.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">
                    Questions: {quiz.questions?.length || 0}
                  </span>
                  <span className="text-gray-500">
                    Submissions: {quiz.submissions?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorQuizzes;