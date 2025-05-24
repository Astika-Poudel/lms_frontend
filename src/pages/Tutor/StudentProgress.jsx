import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LMS_Backend } from "../../main";
import { ChevronLeft } from "lucide-react";

const StudentProgress = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStudentProgress = async () => {
        try {
            const token = localStorage.getItem("token");
            console.log("Token retrieved from localStorage:", token); // Debug log
            if (!token) {
                setError("Unauthorized: Please log in");
                navigate("/login");
                return;
            }

            console.log("Fetching student progress for course ID:", id); // Debug log
            const response = await axios.get(`${LMS_Backend}/api/course/${id}/students/progress`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Student progress response:", response.data); // Debug log
            if (response.data.success) {
                setStudents(response.data.students || []);
            } else {
                setError(response.data.message || "Failed to load student progress");
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Session expired or invalid. Please log in again.");
                localStorage.removeItem("token");
                navigate("/login");
            } else if (err.response?.status === 403) {
                setError("Unauthorized: You are not the tutor of this course");
            } else if (err.response?.status === 404) {
                setError("Course not found");
            } else {
                setError(err.response?.data?.message || "Failed to load student progress");
            }
            console.error("Error fetching student progress:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentProgress();
    }, [id, navigate]);

    if (loading) return <div className="flex items-center justify-center h-screen text-gray-600 text-lg">Loading...</div>;
    if (error) return <div className="flex items-center justify-center h-screen text-red-500 text-lg">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <button
                        onClick={() => navigate(`/tutor/courseoverview/${id}`)}
                        className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="Back to Course Overview"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Student Progress</h1>
                    {students.length === 0 ? (
                        <p className="text-gray-600">No students enrolled in this course yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Progress</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Quizzes Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr
                                            key={student._id}
                                            className={`border-t ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors`}
                                        >
                                            <td className="px-4 py-3 text-gray-800">{student.name || "N/A"}</td>
                                            <td className="px-4 py-3 text-gray-800">{student.email || "N/A"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className="w-48 bg-gray-200 rounded-full h-2.5 mr-3">
                                                        <div
                                                            className="bg-[#134e4a] h-2.5 rounded-full"
                                                            style={{ width: `${student.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-gray-800">{student.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800">
                                                {student.quizzesCompleted} / {student.totalQuizzes}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProgress;