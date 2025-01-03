import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home/Home";
import Header from "./components/header/Header";
import AdminHeader from "./components/header/AdminHeader";
import TutorHeader from "./components/header/TutorHeader";
import StudentHeader from "./components/header/StudentHeader";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import { UserData } from "./context/UserContext";
import Loading from "./components/loading/loading";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import TutorDashboard from "./pages/dashboard/TutorDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import CreateCourse from "./pages/courses/CreateCourse";

const App = () => {
  const { isAuth, loading, user } = UserData();

  const renderHeader = () => {
    if (!isAuth) return <Header />;
    switch (user.role?.toLowerCase()) {
      case "admin":
        return <AdminHeader />;
      case "tutor":
        return <TutorHeader />;
      case "student":
        return <StudentHeader />;
      default:
        return <Header />;
    }
  };

  const RedirectToDashboard = () => {
    if (!isAuth) return <Home />;
    switch (user.role?.toLowerCase()) {
      case "admin":
        return <Navigate to="/dashboard/admin" />;
      case "tutor":
        return <Navigate to="/dashboard/tutor" />;
      case "student":
        return <Navigate to="/dashboard/student" />;
      default:
        return <Home />;
    }    
  };

  const ProtectedRoute = ({ children, role }) => {
    if (!isAuth) return <Navigate to="/login" />;
    if (user.role?.toLowerCase() !== role) return <Navigate to="/" />;
    return children;
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <BrowserRouter>
          {renderHeader()}
          <Routes>
            <Route path="/" element={<RedirectToDashboard />} />
            <Route path="/login" element={isAuth ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={isAuth ? <Navigate to="/" /> : <Register />} />
            <Route path="/verify" element={isAuth ? <Navigate to="/" /> : <Verify />} />
            <Route path="/dashboard/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
             <Route
              path="/admin/create-courses"
              element={
                <ProtectedRoute role="admin">
                  <CreateCourse />
                </ProtectedRoute>
              }
            />

          
            <Route
              path="/dashboard/tutor"
              element={
                <ProtectedRoute role="tutor">
                  <TutorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
                                                                                                         