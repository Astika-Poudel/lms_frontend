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
    return <div>Loading...</div>;
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      deleteCourse(id);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit-course/${id}`); // Navigate to the edit page with course ID
  };

  const handleCreateCourse = () => {
    navigate("/admin/course/new"); // Navigate to the course creation page
  };

  return (
    <div className="courses p-6">
      {/* Create Course Button */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-center text-[#134e4a]">Available Courses</h2>
        <button
          className="create-course-btn px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
          onClick={handleCreateCourse} // Navigate to create course page
        >
          Create Course
        </button>
      </div>

      <div className="course-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            const imagePath = `${LMS_Backend}/${course.image.replace(/\\/g, '/')}`;

            return (
              <div
                key={course._id}
                className="course-item bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition duration-300"
              >
                <div className="p-4">
                  {course.image && (
                    <img
                      src={imagePath}
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-800 mt-4">{course.title}</h3>
                  <p className="text-gray-600 mt-2">{course.description}</p>
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-gray-800">Price: NPR {course.price}</p>
                    <p className="text-sm text-gray-500">Duration: {course.duration} Month</p>
                  </div>
                  <div className="mt-6 flex justify-between">
                    {/* Edit button at the start */}
                    <button
                      className="edit-btn px-4 py-2 bg-[#134e4a] text-white font-semibold rounded-lg hover:bg-[#0c3f3b] transition duration-300"
                      onClick={() => handleEdit(course._id)} // Navigate to edit page with course ID
                    >
                      Edit
                    </button>
                    
                    {/* Delete button at the end */}
                    <button
                      className={`delete-btn px-4 py-2 bg-[#2f6b68] text-white font-semibold rounded-lg hover:bg-[#245a53] transition duration-300 ${btnLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleDelete(course._id)} // Pass course ID to delete
                      disabled={btnLoading} // Disable button while loading
                    >
                      {btnLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>No courses available.</p>
        )}
      </div>
    </div>
  );
};

export default AdminCourse;
