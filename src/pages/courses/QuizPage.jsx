import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LMS_Backend } from "../../main";
import toast from "react-hot-toast";

const QuizPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const { data } = await axios.get(`${LMS_Backend}/api/quiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                setQuiz(data.quiz);
                setAnswers(new Array(data.quiz.questions.length).fill(null));

                const existingSubmission = data.quiz.submissions.find(sub => sub.student.toString() === localStorage.getItem("userId"));
                if (existingSubmission) {
                    setSubmission(existingSubmission);
                }
            } catch (error) {
                toast.error("Failed to load quiz");
            } finally {
                setLoading(false);
            }
        };
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
            const { data } = await axios.post(`${LMS_Backend}/api/quiz/${quizId}/submit`, { answers: formattedAnswers }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            toast.success(`Quiz submitted! Score: ${data.score}%`);
            setSubmission({ score: data.score });
            setTimeout(() => {
                navigate(`/student/course/progress/${quiz.course}`);
            }, 1500);
        } catch (error) {
            toast.error("Failed to submit quiz");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!quiz) return <div>Quiz not found</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
            {submission ? (
                <div className="bg-white p-4 rounded-lg shadow">
                    <p>Score: {submission.score}% {submission.score >= quiz.course.passingScore ? "(Passed)" : "(Failed)"}</p>
                    {submission.score < quiz.course.passingScore && (
                        <button
                            onClick={() => setSubmission(null)}
                            className="bg-[#134e4a] text-white px-4 py-2 rounded mt-4"
                        >
                            Retake Quiz
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {quiz.questions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-white p-4 rounded-lg shadow">
                            <p className="font-semibold">{q.questionText}</p>
                            {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center">
                                    <input
                                        type="radio"
                                        name={`q${qIdx}`}
                                        checked={answers[qIdx] === optIdx}
                                        onChange={() => handleAnswer(qIdx, optIdx)}
                                    />
                                    <span className="ml-2">{opt.text}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    <button onClick={submitQuiz} className="bg-[#134e4a] text-white px-4 py-2 rounded">Submit Quiz</button>
                </div>
            )}
        </div>
    );
};

export default QuizPage;