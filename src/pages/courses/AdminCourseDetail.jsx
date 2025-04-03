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
    return <div className="text-center text-gray-700">Loading course details...</div>;
  }

  if (!course) {
    return <div className="text-center text-gray-700">Course not found.</div>;
  }

  const imagePath = course.image ? `${LMS_Backend}/${course.image.replace(/\\/g, '/')}` : null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-4">{course.title}</h2>
      <p className="text-gray-600 mb-4 text-sm sm:text-base">{course.description}</p>
      <p className="font-semibold text-sm sm:text-base">Category: {course.category}</p>
      <p className="font-semibold text-sm sm:text-base">Duration: {course.duration} Hours</p>
      <p className="font-semibold text-sm sm:text-base">Price: NPR {course.price}</p>

      {imagePath ? (
        <img src={imagePath} alt={course.title} className="w-full h-48 sm:h-64 object-cover mt-4 rounded-md" />
      ) : (
        <p className="text-gray-500 mt-4">Image not available</p>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">Lectures</h3>
        <button
          onClick={() => navigate(`/admin/add-lecture/course/${id}`)}
          className="bg-green-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base"
        >
          Add Lecture
        </button>
      </div>

      {lecturesLoading ? (
        <div className="text-center text-gray-700">Loading lectures...</div>
      ) : lectures && lectures.length > 0 ? (
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-sm sm:text-base">Course No.</th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-sm sm:text-base">Lecture Title</th>
                <th className="py-2 px-2 sm:px-4 border-b text-left text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lectures.map((lecture, index) => (
                <tr key={lecture._id} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-2 sm:px-4">{index + 1}</td>
                  <td className="py-2 px-2 sm:px-4">{lecture.title}</td>
                  <td className="py-2 px-2 sm:px-4 text-center">
                    <button
                      onClick={() => deleteLecture(lecture._id)}
                      className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded mr-1 sm:mr-2 text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/admin/edit-lecture/${lecture._id}`)}
                      className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded text-xs sm:text-sm"
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
        <p className="text-gray-500 text-center mt-4">No lectures available.</p>
      )}
    </div>
  );
};

export default AdminCourseDetail;