import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast, { Toaster } from "react-hot-toast";
import { ChevronLeft, Plus, X, Trash2 } from "lucide-react";

const TutorCreateQuiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("beginner");
  const [questions, setQuestions] = useState([
    { type: "multiple-choice", questionText: "", options: [{ text: "", isCorrect: false }] },
  ]);
  const [error, setError] = useState(null);

  const addQuestion = () => {
    setQuestions([...questions, { type: "multiple-choice", questionText: "", options: [{ text: "", isCorrect: false }] }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      toast.error("At least one question is required.");
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length >= 4) {
      toast.error("Maximum 4 options allowed per question.");
      return;
    }
    newQuestions[questionIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[questionIndex].options.length <= 2) {
      toast.error("At least 2 options are required per question.");
      return;
    }
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex][field] = value;
    if (field === "isCorrect" && value) {
      newQuestions[questionIndex].options = newQuestions[questionIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optionIndex,
      }));
    }
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError("Quiz title is required.");
      return;
    }
    for (let q of questions) {
      if (!q.questionText) {
        setError("All questions must have text.");
        return;
      }
      if (q.options.length < 2) {
        setError("Each question must have at least 2 options.");
        return;
      }
      if (!q.options.some(opt => opt.isCorrect)) {
        setError("Each question must have one correct option.");
        return;
      }
      for (let opt of q.options) {
        if (!opt.text) {
          setError("All options must have text.");
          return;
        }
      }
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${LMS_Backend}/api/quiz/new`,
        { title, description, courseId, questions, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz created successfully!");
      setTimeout(() => {
        navigate(`/tutor/courseoverview/${courseId}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to create quiz");
      console.error("Error creating quiz:", err);
    }
  };

  const handleBack = () => {
    navigate(`/tutor/courseoverview/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <header className="bg-white shadow-sm p-4 md:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center text-black hover:text-gray-700 transition duration-300"
            >
              <ChevronLeft className="w-8 h-8 text-black" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Create Quiz
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description"
                className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                rows="3"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 border border-gray-200 rounded-lg relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Question {qIdx + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(qIdx, "type", e.target.value)}
                      className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text *
                    </label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                      placeholder="Enter question text"
                      className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(qIdx, optIdx, "text", e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                          className="block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] transition-colors"
                          required
                        />
                        <input
                          type="checkbox"
                          checked={opt.isCorrect}
                          onChange={(e) => updateOption(qIdx, optIdx, "isCorrect", e.target.checked)}
                          className="w-5 h-5 text-[#134e4a] border-gray-300 rounded focus:ring-[#134e4a]"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(qIdx, optIdx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addOption(qIdx)}
                    className="mt-3 flex items-center gap-1 text-[#134e4a] hover:text-[#0c3c38] font-medium"
                  >
                    <Plus className="w-4 h-4" /> Add Option
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 text-[#134e4a] hover:text-[#0c3c38] font-medium"
              >
                <Plus className="w-5 h-5" /> Add Question
              </button>
              <button
                type="submit"
                className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition-colors"
              >
                Create Quiz
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default TutorCreateQuiz;