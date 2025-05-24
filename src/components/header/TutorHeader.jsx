import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { Bell, Menu, X } from "lucide-react";
import { LMS_Backend } from "../../main";

const TutorHeader = () => {
  const { logoutUser, user } = UserData();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logoutUser(navigate);
    setShowMobileMenu(false);
  };

  const handleNavigateEditProfile = () => {
    navigate("/tutor/profile");
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const handleNavigateViewProfile = () => {
    if (user?._id) {
      navigate(`/tutor/${user._id}`);
    }
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const handleNavigateCourses = () => {
    navigate("/tutor/courses");
    setShowMobileMenu(false);
  };


  const handleNavigateDashboard = () => {
    navigate("/dashboard/tutor");
    setShowMobileMenu(false);
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
    <header className="sticky top-0 z-50 flex flex-col md:flex-row justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center justify-between w-full md:w-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-[#134e4a] font-playfair">
          <button
            onClick={handleNavigateDashboard}
            className="text-[#134e4a] hover:text-[#0c3c38] transition duration-300"
          >
            LearnNepal
          </button>
        </h1>
        <button
          className="md:hidden text-gray-600 hover:text-black"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav
        className={`${
          showMobileMenu ? "flex" : "hidden"
        } md:flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 items-center w-full md:w-auto mt-4 md:mt-0`}
      >
        <button
          onClick={handleNavigateCourses}
          className="text-gray-600 hover:text-black transition duration-300"
        >
          My Courses
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center text-gray-600 hover:text-black transition duration-300"
          >
            <img
              src={user?.image ? `${LMS_Backend}/Uploads/${user.image}` : "https://via.placeholder.com/32"}
              alt="Tutor"
              className="w-8 h-8 rounded-full"
            />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md p-2 z-20">
              <button
                onClick={handleNavigateEditProfile}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Edit Profile
              </button>
              <button
                onClick={handleNavigateViewProfile}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                View Profile
              </button>
            </div>
          )}
        </div>
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

export default TutorHeader;