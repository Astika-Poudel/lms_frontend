import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TutorDashboard = () => {
  const { user } = UserData();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ assignedCourses: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setStats({ assignedCourses: 0, totalStudents: 0 });
        return;
      }
      const response = await axios.get("/api/tutor/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats || { assignedCourses: 0, totalStudents: 0 });
    } catch (error) {
      setStats({ assignedCourses: 0, totalStudents: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const chartData = {
    labels: ["Assigned Courses", "Enrolled Students"],
    datasets: [
      {
        label: "Count",
        data: [stats.assignedCourses, stats.totalStudents],
        backgroundColor: ["#134e4a", "#0c3c38"],
        borderColor: ["#134e4a", "#0c3c38"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Tutor Statistics",
        font: { size: 18 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#134e4a]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[90%] mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome, {user?.firstname || "Tutor"}!
      </h1>
      <p className="text-gray-600 mb-6">
        Manage your courses and students efficiently.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-md p-4 rounded-lg flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Assigned Courses</h2>
          <p className="text-gray-700">
            <span className="font-semibold">{stats.assignedCourses}</span> Courses
          </p>
        </div>
        <div className="bg-white shadow-md p-4 rounded-lg flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Enrolled Students</h2>
          <p className="text-gray-700">
            <span className="font-semibold">{stats.totalStudents}</span> Students
          </p>
        </div>
      </div>

      <div className="bg-white shadow-md p-4 rounded-lg flex justify-center">
        <div className="w-[50%] h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;