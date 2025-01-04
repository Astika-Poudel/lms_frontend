import React from "react";

const Profile = ({ user }) => {
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">No user data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
          <p className="mt-1 text-sm text-gray-500">Personal details and account settings.</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Username</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.username}</dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Firstname</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.firstname}</dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Lastname</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.lastname}</dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Email</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.email}</dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Password</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.password}</dd>
          </div>
          <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-900">Role</dt>
            <dd className="mt-1 text-sm text-gray-700 sm:col-span-2 sm:mt-0">{user.role}</dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
