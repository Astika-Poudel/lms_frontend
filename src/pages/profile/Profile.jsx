import React, { useState, useRef } from "react";
import { UserData } from "../../context/UserContext";
import { LMS_Backend } from "../../main";

const Profile = ({ user }) => {
    const { updateProfile, changePassword, uploadProfilePicture, btnLoading } = UserData();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || "",
        firstname: user?.firstname || "",
        lastname: user?.lastname || "",
        email: user?.email || "",
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
    });
    const fileInputRef = useRef(null);

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-gray-600 text-base sm:text-lg font-medium">No user data available</p>
            </div>
        );
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setFormData({
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleSave = async () => {
        await updateProfile(formData.username, formData.firstname, formData.lastname, formData.email);
        setIsEditing(false);
    };

    const handlePasswordSave = async () => {
        await changePassword(passwordData.currentPassword, passwordData.newPassword);
        setPasswordData({ currentPassword: "", newPassword: "" });
        setIsChangingPassword(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await uploadProfilePicture(file);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="h-screen min-h-screen bg-gray-100 flex justify-center items-center px-4">
            <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row min-h-[400px] sm:min-h-[500px] translate-x-16 sm:translate-x-20">
                {/* Left Section: Profile Picture and Basic Info */}
                <div className="w-full md:w-1/3 bg-teal-50 p-4 sm:p-6 md:p-8 flex flex-col items-center">
                    <div className="relative">
                        <img
                            src={`${LMS_Backend}/uploads/${user.image}`}
                            alt="Profile"
                            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-teal-900 object-cover cursor-pointer hover:opacity-80 transition-opacity duration-300"
                            onClick={handleImageClick}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="absolute bottom-0 right-0 bg-teal-900 rounded-full p-2 shadow-md">
                            <svg
                                className="w-4 sm:w-5 h-4 sm:h-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L15.232 5.232z"
                                />
                            </svg>
                        </div>
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-lg sm:text-xl font-semibold text-gray-800">{user.username}</h3>
                    <p className="mt-1 text-xs sm:text-sm text-teal-900">{user.role}</p>
                    <button
                        onClick={handleEditToggle}
                        className="mt-4 sm:mt-6 px-3 sm:px-4 py-1 sm:py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-md text-sm sm:text-base"
                    >
                        {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                </div>

                {/* Right Section: Profile Details and Password Change */}
                <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-6 md:pt-6 md:pb-10">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Profile Details</h4>
                    <div className="space-y-3 sm:space-y-4">
                        {/* Username */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">Username</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                />
                            ) : (
                                <p className="text-gray-800 text-sm sm:text-base">{user.username}</p>
                            )}
                        </div>

                        {/* First Name */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">First Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                />
                            ) : (
                                <p className="text-gray-800 text-sm sm:text-base">{user.firstname}</p>
                            )}
                        </div>

                        {/* Last Name */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">Last Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                />
                            ) : (
                                <p className="text-gray-800 text-sm sm:text-base">{user.lastname}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                />
                            ) : (
                                <p className="text-gray-800 text-sm sm:text-base">{user.email}</p>
                            )}
                        </div>

                        {/* Role (non-editable) */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">Role</label>
                            <p className="text-gray-800 text-sm sm:text-base">{user.role}</p>
                        </div>
                    </div>

                    {/* Save Button (only visible when editing) */}
                    {isEditing && (
                        <div className="mt-3 sm:mt-4">
                            <button
                                onClick={handleSave}
                                disabled={btnLoading}
                                className="px-3 sm:px-4 py-1 sm:py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 shadow-md text-sm sm:text-base"
                            >
                                {btnLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}

                    {/* Change Password Section */}
                    <div className="mt-4 sm:mt-5">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Change Password</h4>
                        {isChangingPassword ? (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-600 sm:w-28 mb-1 sm:mb-0">New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors text-sm sm:text-base"
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                                    <button
                                        onClick={handlePasswordSave}
                                        disabled={btnLoading}
                                        className="px-3 sm:px-4 py-1 sm:py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 shadow-md text-sm sm:text-base"
                                    >
                                        {btnLoading ? "Changing..." : "Change Password"}
                                    </button>
                                    <button
                                        onClick={() => setIsChangingPassword(false)}
                                        className="px-3 sm:px-4 py-1 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-md text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="px-3 sm:px-4 py-1 sm:py-2 bg-teal-900 text-white rounded-lg hover:bg-teal-800 transition-colors shadow-md text-sm sm:text-base"
                            >
                                Change Password
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;