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



  // Fetch courses when the component mounts
  useEffect(() => {
    fetchCourses().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && courses.length > 0) {
      const foundCourse = courses.find((c) => c._id === id);
      if (foundCourse) {
        setCourse(foundCourse);

        // Fetch lectures only if not already fetched
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
 
  // Construct image path to ensure it displays correctly
  const imagePath = course.image ? `${LMS_Backend}/${course.image.replace(/\\/g, '/')}` : null;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-semibold text-gray-800 mb-4">{course.title}</h2>
      <p className="text-gray-600 mb-4">{course.description}</p>
      <p className="font-semibold">Category: {course.category}</p>
      <p className="font-semibold">Duration: {course.duration} Hours</p>
      <p className="font-semibold">Price: NPR {course.price}</p>

      {imagePath ? (
        <img src={imagePath} alt={course.title} className="w-full h-64 object-cover mt-4 rounded-md" />
      ) : (
        <p className="text-gray-500 mt-4">Image not available</p>
      )}

      <h3 className="text-2xl font-semibold text-gray-800 mt-6">Lectures</h3>
      {lecturesLoading ? (
        <div className="text-center text-gray-700">Loading lectures...</div>
      ) : lectures && lectures.length > 0 ? (
        <table className="min-w-full table-auto mt-4 border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Course No.</th>
              <th className="py-2 px-4 border-b text-left">Lecture Title</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lectures.map((lecture, index) => (
              <tr key={lecture._id} className="border-b hover:bg-gray-100">
                <td className="py-2 px-4">{index + 1}</td>
                <td className="py-2 px-4">{lecture.title}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => deleteLecture(lecture._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => navigate(`/admin/edit-lecture/${lecture._id}`)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No lectures available.</p>
      )}
    </div>
  );
};

export default AdminCourseDetail;