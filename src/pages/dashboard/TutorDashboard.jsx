import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";

const TutorDashboard = () => {
  const { user } = UserData();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ assignedCourses: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);

  console.log("Logged-in user in TutorDashboard:", user);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. User might not be logged in.");
        setStats({ assignedCourses: 0, totalStudents: 0 });
        return;
      }
      console.log("Fetching stats with token:", token);
      const response = await axios.get("/api/tutor/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("API Response:", response.data);
      setStats(response.data.stats || { assignedCourses: 0, totalStudents: 0 });
    } catch (error) {
      console.error("Error fetching tutor stats:", error.response || error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      setStats({ assignedCourses: 0, totalStudents: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      console.warn("No user found. Skipping fetchStats.");
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.firstname || "Tutor"}!</h1>
      <p className="text-gray-600 mt-2">Manage your courses and students efficiently.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white shadow-md p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Courses</h2>
          <p className="text-gray-700">{stats.assignedCourses} Assigned</p>
        </div>
        <div className="bg-white shadow-md p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Students</h2>
          <p className="text-gray-700">{stats.totalStudents} Enrolled</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Recent Activities</h2>
        <ul className="list-disc pl-5 text-gray-700">
          <li>New student query in Course A</li>
          <li>Assignment submitted by John Doe</li>
          <li>Reminder: Quiz evaluation pending</li>
        </ul>
      </div>
    </div>
  );
};

export default TutorDashboard;