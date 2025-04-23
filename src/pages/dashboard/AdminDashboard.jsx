import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { LMS_Backend } from "../../main";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
    totalEnrolledStudents: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token);

        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const response = await axios.get(`${LMS_Backend}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const data = response.data;
          console.log("Fetched Stats:", data);
          setStats({
            totalUsers: data.totalUsers || 0,
            totalStudents: data.totalStudents || 0,
            totalTutors: data.totalTutors || 0,
            totalEnrolledStudents: data.totalEnrolledStudents || 0,
          });
        }
      } catch (error) {
        if (error.response) {
          console.error("Error fetching stats:", error.response.data);
        } else {
          console.error("Error fetching stats:", error.message);
        }
      }
    };

    fetchStats();
  }, []);

  const chartData = {
    labels: ["Total Users", "Total Students", "Total Tutors", "Enrolled Students"],
    datasets: [
      {
        label: "Count",
        data: [stats.totalUsers, stats.totalStudents, stats.totalTutors, stats.totalEnrolledStudents],
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
        borderColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Statistics",
      },
    },
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto ml-0 md:ml-64">
      <h1 className="text-2xl md:text-3xl font-bold text-[#134e4a] mt-4 mb-6 text-center md:text-left">
        Welcome to Admin Dashboard
      </h1>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-gray-300 rounded-md shadow-sm text-center">
          <h2 className="text-base md:text-lg font-semibold">Total Users</h2>
          <p className="text-lg md:text-xl">{stats.totalUsers}</p>
        </div>
        <div className="p-4 border border-gray-300 rounded-md shadow-sm text-center">
          <h2 className="text-base md:text-lg font-semibold">Total Students</h2>
          <p className="text-lg md:text-xl">{stats.totalStudents}</p>
        </div>
        <div className="p-4 border border-gray-300 rounded-md shadow-sm text-center">
          <h2 className="text-base md:text-lg font-semibold">Total Tutors</h2>
          <p className="text-lg md:text-xl">{stats.totalTutors}</p>
        </div>
        <div className="p-4 border border-gray-300 rounded-md shadow-sm text-center">
          <h2 className="text-base md:text-lg font-semibold">Enrolled Students</h2>
          <p className="text-lg md:text-xl">{stats.totalEnrolledStudents}</p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#134e4a] mb-4 text-center md:text-left">
          Admin Dashboard Analysis
        </h2>
        <div className="p-4 md:p-6 bg-white rounded-lg shadow-md">
          <div className="w-full h-64 md:h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;