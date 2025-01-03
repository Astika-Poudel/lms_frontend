import React from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const AdminHeader = () => {
  const { logoutUser } = UserData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleNavigateCreateCourse = () => {
    navigate("/admin/create-courses");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white">
      <h1
        className="text-2xl font-bold text-[#134e4a] cursor-pointer"
        onClick={() => navigate("/dashboard/admin")}
      >
        LearnNepal
      </h1>
      <nav className="space-x-4">
        <button
          onClick={handleNavigateCreateCourse}
          className="text-gray-600 hover:text-black"
        >
          Create Courses
        </button>
        <a href="/admin/profile" className="text-gray-600 hover:text-black">
          Profile
        </a>
        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default AdminHeader;
