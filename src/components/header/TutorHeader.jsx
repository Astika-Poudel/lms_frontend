import React from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const TutorHeader = () => {
  const { logoutUser } = UserData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser(navigate);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white">
      <h1 className="text-2xl font-bold text-[#134e4a]">LearnNepal</h1>
      <nav className="space-x-4">
        <a href="/tutor/courses" className="text-gray-600 hover:text-black">
          My Courses
        </a>
        <a href="/tutor/assessments" className="text-gray-600 hover:text-black">
          Assessments
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

export default TutorHeader;
