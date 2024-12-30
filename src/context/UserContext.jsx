import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { LMS_Backend } from "../main";
import toast, { Toaster } from "react-hot-toast";

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState({});
  const [isAuth, setIsAuth] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loginUser = async (username_or_email, password, navigate) => {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${LMS_Backend}/api/user/login`, {
        username_or_email,
        password,
      });

      toast.success(data.message);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setIsAuth(true);
      setBtnLoading(false);

      const role = data.user?.role?.toLowerCase();
      navigate(`/dashboard/${role}`);
    } catch (error) {
      setBtnLoading(false);
      setIsAuth(false);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  const logoutUser = (navigate) => {
    try {
      localStorage.removeItem("token");
      setIsAuth(false);
      setUser(null);
      navigate("/"); 
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  async function registerUser(firstname, lastname, username, email, password, role, navigate) {
    setBtnLoading(true);
    try {
      const { data } = await axios.post(`${LMS_Backend}/api/user/register`, {
        firstname,
        lastname,
        username,
        email,
        password,
        role,
      });

      toast.success(data.message);
      localStorage.setItem("activationToken", data.activationToken);
      setBtnLoading(false);
      navigate("/verify");
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Something went wrong.");
    }
  }

  async function verifyOtp(otp, navigate) {
    setBtnLoading(true);
    const activationToken = localStorage.getItem("activationToken");
    try {
      const { data } = await axios.post(`${LMS_Backend}/api/user/verify`, {
        otp,
        activationToken,
      });

      toast.success(data.message);
      navigate("/login");
      localStorage.clear();
      setBtnLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong.");
      setBtnLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found, please log in");
      }

      const { data } = await axios.get(`${LMS_Backend}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

      setIsAuth(true);
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      console.log(error.response?.data?.message || "Failed to fetch user.");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        setIsAuth,
        isAuth,
        loginUser,
        btnLoading,
        loading,
        registerUser,
        verifyOtp,
        logoutUser,
      }}
    >
      {children}
      <Toaster />
    </UserContext.Provider>
  );
};

export const UserData = () => useContext(UserContext);
