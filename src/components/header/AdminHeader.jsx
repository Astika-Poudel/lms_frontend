import React from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const AdminHeader = () => {
    const { logoutUser } = UserData();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser(navigate);
    };

    const handleNavigateProfile = () => {
        navigate("/admin/profile");
    };

    const handleNavigateCourses = () => {
        navigate("/admin/course/all");
    };

    const handleNavigateAssignedTutors = () => {
        navigate("/admin/course/assigned-tutors");
    };

    const handleNavigateUserManagement = () => {
        navigate("/admin/user-management");
    };

    return (
        <aside className="w-64 bg-white shadow-md h-screen p-6 fixed left-0 top-0">
            <h1
                className="text-2xl font-bold text-[#134e4a] cursor-pointer mb-8"
                onClick={() => navigate("/dashboard/admin")}
            >
                LearnNepal
            </h1>
            <nav className="flex flex-col space-y-6">
                <button
                    onClick={handleNavigateCourses}
                    className="text-gray-600 hover:text-black transition-colors duration-200 text-left py-2"
                >
                    Manage Courses
                </button>
                <button
                    onClick={handleNavigateAssignedTutors}
                    className="text-gray-600 hover:text-black transition-colors duration-200 text-left py-2"
                >
                    Assigned Tutors
                </button>
                <button
                    onClick={handleNavigateUserManagement}
                    className="text-gray-600 hover:text-black transition-colors duration-200 text-left py-2"
                >
                    User Management
                </button>
                <hr className="my-6 border-gray-200" />
                <button
                    onClick={handleNavigateProfile}
                    className="text-gray-600 hover:text-black transition-colors duration-200 text-left py-2"
                >
                    Profile
                </button>
                <button
                    onClick={handleLogout}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 text-left"
                >
                    Logout
                </button>
            </nav>
        </aside>
    );
};

export default AdminHeader;