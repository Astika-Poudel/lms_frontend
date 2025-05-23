import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { LMS_Backend } from "../main";
import toast, { Toaster } from "react-hot-toast";

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [isAuth, setIsAuth] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkToken = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setIsAuth(false);
                setLoading(false);
                return;
            }

            const { data } = await axios.get(`${LMS_Backend}/api/user/check-token`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.valid) {
                setIsAuth(true);
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setIsAuth(false);
            }
        } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setIsAuth(false);
            setError(error.response?.data?.message || "Token validation failed");
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (username_or_email, password, navigate) => {
        setBtnLoading(true);
        try {
            const { data } = await axios.post(`${LMS_Backend}/api/login`, {
                username_or_email,
                password,
            });

            toast.success(data.message);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setUser(data.user);
            setIsAuth(true);
            navigate(`/dashboard/${data.user.role.toLowerCase()}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setBtnLoading(false);
        }
    };

    const logoutUser = (navigate) => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuth(false);
        setUser(null);
        navigate("/");
    };

    const registerUser = async (firstname, lastname, username, email, password, role, navigate) => {
        setBtnLoading(true);
        try {
            const { data } = await axios.post(`${LMS_Backend}/api/register`, {
                firstname,
                lastname,
                username,
                email,
                password,
                role,
            });

            toast.success(data.message);
            localStorage.setItem("activationToken", data.activationToken);
            navigate("/verify");
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setBtnLoading(false);
        }
    };

    const verifyOtp = async (otp, navigate) => {
        setBtnLoading(true);
        const activationToken = localStorage.getItem("activationToken");
        try {
            const { data } = await axios.post(`${LMS_Backend}/api/verify`, {
                otp,
                activationToken,
            });

            toast.success(data.message);
            localStorage.clear();
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setBtnLoading(false);
        }
    };

const fetchAllUsers = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const { data } = await axios.get(`${LMS_Backend}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(data);
    } catch (err) {
        setError(err.response?.data?.message || "Error fetching users");
    } finally {
        setLoading(false);
    }
};

    const updateUserRole = async (userId, role) => {
        try {
            const { data } = await axios.put(
                `${LMS_Backend}/api/users/${userId}/role`,
                { role },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setUsers((prevUsers) =>
                prevUsers.map((u) => (u._id === userId ? { ...u, role } : u))
            );
            toast.success("Role updated successfully");
            return data;
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Error updating user role";
            setError(errorMsg);
            toast.error(errorMsg);
            throw err;
        }
    };

    const deleteUser = async (userId) => {
        try {
            await axios.delete(`${LMS_Backend}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setUsers((prevUsers) => prevUsers.filter((u) => u._id !== userId));
            toast.success("User deleted successfully");
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Error deleting user";
            setError(errorMsg);
            toast.error(errorMsg);
            throw err;
        }
    };

    // Method to update profile
    const updateProfile = async (username, firstname, lastname, email) => {
        setBtnLoading(true);
        try {
            const { data } = await axios.put(
                `${LMS_Backend}/api/profile`,
                { username, firstname, lastname, email },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            toast.success(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setBtnLoading(false);
        }
    };

    // Method to change password
    const changePassword = async (currentPassword, newPassword) => {
        setBtnLoading(true);
        try {
            const { data } = await axios.put(
                `${LMS_Backend}/api/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );
            toast.success(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setBtnLoading(false);
        }
    };

    // Method to upload profile picture
    const uploadProfilePicture = async (file) => {
        setBtnLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const { data } = await axios.put(
                `${LMS_Backend}/api/upload-profile-picture`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
            toast.success(data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to upload profile picture");
        } finally {
            setBtnLoading(false);
        }
    };

    useEffect(() => {
        checkToken();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                isAuth,
                setIsAuth,
                loginUser,
                btnLoading,
                loading,
                registerUser,
                verifyOtp,
                logoutUser,
                checkToken,
                error,
                users,
                fetchAllUsers,
                updateUserRole,
                deleteUser,
                updateProfile,
                changePassword,
                uploadProfilePicture,
            }}
        >
            {children}
            <Toaster />
        </UserContext.Provider>
    );
};

export const UserData = () => useContext(UserContext);