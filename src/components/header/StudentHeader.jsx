import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { CourseData } from "../../context/CourseContext";
import { Bell } from "lucide-react";

const StudentHeader = () => {
  const { logoutUser } = UserData();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const {
    categories,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    filterCoursesByQuery,
    filterCoursesByCategory,
    setSelectedCategory,
  } = CourseData();

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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
    filterCoursesByQuery(searchQuery); // Filter by search query only
    navigate(`/student/course/all`);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    filterCoursesByCategory(category); // Filter by category only
    navigate(`/student/course/all`);
  };

  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleToggleNotifications = () => {
    if (!showNotifications && notifications.some((n) => !n.read)) {
      markAllAsRead();
    }
    setShowNotifications(!showNotifications);
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

      <div className="flex items-center space-x-2">
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
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="ml-2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134e4a] bg-white text-gray-600 hover:bg-gray-100 transition duration-300"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </form>
      </div>

      <nav className="flex space-x-6 items-center">
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
        <div className="relative">
          <button
            className="relative text-gray-600 hover:text-black"
            onClick={handleToggleNotifications}
          >
            <Bell size={24} />
            {notifications.some((n) => !n.read) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-md p-2 z-10">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`border-b py-2 text-sm cursor-pointer ${
                      notification.read ? "bg-gray-200" : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleNotificationClick(notification._id)}
                  >
                    <div className="font-semibold">{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No notifications available</div>
              )}
            </div>
          )}
        </div>
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