import { createContext, useContext, useState, useCallback } from "react"; 
import axios from "axios";
import toast from "react-hot-toast";
import { LMS_Backend } from "../main";

const EnrollContext = createContext();

export const EnrollContextProvider = ({ children }) => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    const checkToken = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Unauthorized: No token found");
            return false;
        }
        return token;
    };

    // Fetch enrolled courses
    const fetchEnrolledCourses = useCallback(async () => {
        setLoading(true);
        try {
            const token = checkToken();
            if (!token) return;

            const { data } = await axios.get(`${LMS_Backend}/api/user/enrolled`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setEnrolledCourses(data.courses);
            } else {
                toast.error(data.message || "Failed to fetch enrolled courses");
            }
        } catch (error) {
            console.error("Enrollment Error:", error);
            toast.error(error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, []); 

    // Enroll in a course
    const enrollInCourse = async (courseId) => {
        setLoading(true);
        try {
            const token = checkToken();
            if (!token) return;

            const { data } = await axios.post(
                `${LMS_Backend}/api/user/enroll/${courseId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message || "Successfully enrolled in the course!");
                await fetchEnrolledCourses(); // Refresh the enrolled courses list
            } else {
                toast.error(data.message || "Failed to enroll in course");
            }
        } catch (error) {
            console.error("Enrollment Error:", error);
            toast.error(error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <EnrollContext.Provider value={{ 
            enrolledCourses, 
            fetchEnrolledCourses, 
            enrollInCourse, 
            loading 
        }}>
            {children}
        </EnrollContext.Provider>
    );
};

export const EnrollData = () => useContext(EnrollContext);