// context/TutorContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { UserData } from "./UserContext";

const TutorContext = createContext();

export const TutorContextProvider = ({ children }) => {
  const { user } = UserData();
  const [tutorCourses, setTutorCourses] = useState([]);
  const [tutorStats, setTutorStats] = useState({ assignedCourses: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTutorCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:7001/api/tutor/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setTutorCourses(response.data.courses || []);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tutor courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchTutorStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:7001/api/tutor/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setTutorStats(response.data.stats || { assignedCourses: 0, totalStudents: 0 });
      }
    } catch (err) {
      setError(err.message || "Failed to fetch tutor stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role.toLowerCase() === "tutor") {
      fetchTutorCourses();
      fetchTutorStats();
    }
  }, [user]);

  return (
    <TutorContext.Provider
      value={{
        tutorCourses,
        tutorStats,
        loading,
        error,
        fetchTutorCourses,
        fetchTutorStats,
      }}
    >
      {children}
    </TutorContext.Provider>
  );
};

export const TutorData = () => useContext(TutorContext);