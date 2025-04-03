import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaBook, FaClock } from "react-icons/fa";
import { EnrollData } from "../../context/enrollContext";
import { LMS_Backend } from "../../main"; // Ensure LMS_Backend is imported

const MyCourses = () => {
  const { enrolledCourses, fetchEnrolledCourses, loading } = EnrollData();
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        await fetchEnrolledCourses();
      } catch (err) {
        setError("Failed to load enrolled courses. Please try again.");
      }
    };
    loadCourses();
  }, [fetchEnrolledCourses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchEnrolledCourses();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded mt-2 hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">You haven't enrolled in any courses yet</h2>
        <p className="text-gray-600 mb-6">Browse our course catalog to find the perfect course for you.</p>
        <Link
          to="/student/course/all"
          className="bg-[#134e4a] text-white px-6 py-3 rounded-lg hover:bg-[#0c3c38]"
        >
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Updated "My Courses" heading with matching color */}
      <h1 className="text-2xl font-bold mb-6 text-center text-[#134e4a]">My Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course) => (
          <div key={course._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={course.image ? `${LMS_Backend}/${course.image}` : "https://via.placeholder.com/300x200"} // Fallback image
              alt={course.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <FaBook className="mr-2" />
                <span>{course.Lectures?.length || 0} Lectures</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <FaClock className="mr-2" />
                <span>{course.duration ? `${course.duration} months` : "Self-paced"}</span>
              </div>
              <Link
                to={`/student/course/${course._id}`}
                className="block w-full bg-[#134e4a] text-white text-center py-2 rounded hover:bg-[#0c3c38]"
              >
                Continue Learning
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCourses;