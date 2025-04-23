import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { UserData } from "./UserContext";

const socket = io("http://localhost:7001", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const NotificationContext = createContext();

export const NotificationContextProvider = ({ children }) => {
  const { user } = UserData();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. User might not be logged in.");
        return;
      }
      const response = await axios.get("http://localhost:7001/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof response.data === "string" && response.data.includes("<!DOCTYPE html>")) {
        console.error("Received HTML instead of JSON. Possible server error:", response.data);
        return;
      }

      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error.response || error);
      setNotifications([]);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. User might not be logged in.");
        return;
      }
      await axios.patch(
        `http://localhost:7001/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error.response || error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. User might not be logged in.");
        return;
      }
      await axios.patch(
        `http://localhost:7001/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error.response || error);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
      if (user?._id) {
        socket.emit("join", user._id.toString());
        console.log(`Joined room for user ${user._id}`);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socket.on("newNotification", (notification) => {
      console.log("New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    if (user?._id) {
      fetchNotifications();
    }

    return () => {
      socket.off("newNotification");
      socket.off("connect");
      socket.off("connect_error");
    };
  }, [user?._id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);