import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import CreateCourses from "./pages/courses/CreateCourses";
import Profile from "./pages/profile/Profile";
import Courses from "./pages/courses/Courses";
import AdminCourse from "./pages/courses/AdminCourse";
import AddLecture from "./pages/courses/AddLecture";
import EditCourse from "./pages/courses/EditCourse";
import EditLecture from "./pages/courses/EditLecture";
import CourseDetails from "./pages/courses/CourseDetails";
import AdminCourseDetail from "./pages/courses/AdminCourseDetail";
import PaymentPage from "./pages/courses/PaymentPage";
import MyCourses from "./pages/courses/MyCourses";
import User from "./pages/management/User";
import TutorCourses from "./pages/Tutor/TutorCourses";
import AssignedTutors from "./pages/Tutor/AssignedTutors";
import TutorCourseOverview from "./pages/Tutor/TutorCourseOverview";
import TutorCreateQuiz from "./pages/Tutor/TutorCreateQuiz";
import CourseProgress from "./pages/courses/CourseProgress";
import QuizPage from "./pages/courses/QuizPage";
import TutorQuizzes from "./pages/Tutor/TutorQuizzes";

const App = () => {
    const { isAuth, loading, user } = UserData();

    const renderHeader = () => {
        if (!isAuth) return <Header />;
        switch (user?.role?.toLowerCase()) {
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
        switch (user?.role?.toLowerCase()) {
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
        if (loading) return <Loading />;
        if (!isAuth) return <Navigate to="/login" />;
        if (user?.role?.toLowerCase() !== role) return <Navigate to="/" />;
        return children;
    };

    return (
        <>
            {loading ? (
                <Loading />
            ) : (
                <>
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
                            path="/admin/course/new"
                            element={
                                <ProtectedRoute role="admin">
                                    <CreateCourses />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/user-management"
                            element={
                                <ProtectedRoute role="admin">
                                    <User />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/add-lecture/course/:id"
                            element={
                                <ProtectedRoute role="admin">
                                    <AddLecture />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/profile"
                            element={
                                <ProtectedRoute role="admin">
                                    <Profile user={user} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/course/all"
                            element={
                                <ProtectedRoute role="admin">
                                    <AdminCourse />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/edit-course/:id"
                            element={
                                <ProtectedRoute role="admin">
                                    <EditCourse />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/edit-lecture/:id"
                            element={
                                <ProtectedRoute role="admin">
                                    <EditLecture />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/course-detail/:id"
                            element={
                                <ProtectedRoute role="admin">
                                    <AdminCourseDetail />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/course/assigned-tutors"
                            element={
                                <ProtectedRoute role="admin">
                                    <AssignedTutors />
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
                            path="/tutor/profile"
                            element={
                                <ProtectedRoute role="tutor">
                                    <Profile user={user} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor/courses"
                            element={
                                <ProtectedRoute role="tutor">
                                    <TutorCourses />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor/messages"
                            element={
                                <ProtectedRoute role="tutor">
                                    <Profile user={user} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor/courseoverview/:id"
                            element={
                                <ProtectedRoute role="tutor">
                                    <TutorCourseOverview />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor/course/:courseId/create-quiz"
                            element={
                                <ProtectedRoute role="tutor">
                                    <TutorCreateQuiz />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tutor/quizzes"
                            element={
                                <ProtectedRoute role="tutor">
                                    <TutorQuizzes />
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
                        <Route
                            path="/student/profile"
                            element={
                                <ProtectedRoute role="student">
                                    <Profile user={user} />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/course/all"
                            element={
                                <ProtectedRoute role="student">
                                    <Courses />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment/:id"
                            element={
                                <ProtectedRoute role="student">
                                    <PaymentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/coursedetails/:id"
                            element={
                                <ProtectedRoute role="student">
                                    <CourseDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/course/progress/:courseId"
                            element={
                                <ProtectedRoute role="student">
                                    <CourseProgress />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/quiz/:quizId"
                            element={
                                <ProtectedRoute role="student">
                                    <QuizPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student/courses"
                            element={
                                <ProtectedRoute role="student">
                                    <MyCourses />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </>
            )}
        </>
    );
};

export default App;