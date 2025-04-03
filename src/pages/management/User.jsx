import React, { useEffect } from "react";
import { UserData } from "../../context/UserContext";

const User = () => {
  const { users, loading, error, fetchAllUsers, updateUserRole, deleteUser } = UserData();

  useEffect(() => {
    if (!users.length) {
      fetchAllUsers();
    }
  }, [fetchAllUsers, users]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
    } catch (err) {
      console.error("Role update failed:", err);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center">Error: {error}</div>;
  if (!users || !Array.isArray(users)) {
    return <div className="text-center">No users found or data is invalid.</div>;
  }

  return (
    <div className="p-4 ml-0 md:ml-64">
      <h1 className="text-xl sm:text-2xl font-bold text-[#134e4a] mb-6 text-center md:text-left">
        User Management
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Name</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Email</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Role</th>
              <th className="py-2 px-2 sm:px-4 text-left text-sm sm:text-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-100">
                <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">{user.firstname} {user.lastname}</td>
                <td className="py-2 px-2 sm:px-4 text-sm sm:text-base">{user.email}</td>
                <td className="py-2 px-2 sm:px-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                    className="border rounded px-1 py-1 sm:px-2 sm:py-1 text-sm sm:text-base w-full"
                  >
                    <option value="Student">Student</option>
                    <option value="Tutor">Tutor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="py-2 px-2 sm:px-4">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="bg-[#134e4a] text-white px-2 py-1 sm:px-3 sm:py-1 rounded hover:bg-[#0f3b38] text-xs sm:text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default User;