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
    navigate("/admin/course/new");
  };

  const handleNavigateProfile = () => {
    navigate("/admin/profile");
  };

  const handleNavigateCourses = () => {
    navigate("/admin/course/all"); 
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
          onClick={handleNavigateCourses}
          className="text-gray-600 hover:text-black"
        >
          Manage Courses
        </button>
        <button
          onClick={handleNavigateCreateCourse}
          className="text-gray-600 hover:text-black"
        >
          Create Courses
        </button>
        <button
          onClick={handleNavigateProfile}
          className="text-gray-600 hover:text-black"
        >
          Profile
        </button>
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
