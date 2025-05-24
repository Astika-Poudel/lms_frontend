import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";

const AdminCourseDetail = () => {
  const { id } = useParams();
  const { courses, fetchCourses, fetchLectures, deleteLecture, lectures, lecturesLoading } = CourseData();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecturesFetched, setLecturesFetched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && courses.length > 0) {
      const foundCourse = courses.find((c) => c._id === id);
      if (foundCourse) {
        setCourse(foundCourse);
        if (!lecturesFetched) {
          fetchLectures(id)
            .then(() => setLecturesFetched(true))
            .catch((error) => console.error("Error fetching lectures:", error));
        }
      } else {
        setCourse(null);
      }
    }
  }, [loading, courses, id, fetchLectures, lecturesFetched]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-700 text-lg">Loading course details...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-700 text-lg">Course not found.</div>
      </div>
    );
  }

  const imagePath = course.image ? `${LMS_Backend}/${course.image.replace(/\\/g, '/')}` : null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 focus:outline-none"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 mb-4">{course.title}</h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base lg:text-lg">{course.description}</p>
          <div className="flex flex-col mb-4 space-y-2">
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Category: {course.category}</p>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Duration: {course.duration} Hours</p>
            <p className="font-semibold text-sm sm:text-base lg:text-lg">Price: NPR {course.price}</p>
          </div>

          {imagePath ? (
            <img
              src={imagePath}
              alt={course.title}
              className="w-full h-48 sm:h-64 lg:h-80 object-cover mt-4 rounded-md"
            />
          ) : (
            <p className="text-gray-500 mt-4 text-sm sm:text-base">Image not available</p>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-800 mb-2 sm:mb-0">
              Lectures
            </h3>
            <button
              onClick={() => navigate(`/admin/add-lecture/course/${id}`)}
              className="bg-[#134e4a] text-white px-4 py-2 rounded-md hover:bg-[#0f3b36] transition-colors duration-200 text-sm sm:text-base"
            >
              Add Lecture
            </button>
          </div>

          {lecturesLoading ? (
            <div className="text-center text-gray-700 text-sm sm:text-base mt-4">Loading lectures...</div>
          ) : lectures && lectures.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-2 sm:px-4 border-b text-left text-sm sm:text-base font-medium text-gray-700">
                      Course No.
                    </th>
                    <th className="py-3 px-2 sm:px-4 border-b text-left text-sm sm:text-base font-medium text-gray-700">
                      Lecture Title
                    </th>
                    <th className="py-3 px-2 sm:px-4 border-b text-left text-sm sm:text-base font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lectures.map((lecture, index) => (
                    <tr key={lecture._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{index + 1}</td>
                      <td className="py-3 px-2 sm:px-4 text-sm sm:text-base">{lecture.title}</td>
                      <td className="py-3 px-2 sm:px-4 flex space-x-2">
                        <button
                          onClick={() => deleteLecture(lecture._id)}
                          className="bg-[#8b0000] text-white px-3 py-1 rounded-md hover:bg-[#6b0000] transition-colors duration-200 text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => navigate(`/admin/edit-lecture/${lecture._id}`)}
                          className="bg-[#134e4a] text-white px-3 py-1 rounded-md hover:bg-[#0f3b36] transition-colors duration-200 text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-4 text-sm sm:text-base">No lectures available.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminCourseDetail;