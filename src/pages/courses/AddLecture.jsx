import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const AddLecture = () => {
  const { id } = useParams(); 
  const { addLecture, btnLoading } = CourseData();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!id) {
      console.error("Course ID is undefined");
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a video file.");
      return;
    }

    if (id) {
      addLecture(id, formData, file);
    } else {
      alert("Course ID is missing.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Add Lecture to Course</h2>
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
          <label htmlFor="file" className="block text-gray-700 font-medium mb-2">Lecture Video</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={btnLoading}
            className="w-full px-4 py-2 bg-blue-200 text-black font-semibold rounded-md border border-blue-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-blue-100"
          >
            {btnLoading ? "Adding..." : "Add Lecture"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLecture;
