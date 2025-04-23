import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast, { Toaster } from "react-hot-toast";

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

    const addOption = (questionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options.push({ text: "", isCorrect: false });
        setQuestions(newQuestions);
    };

    const updateOption = (questionIndex, optionIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options[optionIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${LMS_Backend}/api/quiz/new`,
                { title, description, courseId, questionsPool: questions, questionCount: questions.length, type },
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

    return (
        <div className="p-6">
            <Toaster />
            <h1 className="text-2xl font-bold mb-4">Create Quiz</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Quiz Title"
                    className="block w-full p-2 mb-4 border rounded"
                    required
                />
                <div className="mb-4">
                    <label htmlFor="type" className="block text-gray-700 font-medium mb-2">
                        Quiz Type
                    </label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="block w-full p-2 border rounded"
                        required
                    >
                        <option value="beginner">Beginner</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="mb-4 p-4 border rounded">
                        <select
                            value={q.type}
                            onChange={(e) => updateQuestion(qIdx, "type", e.target.value)}
                            className="mb-2 p-2 border rounded"
                        >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True/False</option>
                        </select>
                        <input
                            type="text"
                            value={q.questionText}
                            onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                            placeholder="Question Text"
                            className="block w-full p-2 mb-2 border rounded"
                            required
                        />
                        {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center mb-2">
                                <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => updateOption(qIdx, optIdx, "text", e.target.value)}
                                    placeholder="Option Text"
                                    className="p-2 border rounded flex-1"
                                    required
                                />
                                <input
                                    type="checkbox"
                                    checked={opt.isCorrect}
                                    onChange={(e) => updateOption(qIdx, optIdx, "isCorrect", e.target.checked)}
                                    className="ml-2"
                                />
                            </div>
                        ))}
                        <button type="button" onClick={() => addOption(qIdx)} className="text-blue-600">
                            Add Option
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addQuestion} className="text-blue-600 mb-4">
                    Add Question
                </button>
                <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded">
                    Create Quiz
                </button>
            </form>
        </div>
    );
};

export default TutorCreateQuiz;