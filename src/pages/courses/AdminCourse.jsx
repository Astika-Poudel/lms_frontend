import React, { useEffect, useState } from "react";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const AdminCourse = () => {
  const { courses, fetchCourses, deleteCourse, loading, btnLoading } = CourseData();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const handleDelete = (id) => {
    setCourseToDelete(id);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteCourse(courseToDelete);
      toast.success("Course deleted successfully");
      setShowModal(false);
      setCourseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowModal(false);
    setCourseToDelete(null);
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
    <div className="flex-1 p-4 overflow-y-auto md:ml-64">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center mt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-[#134e4a] mb-4 md:mb-0 text-center md:flex-1">
          Available Courses
        </h2>
        <button
          className="px-4 py-2 md:px-6 md:py-3 bg-[#134e4a] text-white font-semibold rounded-lg hover:bg-[#0c3f3b] transition duration-300 w-full md:w-auto"
          onClick={handleCreateCourse}
        >
          Create Course
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            const imagePath = `${LMS_Backend}/${course.image.replace(/\\/g, '/')}`;

            return (
              <div
                key={course._id}
                className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer"
                onClick={() => handleViewCourseDetail(course._id)}
              >
                <div className="p-3 sm:p-4">
                  {course.image && (
                    <img
                      src={imagePath}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-32 sm:h-40 object-cover rounded-lg"
                    />
                  )}
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mt-2">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
                      Price: NPR {course.price}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Duration: {course.duration} Month
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between gap-2">
                    <button
                      className="px-2 py-1 sm:px-4 sm:py-2 bg-[#134e4a] text-white font-semibold rounded-lg hover:bg-[#0c3f3b] transition duration-300 w-full sm:w-auto text-sm sm:text-base"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(course._id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={`px-2 py-1 sm:px-4 sm:py-2 bg-[#8A0707] text-white font-semibold rounded-lg hover:bg-[#6A0505] transition duration-300 w-full sm:w-auto text-sm sm:text-base ${
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
          <p className="text-gray-600 text-center text-sm sm:text-base">No courses available.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 sm:p-8 w-11/12 sm:w-96 max-w-[90%]">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
              Are you sure you want to delete this course?
            </h3>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 transition duration-300 text-sm sm:text-base"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 sm:px-4 sm:py-2 bg-[#134e4a] text-white rounded-full hover:bg-[#0c3f3b] transition duration-300 text-sm sm:text-base"
                onClick={confirmDelete}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
};

export default AdminCourse;