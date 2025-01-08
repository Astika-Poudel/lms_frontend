import React, { useEffect } from "react";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";

const Courses = () => {
  const { courses, fetchCourses, loading } = CourseData();

  useEffect(() => {
    fetchCourses(); // Fetch courses when the component mounts
  }, []); // Empty dependency array ensures this runs only once

  if (loading) {
    return <div>Loading...</div>; // Show loading state while fetching data
  }

  return (
    <div className="courses p-6">
      <h2 className="text-3xl font-bold text-center mb-6">Available Courses</h2>
      <div className="course-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses && courses.length > 0 ? (
          courses.map((course) => {
            // Ensure all backslashes are replaced with forward slashes
            const imagePath = `${LMS_Backend}/uploads/${course.image.replace(/\\/g, "/")}`;

            return (
              <div
                key={course._id}
                className="course-item bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition duration-300"
              >
                <div className="p-4">
                  {/* Display course image if available */}
                  {course.image && (
                    <img
                      src={imagePath} // Use the corrected image URL
                      alt={course.title}
                      loading="lazy"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <h3 className="text-xl font-semibold text-gray-800 mt-4">{course.title}</h3>
                  <p className="text-gray-600 mt-2">{course.description}</p>
                  <div className="mt-4">
                    <p className="text-lg font-semibold text-gray-800">Price: ${course.price}</p>
                    <p className="text-sm text-gray-500">Duration: {course.duration} hours</p>
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

export default Courses;
