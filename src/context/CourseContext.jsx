import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { LMS_Backend } from "../main";
import { useNavigate } from "react-router-dom";
import { UserData } from "./UserContext";

const CourseContext = createContext();

export const CourseContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const { isAuth, logoutUser } = UserData();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [tutorRatings, setTutorRatings] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState([]); // Add state for notes

  const categories = [
    "All",
    "Programming",
    "Web Development",
    "Data Science",
    "Machine Learning",
    "Graphic Design",
    "Digital Marketing",
    "Business",
    "Language Learning",
    "Personal Development",
    "Other",
  ];

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token || !isAuth) {
      toast.error("Unauthorized: No token found. Please login.");
      logoutUser(navigate);
      return false;
    }
    return true;
  };

  const handleError = (error) => {
    console.error("Course Error:", error);
    const message = error.response?.data?.message || "An error occurred";
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      logoutUser(navigate);
    } else {
      toast.error(message);
    }
    return message;
  };

  // Fetch notes for a course
  const fetchNotes = async (courseId) => {
    setLoading(true);
    try {
      if (!checkToken()) return [];
      const { data } = await axios.get(`${LMS_Backend}/api/notes/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setNotes(data.notes);
        return data.notes;
      } else {
        toast.error(data.message || "Failed to fetch notes");
        return [];
      }
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new note
  const createNote = async (noteData) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;
      const { data } = await axios.post(`${LMS_Backend}/api/notes`, noteData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setNotes((prevNotes) => [...prevNotes, data.note]);
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message || "Failed to create note");
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setBtnLoading(false);
    }
  };

  // Update a note
  const updateNote = async (noteId, noteData) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;
      const { data } = await axios.put(`${LMS_Backend}/api/notes/${noteId}`, noteData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setNotes((prevNotes) =>
          prevNotes.map((note) => (note._id === noteId ? data.note : note))
        );
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message || "Failed to update note");
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setBtnLoading(false);
    }
  };

  // Delete a note
  const deleteNote = async (noteId) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;
      const { data } = await axios.delete(`${LMS_Backend}/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setNotes((prevNotes) => prevNotes.filter((note) => note._id !== noteId));
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message || "Failed to delete note");
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setBtnLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      if (!checkToken()) return null;
      const { data } = await axios.get(`${LMS_Backend}/api/users/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        return {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        };
      } else {
        toast.error(data.message || "Failed to fetch student details");
        return null;
      }
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const submitTutorRating = async (courseId, rating, feedback) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;
      const user = JSON.parse(localStorage.getItem("user"));
      const studentId = user?._id;
      if (!studentId) {
        throw new Error("User ID not found");
      }
      const { data } = await axios.post(
        `${LMS_Backend}/api/tutor-ratings/submit-rating`,
        { courseId, rating, feedback, studentId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (data.success) {
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message || "Failed to submit rating");
        return false;
      }
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setBtnLoading(false);
    }
  };

  const fetchTutorRatings = async (courseId) => {
    setLoading(true);
    try {
      if (!checkToken()) return [];
      const { data } = await axios.get(
        `${LMS_Backend}/api/tutor-ratings/${courseId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (data.success) {
        const ratingsWithStudentDetails = await Promise.all(
          data.ratings.map(async (rating) => {
            if (!rating.studentId) {
              return {
                ...rating,
                student: { firstName: "Unknown", lastName: "User" },
              };
            }
            const studentDetails = await fetchStudentDetails(rating.studentId);
            return {
              ...rating,
              student: studentDetails || { firstName: "Unknown", lastName: "User" },
            };
          })
        );
        setTutorRatings(ratingsWithStudentDetails);
        return ratingsWithStudentDetails;
      } else {
        toast.error(data.message || "Failed to fetch tutor ratings");
        return [];
      }
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${LMS_Backend}/api/course/all`, { timeout: 5000 });
      if (data && Array.isArray(data.courses)) {
        setCourses(data.courses);
        setFilteredCourses(data.courses);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const filterCoursesByQuery = (query) => {
    if (!query) {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(query.toLowerCase()) ||
          course.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  };

  const filterCoursesByCategory = (category) => {
    if (category === "All") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) => course.category === category);
      setFilteredCourses(filtered);
    }
  };

  const fetchTutors = async () => {
    setLoading(true);
    try {
      if (!checkToken()) return;
      const { data } = await axios.get(`${LMS_Backend}/api/users/tutors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data && data.tutors) {
        setTutors(data.tutors);
      } else {
        setTutors([]);
      }
    } catch (error) {
      handleError(error);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLectures = async (id) => {
    setLecturesLoading(true);
    try {
      if (!checkToken()) return [];
      const { data } = await axios.get(`${LMS_Backend}/api/lectures/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setLectures(data.lectures);
        return data.lectures;
      } else {
        toast.error(data.message || "No lectures found for this course.");
        return [];
      }
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLecturesLoading(false);
    }
  };

  const fetchLecture = async (id) => {
    setLoading(true);
    try {
      if (!checkToken()) return null;
      const { data } = await axios.get(`${LMS_Backend}/api/lecture/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        return data.lecture;
      } else {
        toast.error(data.message || "Lecture not found.");
        return null;
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCourseProgress = async (courseId) => {
    setLoading(true);
    try {
      if (!checkToken()) return null;
      const { data } = await axios.get(`${LMS_Backend}/api/student/course/progress/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data.success) {
        setProgress(data.progress);
        return data.progress;
      } else {
        toast.error(data.message || "Failed to load progress");
        return null;
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const markLectureWatched = async (courseId, lectureId) => {
    try {
      if (!checkToken()) return;
      const { data } = await axios.post(
        `${LMS_Backend}/api/course/mark-watched/${courseId}/${lectureId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success(data.message);
      await fetchStudentCourseProgress(courseId);
    } catch (error) {
      handleError(error);
    }
  };

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
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

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
        setFilteredCourses((prevFiltered) => prevFiltered.filter((course) => course._id !== id));
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

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
        setLectures((prev) => [...prev, data.lecture]);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteLecture = async (id) => {
    setBtnLoading(true);
    try {
      if (!checkToken()) return;
      const { data } = await axios.delete(`${LMS_Backend}/api/admin/lecture/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (data) {
        toast.success(data.message);
        setLectures((prevLectures) => prevLectures.filter((lecture) => lecture._id !== id));
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

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
      const { data } = await axios.put(`${LMS_Backend}/api/admin/course/edit/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (data) {
        setCourses((prevCourses) =>
          prevCourses.map((course) => (course._id === id ? data.course : course))
        );
        setFilteredCourses((prevFiltered) =>
          prevFiltered.map((course) => (course._id === id ? data.course : course))
        );
        toast.success(data.message);
        return data.course;
      }
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  };

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
      const { data } = await axios.put(`${LMS_Backend}/api/admin/lecture/edit/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (data) {
        setLectures((prevLectures) =>
          prevLectures.map((lecture) => (lecture._id === id ? data.lecture : lecture))
        );
        toast.success(data.message);
        return data.lecture;
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
        filteredCourses,
        setCourses,
        lectures,
        setLectures,
        progress,
        setProgress,
        loading,
        btnLoading,
        lecturesLoading,
        fetchCourses,
        fetchLectures,
        fetchLecture,
        fetchStudentCourseProgress,
        markLectureWatched,
        createCourse,
        deleteCourse,
        addLecture,
        deleteLecture,
        editCourse,
        editLecture,
        tutors,
        categories,
        fetchTutors,
        submitTutorRating,
        tutorRatings,
        fetchTutorRatings,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        filterCoursesByQuery,
        filterCoursesByCategory,
        notes,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
      }}
    >
      {children}
      <Toaster />
    </CourseContext.Provider>
  );
};

export const CourseData = () => useContext(CourseContext);