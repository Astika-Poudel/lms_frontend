import React, { useEffect } from "react";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";
import { useNavigate } from "react-router-dom";

const AdminCourse = () => {
  const { courses, fetchCourses, deleteCourse, loading, btnLoading } = CourseData();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourse(id);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit-course/${id}`);
  };

  const handleCreateCourse = () => {
    navigate("/admin/course/new");
  };

  const handleViewCourseDetail = (id) => {
    navigate(`/admin/course-detail/${id}`);
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto ml-0 md:ml-64">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center mt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#134e4a] mb-4 md:mb-0">
          Available Courses
        </h2>
        <button
          className="px-4 py-2 md:px-6 md:py-3 bg-[#134e4a] text-white font-semibold rounded-lg hover:bg-[#0c3f3b] transition duration-300 w-full md:w-auto"
          onClick={handleCreateCourse}
        >
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            const imagePath = `${LMS_Backend}/${course.image.replace(/\\/g, '/')}`;

            return (
              <div
                key={course._id}
                className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer"
                onClick={() => handleViewCourseDetail(course._id)}
              >
                <div className="p-4">
                  {course.image && (
                    <img
                      src={imagePath}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-32 sm:h-40 object-cover rounded-lg"
                    />
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mt-2">
                    {course.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-2">
                    <p className="text-base sm:text-lg font-semibold text-gray-800">
                      Price: NPR {course.price}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Duration: {course.duration} Month
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2">
                    <button
                      className="px-2 py-1 sm:px-4 sm:py-2 bg-[#134e4a] text-white font-semibold rounded-lg hover:bg-[#0c3f3b] transition duration-300 w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(course._id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={`px-2 py-1 sm:px-4 sm:py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-300 w-full sm:w-auto ${
                        btnLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(course._id);
                      }}
                      disabled={btnLoading}
                    >
                      {btnLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 text-center">No courses available.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCourse;