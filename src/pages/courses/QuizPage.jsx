import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";
import { ChevronLeft } from "lucide-react";

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState(null);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${LMS_Backend}/api/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!data.quiz || !data.quiz.questions) {
        throw new Error("Quiz data is incomplete or missing questions");
      }
      setQuiz(data.quiz);
      setAnswers(new Array(data.quiz.questions.length).fill(null));

      const userId = localStorage.getItem("userId");
      const existingSubmission = data.quiz.submissions?.find(
        (sub) => sub.student.toString() === userId
      );
      if (existingSubmission) {
        setSubmission({ score: existingSubmission.score });
      } else {
        setSubmission(null);
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      setError("Failed to load quiz. Please try again.");
      toast.error(error.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleAnswer = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    try {
      const formattedAnswers = answers.map((selectedOption, idx) => ({
        questionIndex: idx,
        selectedOption,
      }));
      const { data } = await axios.post(
        `${LMS_Backend}/api/quiz/${quizId}/submit`,
        { answers: formattedAnswers },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSubmission({ score: data.score });
      toast.success(`Quiz submitted! Score: ${data.score}%`);

      // Determine if the quiz was passed and update the phase
      const currentPhase = location.state?.currentPhase || 1;
      const nextPhase =
        data.score >= quiz.course.passingScore ? currentPhase + 1 : currentPhase;

      setTimeout(() => {
        navigate(`/student/course/progress/${quiz.course}`, {
          state: { currentPhase: nextPhase },
        });
      }, 1500);
    } catch (error) {
      toast.error("Failed to submit quiz");
    }
  };

  const handleRetake = async () => {
    try {
      // Reset the submission by making an API call to clear the existing submission
      await axios.post(
        `${LMS_Backend}/api/quiz/${quizId}/retake`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setSubmission(null);
      setAnswers(new Array(quiz.questions.length).fill(null));
      fetchQuiz();
    } catch (error) {
      toast.error("Failed to retake quiz");
    }
  };

  const handleBack = () => {
    if (!submission && answers.some((answer) => answer !== null)) {
      if (
        window.confirm(
          "Are you sure you want to leave? Your quiz progress will not be saved."
        )
      ) {
        navigate(`/student/course/progress/${quiz.course}`, {
          state: { currentPhase: location.state?.currentPhase || 1 },
        });
      }
    } else {
      navigate(`/student/course/progress/${quiz.course}`, {
        state: { currentPhase: location.state?.currentPhase || 1 },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#134e4a]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (!quiz) {
    return <div className="text-red-500 text-center py-10">Quiz not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center text-black hover:text-gray-700 transition duration-300"
          >
            <ChevronLeft className="w-8 h-8 text-black" />
          </button>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
        </div>
      </div>
      {submission ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-base text-gray-600">
            Score: {submission.score}%{" "}
            {submission.score >= quiz.course.passingScore
              ? "(Passed)"
              : "(Failed)"}
          </p>
          {submission.score < quiz.course.passingScore && (
            <button
              onClick={handleRetake}
              className="bg-[#134e4a] text-white px-4 py-2 rounded mt-4 hover:bg-[#0c3c38] transition-colors"
            >
              Retake Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {quiz.questions.length === 0 ? (
            <p className="text-gray-600 text-center">
              No questions available for this quiz.
            </p>
          ) : (
            quiz.questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-white p-4 rounded-lg shadow">
                <p className="font-semibold mb-2">{q.questionText}</p>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center my-2">
                    <input
                      type="radio"
                      name={`q${qIdx}`}
                      checked={answers[qIdx] === optIdx}
                      onChange={() => handleAnswer(qIdx, optIdx)}
                      className="mr-2"
                    />
                    <span className="text-gray-700">{opt.text}</span>
                  </div>
                ))}
              </div>
            ))
          )}
          {quiz.questions.length > 0 && (
            <button
              onClick={submitQuiz}
              className="bg-[#134e4a] text-white px-4 py-2 rounded hover:bg-[#0c3c38] transition-colors"
            >
              Submit Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPage;