import React from "react";
import { useNavigate } from "react-router-dom";
import { TutorData } from "../../context/TutorContext";
import { ChevronLeft } from "lucide-react";

const TutorCourses = () => {
  const { tutorCourses, loading, error } = TutorData();
  const navigate = useNavigate();

  // Updated back button handler
  const handleBack = () => {
    navigate("/dashboard/tutor");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 mr-2" />
        Back
      </button>
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        My Assigned Courses
      </h1>
      {tutorCourses.length === 0 ? (
        <p className="text-gray-600">No courses assigned to you yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Category:</span> {course.category || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Price:</span> NPR {course.price || 0}
                </p>
                <p>
                  <span className="font-medium">Enrolled Students:</span> {course.enrolledStudents?.length || 0}
                </p>
                <p>
                  <span className="font-medium">Created At:</span> {new Date(course.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => navigate(`/tutor/courseoverview/${course._id}`)}
                className="mt-4 w-full text-white py-2 rounded-md hover:bg-[#0f3b36] transition-colors"
                style={{ backgroundColor: "#134e4a" }}
              >
                Course Overview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorCourses;