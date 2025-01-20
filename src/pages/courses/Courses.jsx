import React, { useEffect } from "react";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";

const Courses = () => {
  const { courses, fetchCourses, loading } = CourseData();

  useEffect(() => {
    fetchCourses(); 
  }, []); 

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="courses p-6">
      <h2 className="text-3xl font-bold text-center mb-6">Available Courses</h2>
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
              
                  <div className="mt-6">
                    <button className="enroll-btn px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300">
                      Enroll
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p>Enroll</p>
        )}
      </div>
    </div>
  );
};

export default Courses;
