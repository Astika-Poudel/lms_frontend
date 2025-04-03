import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { Bell } from "lucide-react";

const TutorHeader = () => {
  const { logoutUser, user } = UserData();
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md">
      <h1
        className="text-2xl font-bold text-[#134e4a] cursor-pointer"
        onClick={() => navigate("/dashboard/tutor")}
      >
        LearnNepal
      </h1>
      <nav className="flex space-x-6 items-center">
        <button onClick={() => navigate("/tutor/courses")} className="text-gray-600 hover:text-black">
          My Courses
        </button>
        <button onClick={() => navigate("/tutor/messages")} className="text-gray-600 hover:text-black">
          Messages
        </button>
        <button onClick={() => navigate("/tutor/profile")} className="text-gray-600 hover:text-black">
          Profile
        </button>
        <div className="relative">
          <button
            className="relative text-gray-600 hover:text-black"
            onClick={() => setShowNotifications(!showNotifications)}
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
          onClick={() => logoutUser(navigate)}
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Logout
        </button>
      </nav>
    </header>
  );
};

export default TutorHeader;
