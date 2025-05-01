import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { LMS_Backend } from "../main";

const EnrollContext = createContext();

export const EnrollContextProvider = ({ children }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollmentCache, setEnrollmentCache] = useState(new Set());

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized: No token found");
      return false;
    }
    return token;
  };

  const isAlreadyEnrolled = async (courseId) => {
    try {
      const token = checkToken();
      if (!token) return false;

      const { data } = await axios.get(`${LMS_Backend}/api/user/enrolled`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.courses.some((course) => course._id === courseId);
    } catch (error) {
      console.error("Error checking enrollment status:", error);
      return false;
    }
  };

  const fetchEnrolledCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = checkToken();
      if (!token) return;

      const { data } = await axios.get(`${LMS_Backend}/api/user/enrolled`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setEnrolledCourses(data.courses);
      } else {
        toast.error(data.message || "Failed to fetch enrolled courses");
      }
    } catch (error) {
      console.error("Enrollment Error:", error);
      toast.error(error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollInCourse = useCallback(
    async (courseId) => {
      const cacheKey = `${courseId}-${localStorage.getItem("userId") || "unknown"}`;
      if (enrollmentCache.has(cacheKey)) {
        console.log("Enrollment already in progress for", cacheKey);
        toast.info("Enrollment already in progress");
        return;
      }

      setLoading(true);
      try {
        const token = checkToken();
        if (!token) return;

        if (!courseId || typeof courseId !== "string" || !courseId.match(/^[0-9a-fA-F]{24}$/)) {
          toast.error("Invalid course ID");
          throw new Error("Invalid course ID");
        }

        const alreadyEnrolled = await isAlreadyEnrolled(courseId);
        if (alreadyEnrolled) {
          console.log("User already enrolled in course:", courseId);
          toast.success("You are already enrolled in this course");
          return;
        }

        console.log("Enrolling in course with ID:", courseId);

        setEnrollmentCache((prev) => new Set(prev).add(cacheKey));

        const { data } = await axios.post(
          `${LMS_Backend}/api/user/enroll/${courseId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success(data.message || "Successfully enrolled in the course!");
          await fetchEnrolledCourses();
        } else {
          toast.error(data.message || "Failed to enroll in course");
        }
      } catch (error) {
        console.error("Enrollment Error:", error);
        toast.error(error.response?.data?.message || "An error occurred");
        throw error;
      } finally {
        setEnrollmentCache((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
        setLoading(false);
      }
    },
    [fetchEnrolledCourses]
  );

  return (
    <EnrollContext.Provider
      value={{
        enrolledCourses,
        fetchEnrolledCourses,
        enrollInCourse,
        loading,
      }}
    >
      {children}
    </EnrollContext.Provider>
  );
};

export const EnrollData = () => useContext(EnrollContext);