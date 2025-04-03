import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const CreateCourse = () => {
  const { createCourse, btnLoading, categories, tutors, fetchTutors } = CourseData();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    price: "",
    Tutor: "",
  });
  const [file, setFile] = useState(null);

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
      alert("Please upload an image for the course.");
      return;
    }
    createCourse(formData, file, (id) => {
      if (id) {
        navigate(`/admin/add-lecture/course/${id}`);
      } else {
        alert("Failed to create course.");
      }
    });
  };

  useEffect(() => {
    if (tutors.length === 0) {
      fetchTutors();
    }
  }, [tutors, fetchTutors]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-6">
        Create New Course
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Course Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter course title"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter course description"
            rows="4"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">Select a category</option>
            {categories?.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="duration" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Duration (Months)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="Enter course duration"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Price (NPR)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Enter course price"
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Tutor" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Tutor Name
          </label>
          <select
            id="Tutor"
            name="Tutor"
            value={formData.Tutor}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">Select a tutor</option>
            {tutors.length > 0 ? (
              tutors.map((tutor) => (
                <option key={tutor._id} value={`${tutor.firstname} ${tutor.lastname}`}>
                  {tutor.firstname} {tutor.lastname}
                </option>
              ))
            ) : (
              <option disabled>No tutors available</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
            Course Image
          </label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            required
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={btnLoading}
            className="w-full px-4 py-2 bg-blue-200 text-black font-semibold rounded-md border border-blue-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-blue-100 text-sm sm:text-base"
          >
            {btnLoading ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse;