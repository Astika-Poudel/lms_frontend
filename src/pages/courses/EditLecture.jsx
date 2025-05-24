import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const EditLecture = () => {
  const { editLecture, lectures, btnLoading } = CourseData();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
  });
  const [file, setFile] = useState(null);

  // Load existing lecture data
  useEffect(() => {
    const lecture = lectures.find((lecture) => lecture._id === id);
    if (lecture) {
      // Determine the lecture type by checking the course's arrays
      const course = lecture.course; // Assuming course is populated or fetched separately
      let lectureType = "";
      if (course?.beginnerLectures?.includes(lecture._id)) {
        lectureType = "beginner";
      } else if (course?.advancedLectures?.includes(lecture._id)) {
        lectureType = "advanced";
      }

      setFormData({
        title: lecture.title,
        description: lecture.description,
        type: lectureType || "beginner", // Default to beginner if not found
      });
    }
  }, [id, lectures]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty fields from formData before sending
      const updatedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== "")
      );
      
      // Call editLecture function to update the lecture
      await editLecture(id, updatedData, file);
      
      // Navigate to the course detail page
      const lecture = lectures.find((lecture) => lecture._id === id);
      const courseId = lecture?.course?._id || lecture?.course; // Handle both populated and non-populated course field
      if (!courseId) {
        throw new Error("Course ID not found for the lecture.");
      }
      navigate(`/admin/course-detail/${courseId}`);  // Navigate to course detail page
    } catch (error) {
      console.error("Failed to update lecture:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 focus:outline-none"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-center text-gray-800 mb-6">
            Edit Lecture
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="form-group">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                Lecture Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter lecture title"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter lecture description"
                rows="4"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                Lecture Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
              >
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="file" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                Lecture Video (Optional)
              </label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
              />
              <p className="text-sm text-gray-500 mt-1">Only upload if you want to change the existing video.</p>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={btnLoading}
                className="w-full sm:w-auto px-6 py-2 bg-[#134e4a] text-white font-semibold rounded-md hover:bg-[#0f3b36] focus:outline-none focus:ring-2 focus:ring-[#134e4a] disabled:bg-[#0f3b36] disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base"
              >
                {btnLoading ? "Updating..." : "Update Lecture"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditLecture;