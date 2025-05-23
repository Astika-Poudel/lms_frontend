import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";

const Courses = () => {
  const {
    filteredCourses,
    fetchCourses,
    loading,
    selectedCategory,
    searchQuery,
  } = CourseData();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleViewCourseDetail = (id) => {
    navigate(`/student/coursedetails/${id}`);
  };

  const handleEnroll = (e, id) => {
    e.stopPropagation();
    navigate(`/payment/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">Loading...</div>
    );
  }

  return (
    <div className="courses p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-col items-center gap-4">
        <h2 className="text-3xl font-bold text-[#134e4a]">
          {searchQuery
            ? `Search Results for "${searchQuery}"`
            : selectedCategory === "All"
            ? "Available Courses"
            : `Courses in "${selectedCategory}"`}
        </h2>
      </div>

      <div className="course-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const imagePath = `${LMS_Backend}/${course.image?.replace(/\\/g, "/")}`;
            return (
              <div
                key={course._id}
                className="course-item bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer"
                onClick={() => handleViewCourseDetail(course._id)}
              >
                <div className="p-4">
                  {course.image && (
                    <img
                      src={imagePath}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-800 mt-4">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mt-2 line-clamp-2">{course.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-800">
                        Price: NPR {course.price}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {course.duration} Month
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleEnroll(e, course._id)}
                      className="bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 text-center w-full">No courses found.</p>
        )}
      </div>
    </div>
  );
};

export default Courses;