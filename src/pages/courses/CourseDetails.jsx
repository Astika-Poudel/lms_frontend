import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { CourseData } from "../../context/CourseContext";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    courses,
    fetchCourses,
    fetchLectures,
    lectures,
    lecturesLoading,
    fetchTutorRatings,
    tutorRatings,
  } = CourseData();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecturesFetched, setLecturesFetched] = useState(false);
  const [ratingsFetched, setRatingsFetched] = useState(false);

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

        if (!ratingsFetched) {
          fetchTutorRatings(id)
            .then(() => setRatingsFetched(true))
            .catch((error) => console.error("Error fetching ratings:", error));
        }
      } else {
        setCourse(null);
      }
    }
  }, [
    loading,
    courses,
    id,
    fetchLectures,
    lecturesFetched,
    fetchTutorRatings,
    ratingsFetched,
  ]);

  const handleBack = () => {
    navigate(-1);
  };

  // Function to calculate time ago
  const timeAgo = (date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInMs = now - reviewDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return <div className="text-center text-gray-700">Loading course details...</div>;
  }

  if (!course) {
    return <div className="text-center text-gray-700">Course not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={handleBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition duration-300 mb-6"
      >
        <FaArrowLeft className="mr-2" />
        Back
      </button>

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
            <p className="font-semibold text-gray-200">
              Tutor: {course.Tutor ? `${course.Tutor.firstname} ${course.Tutor.lastname}` : "Not assigned"}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(`/payment/${id}`)}
            className="px-6 py-2 bg-white text-[#012f3c] font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Enroll
          </button>
        </div>
      </div>

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

      <h3 className="text-2xl font-semibold text-gray-800 mt-6">Tutor Ratings & Feedback</h3>
      {ratingsFetched && tutorRatings.length > 0 ? (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6">
          {tutorRatings.map((rating, index) => (
            <div key={index} className="mb-4 border-b pb-4 last:border-b-0">
              <div className="flex items-center mb-2">
                <span className="font-semibold text-gray-800 mr-2">
                  {rating.student.firstName} {rating.student.lastName}
                </span>
                <span className="text-yellow-400">{'★'.repeat(rating.rating)}</span>
                <span className="text-gray-400">{'★'.repeat(5 - rating.rating)}</span>
                <span className="ml-2 text-gray-500 text-sm">
                  {timeAgo(rating.createdAt)}
                </span>
              </div>
              <p className="text-gray-700">{rating.feedback}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No ratings available yet.</p>
      )}
    </div>
  );
};

export default CourseDetails;