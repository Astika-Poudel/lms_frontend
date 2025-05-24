import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const AdminHeader = () => {
    const { logoutUser } = UserData();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        logoutUser(navigate);
        setIsMenuOpen(false);
    };

    const handleNavigateProfile = () => {
        navigate("/admin/profile");
        setIsMenuOpen(false);
    };

    const handleNavigateCourses = () => {
        navigate("/admin/course/all");
        setIsMenuOpen(false);
    };

    const handleNavigateAssignedTutors = () => {
        navigate("/admin/course/assigned-tutors");
        setIsMenuOpen(false);
    };

    const handleNavigateUserManagement = () => {
        navigate("/admin/user-management");
        setIsMenuOpen(false);
    };

    const handleNavigateDashboard = () => {
        navigate("/dashboard/admin");
        setIsMenuOpen(false);
    };

    return (
        <div>
            {/* Hamburger Menu Button for Mobile */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button onClick={toggleMenu} className="text-[#134e4a] focus:outline-none">
                    {isMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-white shadow-md p-6 transition-transform duration-300 z-40 w-64 ${
                    isMenuOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 md:w-64 md:block`}
            >
                <h1
                    className="text-2xl font-bold text-[#134e4a] cursor-pointer mb-8"
                    onClick={handleNavigateDashboard}
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

            {/* Overlay for Mobile when Menu is Open */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={toggleMenu}
                />
            )}
        </div>
    );
};

export default AdminHeader;