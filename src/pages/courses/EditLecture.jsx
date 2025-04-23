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
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Edit Lecture</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Lecture Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter lecture title"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter lecture description"
            rows="4"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="type" className="block text-gray-700 font-medium mb-2">Lecture Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* File upload input */}
        <div className="form-group">
          <label htmlFor="file" className="block text-gray-700 font-medium mb-2">Lecture Video (Optional)</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">Only upload if you want to change the existing video.</p>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={btnLoading}
            className="w-full px-4 py-2 bg-blue-200 text-black font-semibold rounded-md border border-blue-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-blue-100"
          >
            {btnLoading ? "Updating..." : "Update Lecture"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditLecture;