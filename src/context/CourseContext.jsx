import { createContext, useContext, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { LMS_Backend } from "../main";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${LMS_Backend}/api/course/all`, { timeout: 5000 });
      console.log(data.courses);  // Log courses to see if `image` is included in the response
      setCourses(data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Create a new course
  const createCourse = async (courseData, file, navigate) => {
    setBtnLoading(true);
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      formData.append(key, courseData[key]);
    });
    formData.append("file", file);

    try {
      const { data } = await axios.post(`${LMS_Backend}/api/admin/course/new`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(data.message);
      setBtnLoading(false);
      navigate("/dashboard/admin");
      fetchCourses(); // Refresh course list
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Failed to create course");
    }
  };

  // Delete a course
  const deleteCourse = async (id) => {
    setBtnLoading(true);
    try {
      const { data } = await axios.delete(`${LMS_Backend}/api/admin/course/${id}`);
      toast.success(data.message);
      setCourses((prevCourses) => prevCourses.filter((course) => course._id !== id));
      setBtnLoading(false);
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  // Add a lecture to a course
  const addLecture = async (id, lectureData, file) => {
    setBtnLoading(true);
    const formData = new FormData();
    Object.keys(lectureData).forEach((key) => {
      formData.append(key, lectureData[key]);
    });
    formData.append("file", file);

    try {
      const { data } = await axios.post(`${LMS_Backend}/api/admin/course/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(data.message);
      setBtnLoading(false);
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Failed to add lecture");
    }
  };

  // Delete a lecture
  const deleteLecture = async (id) => {
    setBtnLoading(true);
    try {
      const { data } = await axios.delete(`${LMS_Backend}/api/admin/lecture/${id}`);
      toast.success(data.message);
      setBtnLoading(false);
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Failed to delete lecture");
    }
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        setCourses,
        loading,
        btnLoading,
        fetchCourses,
        createCourse,
        deleteCourse,
        addLecture,
        deleteLecture,
      }}
    >
      {children}
      <Toaster />
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);
