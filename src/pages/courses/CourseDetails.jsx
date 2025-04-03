import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { courses, fetchCourses, fetchLectures, lectures, lecturesLoading } = CourseData();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecturesFetched, setLecturesFetched] = useState(false);

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

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Gradient Box */}
      <div
        className="rounded-lg p-6 shadow-lg"
        style={{
          background: "linear-gradient(to right, #012f3c, #015269)",
        }}
      >
        <div>
          <h2 className="text-3xl font-semibold text-white mb-4">{course.title}</h2>
          <p className="text-gray-200 mb-4">{course.description}</p>
          <div className="space-y-2">
            <p className="font-semibold text-gray-200">Category: {course.category}</p>
            <p className="font-semibold text-gray-200">Duration: {course.duration} Hours</p>
            <p className="font-semibold text-gray-200">Price: NPR {course.price}</p>
          </div>
        </div>

        {/* Enroll Button at the Bottom-Right */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(`/payment/${id}`)}
            className="px-6 py-2 bg-white text-[#012f3c] font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Enroll
          </button>
        </div>
      </div>

      {/* What You Will Learn Section */}
      <h3 className="text-2xl font-semibold text-gray-800 mt-6">What you will learn in this Course?</h3>
      {lecturesLoading ? (
        <div className="text-center text-gray-700">Loading course content...</div>
      ) : lectures && lectures.length > 0 ? (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6">
          {lectures.map((lecture, index) => (
            <div key={lecture._id} className="flex items-start space-x-2 mb-3">
              <span className="text-lg text-[#012f3c]">+</span>
              <p className="text-gray-700">
                Lesson {index + 1}: {lecture.title}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No course content available.</p>
      )}
    </div>
  );
};

export default CourseDetails;