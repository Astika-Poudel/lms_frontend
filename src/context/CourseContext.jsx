import { createContext, useContext, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { LMS_Backend } from "../main";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${LMS_Backend}/api/course/all`, { timeout: 5000 });
      console.log(data.courses);
      setCourses(data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // Create a new course
  const createCourse = async (courseData, file, callback) => {
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

      if (callback) callback(data.course._id);

      fetchCourses(); 
    } catch (error) {
      setBtnLoading(false);
      toast.error(error.response?.data?.message || "Failed to create course");
    }
  };




  // Delete a course
  const deleteCourse = async (id) => {
    setBtnLoading(true);
    try {
      const token = localStorage.getItem("token"); // Get token for authorization
  
      const { data } = await axios.delete(`${LMS_Backend}/api/course/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Send token in the header
        },
      });
  
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

  // Delete a lecture from a course
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


  const editCourse = async (id, courseData, file) => {
    setBtnLoading(true);
    const formData = new FormData();
    
    // Add all course data to formData
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== undefined && courseData[key] !== null) {
        formData.append(key, courseData[key]);
      }
    });
    if (file) {
      formData.append("file", file);
    }
    try {
     
      const token = localStorage.getItem("token"); 
      if (!token) {
        throw new Error("No authentication token found");
      }
  
      const { data } = await axios.put(
        `${LMS_Backend}/api/admin/course/edit/${id}`, 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", 
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === id ? data.course : course 
        )
      );
  
      toast.success(data.message); 
      setBtnLoading(false); 
      return data.course; 
  
    } catch (error) {
      console.error("Edit course error:", error.response?.data || error.message);
      setBtnLoading(false); 
      
      // Handle specific error messages
      if (error.response?.data?.message === "Please Login") {
        toast.error("Please login again to continue");
      } else {
        toast.error(error.response?.data?.message || "Failed to update course"); 
      }
      
      throw error;
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
        editCourse,
      }}
    >
      {children}
      <Toaster />
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);
