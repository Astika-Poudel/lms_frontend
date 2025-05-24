import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { LMS_Backend } from "../main";
import toast, { Toaster } from "react-hot-toast";
import { UserData } from "./UserContext";

const TutorContext = createContext();

export const TutorContextProvider = ({ children }) => {
  const { user } = UserData();
  const [tutorCourses, setTutorCourses] = useState([]);
  const [tutorStats, setTutorStats] = useState({ assignedCourses: 0, totalStudents: 0 });
  const [tutors, setTutors] = useState([]);
  const [isTutorAuth, setIsTutorAuth] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the user is authenticated and has tutor or admin role
  const checkTutorAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsTutorAuth(false);
        setLoading(false);
        return;
      }

      // Use user from UserContext if available
      if (user && (user.role.toLowerCase() === "tutor" || user.role.toLowerCase() === "admin")) {
        setIsTutorAuth(true);
      } else {
        setIsTutorAuth(false);
      }
    } catch (err) {
      setIsTutorAuth(false);
      setError(err.response?.data?.message || "Authentication check failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tutor stats
  const fetchTutorStats = async () => {
    if (loading) return;
    setBtnLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.get(`${LMS_Backend}/api/tutor/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setTutorStats(data.stats || { assignedCourses: 0, totalStudents: 0 });
      } else {
        throw new Error(data.message || "Failed to fetch tutor stats");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error fetching tutor stats";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBtnLoading(false);
    }
  };

  // Fetch tutor courses
  const fetchTutorCourses = async () => {
    if (loading) return;
    setBtnLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.get(`${LMS_Backend}/api/tutor/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setTutorCourses(data.courses || []);
        //toast.success("Tutor courses fetched successfully");
      } else {
        throw new Error(data.message || "Failed to fetch tutor courses");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error fetching tutor courses";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBtnLoading(false);
    }
  };

  // Fetch all tutors (admin-only)
  const fetchAllTutors = async () => {
    if (loading) return;
    setBtnLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.get(`${LMS_Backend}/api/tutors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setTutors(data.tutors || []);
        //toast.success("Tutors fetched successfully");
      } else {
        throw new Error(data.message || "Failed to fetch tutors");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error fetching tutors";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBtnLoading(false);
    }
  };

  // Assign tutor to course (admin-only)
  const assignTutorToCourse = async (courseId, tutorId) => {
    if (loading) return;
    setBtnLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.put(
        `${LMS_Backend}/api/tutor/course/${courseId}/assign-tutor`,
        { tutorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message || "Tutor assigned successfully");
      } else {
        throw new Error(data.message || "Failed to assign tutor");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error assigning tutor";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBtnLoading(false);
    }
  };

  // Remove tutor from course (admin-only)
  const removeTutorFromCourse = async (courseId) => {
    if (loading) return;
    setBtnLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const { data } = await axios.put(
        `${LMS_Backend}/api/tutor/course/${courseId}/remove-tutor`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message || "Tutor removed successfully");
      } else {
        throw new Error(data.message || "Failed to remove tutor");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Error removing tutor";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBtnLoading(false);
    }
  };

  // Automatically check tutor auth and fetch data for tutors
  useEffect(() => {
    checkTutorAuth();
    if (user && user.role.toLowerCase() === "tutor") {
      fetchTutorStats();
      fetchTutorCourses();
    }
  }, [user]);

  return (
    <TutorContext.Provider
      value={{
        tutorCourses,
        tutorStats,
        tutors,
        isTutorAuth,
        btnLoading,
        loading,
        error,
        fetchTutorStats,
        fetchTutorCourses,
        fetchAllTutors,
        assignTutorToCourse,
        removeTutorFromCourse,
        checkTutorAuth,
      }}
    >
      {children}
      <Toaster />
    </TutorContext.Provider>
  );
};

export const TutorData = () => useContext(TutorContext);