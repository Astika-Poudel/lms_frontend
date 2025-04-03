import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const StudentHeader = () => {
  const { logoutUser } = UserData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/student/course/all?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white shadow-md">
      <h1 className="text-3xl font-bold text-[#134e4a] font-playfair">
        <button
          onClick={handleNavigateCourses}
          className="text-[#134e4a] hover:text-[#0c3c38] transition duration-300"
        >
          LearnNepal
        </button>
      </h1>

      <form onSubmit={handleSearch} className="flex items-center">
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] w-96"
          autoComplete="off"
        />
        <button
          type="submit"
          className="ml-2 bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
        >
          Search
        </button>
      </form>

      <nav className="flex space-x-6">
        <button
          onClick={handleNavigateMyCourses}
          className="text-gray-600 hover:text-black transition duration-300"
        >
          My Courses
        </button>
        <button
          onClick={handleNavigateProfile}
          className="text-gray-600 hover:text-black transition duration-300"
        >
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="bg-[#134e4a] text-white px-4 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default StudentHeader;