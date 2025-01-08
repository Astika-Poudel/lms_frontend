import React, { useEffect, useState } from "react";
import axios from "axios";
import { LMS_Backend } from "../../main"; 

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
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

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-[#134e4a]">Welcome to Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Users</h2>
          <p>{stats.totalUsers}</p>
        </div>

        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Students</h2>
          <p>{stats.totalStudents}</p>
        </div>

        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Tutors</h2>
          <p>{stats.totalTutors}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
