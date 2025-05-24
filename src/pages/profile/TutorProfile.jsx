import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { CourseData } from "../../context/CourseContext";
import { LMS_Backend } from "../../main";
import { ChevronLeft, Star } from "lucide-react";

const TutorProfile = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { user } = UserData();
  const { fetchAllTutorRatings } = CourseData();
  const [tutor, setTutor] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingsByCourse, setRatingsByCourse] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize fetchAllTutorRatings to prevent recreation
  const memoizedFetchAllTutorRatings = useCallback(fetchAllTutorRatings, []);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component

    const fetchTutorData = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        console.log("Fetching tutor data for ID:", tutorId);
        const { data } = await axios.get(`${LMS_Backend}/api/users/${tutorId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!isMounted) return;

        if (data.success) {
          // Fetch all ratings for the tutor
          const tutorRatings = await memoizedFetchAllTutorRatings(tutorId);

          // Fetch course details for each rating
          const ratingsWithDetails = await Promise.all(
            tutorRatings.map(async (rating) => {
              try {
                const course = await axios.get(`${LMS_Backend}/api/course/${rating.courseId}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                return {
                  ...rating,
                  courseTitle: course.data.course?.title || "Unknown Course",
                };
              } catch (courseErr) {
                console.error(`Error fetching course ${rating.courseId}:`, courseErr);
                return { ...rating, courseTitle: "Unknown Course" }; // Fallback
              }
            })
          );

          if (!isMounted) return;

          // Sort ratings by course title
          ratingsWithDetails.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

          // Group ratings by course
          const groupedByCourse = ratingsWithDetails.reduce((acc, rating) => {
            const courseTitle = rating.courseTitle;
            acc[courseTitle] = acc[courseTitle] || [];
            acc[courseTitle].push(rating);
            return acc;
          }, {});

          // Fallback: Calculate average rating and count if backend data is inconsistent
          const totalRatings = ratingsWithDetails.length;
          const averageRating =
            totalRatings > 0
              ? ratingsWithDetails.reduce((sum, r) => sum + r.rating, 0) / totalRatings
              : 0;

          // Update tutor data with fallback values if necessary
          setTutor({
            ...data.user,
            averageTutorRating: data.user.averageTutorRating || Number(averageRating.toFixed(1)),
            tutorRatingCount: data.user.tutorRatingCount || totalRatings,
          });
          setRatings(ratingsWithDetails);
          setRatingsByCourse(groupedByCourse);
        } else {
          setError("Failed to fetch tutor data");
        }
      } catch (err) {
        console.error("Error fetching tutor data:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Error fetching tutor data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTutorData();

    // Cleanup to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [tutorId, memoizedFetchAllTutorRatings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-10">
        {error}
        <button
          onClick={() => navigate("/student/course/all")}
          className="mt-4 text-teal-600 underline"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Add Back Button in Main Section */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-teal-600 transition duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="ml-1 font-medium">Back</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Tutor Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img
              src={`${LMS_Backend}/Uploads/${tutor.image}`}
              alt={`${tutor.firstname} ${tutor.lastname}`}
              className="w-24 h-24 rounded-full border-4 border-teal-600 object-cover"
            />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {tutor.firstname} {tutor.lastname}
              </h2>
              <p className="text-gray-600 mt-1">Tutor</p>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.round(tutor.averageTutorRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {tutor.averageTutorRating.toFixed(1)} ({tutor.tutorRatingCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Tutor Reviews */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Tutor Reviews</h3>
            {ratings.length === 0 ? (
              <p className="text-gray-600 italic">No reviews available.</p>
            ) : (
              Object.entries(ratingsByCourse).map(([courseTitle, courseRatings]) => (
                <div key={courseTitle} className="mb-8">
                  <h4 className="text-lg font-medium text-teal-600 mb-4">{courseTitle}</h4>
                  <div className="space-y-6">
                    {courseRatings.map((rating) => (
                      <div
                        key={rating._id}
                        className="border-l-4 border-teal-100 pl-4 py-2"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rating.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        {rating.feedback && (
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {rating.feedback}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          By {rating.student?.firstname || "Unknown"}{" "}
                          {rating.student?.lastname || "User"} on{" "}
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TutorProfile;