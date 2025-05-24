import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { EnrollData } from "../../context/enrollContext";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";
import { ChevronLeft } from "lucide-react";

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { fetchEnrolledCourses, enrolledCourses, loading: enrollLoading } = EnrollData();
  const { fetchStudentCourseProgress } = CourseData();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseProgressData, setCourseProgressData] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        console.log("Fetching student data for ID:", studentId);
        const { data } = await axios.get(`${LMS_Backend}/api/users/${studentId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!isMounted) return;

        if (data.success) {
          setStudent(data.user);
          await fetchEnrolledCourses();
        } else {
          setError("Failed to fetch student data");
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Error fetching student data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudentData();

    return () => {
      isMounted = false;
    };
  }, [studentId, fetchEnrolledCourses]);

  useEffect(() => {
    let isMounted = true;

    const fetchProgressData = async () => {
      if (!isMounted || !enrolledCourses.length) return;

      try {
        const progressData = {};
        for (const course of enrolledCourses) {
          const progress = await fetchStudentCourseProgress(course._id);
          if (progress && isMounted) {
            progressData[course._id] = {
              ...progress,
              certificateAwarded: progress.certificateAwarded || false,
            };
          }
        }
        if (isMounted) {
          setCourseProgressData(progressData);
        }
      } catch (err) {
        console.error("Error fetching progress data:", err);
      }
    };

    fetchProgressData();

    return () => {
      isMounted = false;
    };
  }, [enrolledCourses, fetchStudentCourseProgress]);

  if (loading || enrollLoading) {
    return <div className="text-gray-700 text-center py-10">Loading...</div>;
  }

  if (error || !student) {
    return (
      <div className="text-gray-700 text-center py-10">
        {error || "Student not found."}
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-teal-600 underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-teal-600 transition duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="ml-1 font-medium">Back</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={student.image ? `${LMS_Backend}/Uploads/${student.image}` : "https://via.placeholder.com/96"}
              alt={`${student.firstname} ${student.lastname}`}
              className="w-24 h-24 rounded-full border-4 border-teal-600 object-cover"
            />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {student.firstname} {student.lastname}
              </h2>
              <p className="text-gray-600 mt-1 capitalize">{student.role}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800">Courses</h3>
            {enrollLoading ? (
              <p className="text-gray-600 mt-2">Loading courses...</p>
            ) : enrolledCourses.length > 0 ? (
              <div className="mt-4 grid gap-4">
                {enrolledCourses.map((course) => {
                  const progress = courseProgressData[course._id] || {};
                  const status = progress.certificateAwarded ? "Completed" : "In Progress";
                  return (
                    <div
                      key={course._id}
                      className="p-4 bg-gray-100 rounded-lg shadow-sm"
                    >
                      <h4 className="text-lg font-medium text-gray-800">
                        <a
                          href={`/course/${course._id}`}
                          className="hover:text-teal-600 transition"
                        >
                          {course.title}
                        </a>
                      </h4>
                      <p className={`text-sm ${status === "Completed" ? "text-green-600" : "text-teal-600"}`}>
                        Status: {status}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 mt-2">No courses enrolled.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;