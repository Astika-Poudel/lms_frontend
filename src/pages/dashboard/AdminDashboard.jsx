import React from 'react';

const AdminDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-[#134e4a]">Welcome to Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Users</h2>
        </div>

        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Students</h2>
          
        </div>

        <div className="p-4 border border-gray-300 rounded-md shadow-sm">
          <h2 className="text-lg font-semibold">Total Tutors</h2>
          
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
