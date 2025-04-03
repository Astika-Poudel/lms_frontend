import { createContext, useContext, useState, useEffect } from "react"; // Added useEffect here
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { LMS_Backend } from "../main";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  const categories = [
    "Programming",
    "Web Development",
    "Data Science",
    "Machine Learning",
    "Graphic Design",
    "Digital Marketing",
    "Business",
    "Language Learning",
    "Personal Development",
    "Other"
  ];

  // Helper function to check token
  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized: No token found");
      return false;
    }
    return true;
  };

  // Helper function to handle errors
  const handleError = (error) => {
    console.error("Course Error:", error);
    toast.error(error.response?.data?.message || "An error occurred");
  };

  // Fetch all courses
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${LMS_Backend}/api/course/all`, { timeout: 5000 });
      console.log("Courses fetched:", data.courses);

      if (data && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else {
        console.error("Courses data not found in response");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tutors
  const fetchTutors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: No token found");
        return;
      }
      const { data } = await axios.get(`${LMS_Backend}/api/users/tutors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tutors fetched:", data); // Debugging log
      if (data && data.tutors) {
        setTutors(data.tutors);
      } else {
        console.warn("No tutors found in response");
        setTutors([]);
      }
    } catch (error) {
      handleError(error);
      setTutors([]); // Ensure tutors is reset on error
    } finally {
      setLoading(false);
    }
  };


  // Fetch lectures for a specific course
  const fetchLectures = async (id) => {
    setLecturesLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: No token found (fetchLectures)");
        return [];
      }

      const { data } = await axios.get(`${LMS_Backend}/api/lectures/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data && data.lectures) {
        setLectures(data.lectures);
        return data.lectures;
      } else {
        toast.error("No lectures found for this course.");
        return [];
      }
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLecturesLoading(false);
    }
  };

  // Fetch a single lecture
  const fetchLecture = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${LMS_Backend}/api/lecture/${id}`);
      if (data && data.lecture) {
        return data.lecture;
      } else {
        toast.error("Lecture not found.");
      }
    } catch (error) {
      handleError(error);
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
      if (!checkToken()) return;

      const { data } = await axios.post(`${LMS_Backend}/api/admin/course/new`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data) {
        toast.success(data.message);
        if (callback) callback(data.course._id);
        fetchCourses();
      } else {
        toast.error("Failed to create course: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete a course
  const deleteCourse = async (id) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;

      const { data } = await axios.delete(`${LMS_Backend}/api/course/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (data) {
        toast.success(data.message);
        setCourses((prevCourses) => prevCourses.filter((course) => course._id !== id));
      } else {
        toast.error("Failed to delete course: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
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
      if (!checkToken()) return;

      const { data } = await axios.post(`${LMS_Backend}/api/admin/course/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (data) {
        toast.success(data.message);
      } else {
        toast.error("Failed to add lecture: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete a lecture
  const deleteLecture = async (id) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;

      console.log("Deleting lecture with ID:", id); // Debugging
      const { data } = await axios.delete(`${LMS_Backend}/api/admin/lecture/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (data) {
        toast.success(data.message);
        setLectures((prevLectures) => prevLectures.filter((lecture) => lecture._id !== id));
      } else {
        toast.error("Failed to delete lecture: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Edit a course
  const editCourse = async (id, courseData, file) => {
    setBtnLoading(true);
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== undefined && courseData[key] !== null) {
        formData.append(key, courseData[key]);
      }
    });
    if (file) {
      formData.append("file", file);
    }

    try {
      if (!checkToken()) return;

      const { data } = await axios.put(
        `${LMS_Backend}/api/admin/course/edit/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (data) {
        setCourses((prevCourses) =>
          prevCourses.map((course) => (course._id === id ? data.course : course))
        );
        toast.success(data.message);
        return data.course;
      } else {
        toast.error("Failed to update course: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  // Edit a lecture
  const editLecture = async (id, lectureData, file) => {
    setBtnLoading(true);
    const formData = new FormData();
    Object.keys(lectureData).forEach((key) => {
      if (lectureData[key] !== undefined && lectureData[key] !== null) {
        formData.append(key, lectureData[key]);
      }
    });
    if (file) {
      formData.append("file", file);
    }

    try {
      if (!checkToken()) return;

      const { data } = await axios.put(
        `${LMS_Backend}/api/admin/lecture/edit/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (data) {
        setLectures((prevLectures) =>
          prevLectures.map((lecture) => (lecture._id === id ? data.lecture : lecture))
        );
        toast.success(data.message);
        return data.lecture;
      } else {
        toast.error("Failed to update lecture: No response data");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        setCourses,
        lectures,
        setLectures,
        loading,
        btnLoading,
        lecturesLoading,
        fetchCourses,
        fetchLectures,
        fetchLecture,
        createCourse,
        deleteCourse,
        addLecture,
        deleteLecture,
        editCourse,
        editLecture,
        tutors,
        categories,
        fetchTutors,
      }}
    >
      {children}
      <Toaster />
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);