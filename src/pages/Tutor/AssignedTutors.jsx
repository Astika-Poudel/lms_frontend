import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { TutorData } from "../../context/TutorContext";

const AssignedTutors = () => {
  const { user } = UserData();
  const { fetchAllTutors, assignTutorToCourse, removeTutorFromCourse, tutors, loading: tutorLoading } = TutorData();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }

      const coursesResponse = await axios.get("/api/course/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Courses API response:", coursesResponse.data);
      if (coursesResponse.data.success) {
        setCourses(coursesResponse.data.courses || []);
      } else {
        throw new Error("Failed to fetch courses");
      }

      await fetchAllTutors();
      console.log("Tutors from context:", tutors);
    } catch (err) {
      console.error("Error fetching data:", err.response || err.message);
      setError(err.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTutorUpdate = async (courseId, tutorId) => {
    try {
      await assignTutorToCourse(courseId, tutorId);
      await fetchData();
    } catch (err) {
      console.error("Tutor update failed:", err);
      setError(err.message || "Failed to assign tutor. Please try again.");
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await removeTutorFromCourse(courseId);
      await fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to remove tutor. Please try again.");
    }
  };

  useEffect(() => {
    if (user && user.role === "Admin") {
      fetchData();
    } else {
      setError("Access denied. Admin only.");
    }
  }, [user]);

  if (loading || tutorLoading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 ml-0 md:ml-64">
      <h1 className="text-xl sm:text-2xl font-bold text-[#134e4a] mb-6 text-center md:text-left">
        Tutor Management
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Course Title</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Email</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Tutor Name</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id} className="border-b hover:bg-gray-100">
                <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">{course.title}</td>
                <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">
                  {course.Tutor?.email || "N/A"}
                </td>
                <td className="py-2 px-2 sm:px-4">
                  <select
                    value={course.Tutor?._id || ""}
                    onChange={(e) => handleTutorUpdate(course._id, e.target.value)}
                    className="border rounded px-1 py-1 sm:px-2 sm:py-1 text-sm sm:text-base w-32 sm:w-40"
                  >
                    <option value="">No Tutor</option>
                    {tutors.map((tutor) => (
                      <option key={tutor._id} value={tutor._id}>
                        {`${tutor.firstname} ${tutor.lastname}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-2 sm:px-4">
                  {course.Tutor && (
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="bg-[#134e4a] text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-[#0f3b38] text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedTutors;