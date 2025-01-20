import React from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const StudentHeader = () => {
  const { logoutUser } = UserData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(navigate);
  };

  const handleNavigateProfile = () => {
    navigate("/student/profile");
  };

  const handleNavigateCourses = () => {
    navigate("/student/course/all"); 
  };

  const handleNavigateMyCourses = () => {
    navigate("/student/courses"); 
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white">
      <h1 className="text-2xl font-bold text-[#134e4a]">
        <button
          onClick={handleNavigateCourses}
          className="text-gray-600 hover:text-black"
        >
          LearnNepal
        </button>
      </h1>
      <nav className="space-x-4">
      <button
          onClick={handleNavigateMyCourses}
          className="text-gray-600 hover:text-black"
        >
          My Courses
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

export default StudentHeader;
