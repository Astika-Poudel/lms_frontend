import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const EditCourse = () => {
  const { editCourse, courses, btnLoading, categories, tutors, fetchTutors } = CourseData();
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    price: "",
    Tutor: "",
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (tutors.length === 0) {
      fetchTutors();
    }

    const course = courses.find((c) => c._id === id);
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        category: course.category || "",
        duration: course.duration || "",
        price: course.price || "",
        Tutor: course.Tutor ? `${course.Tutor.firstname} ${course.Tutor.lastname}` : "",
      });
    }
  }, [id, courses, tutors, fetchTutors]);

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
      const updatedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== "")
      );
      await editCourse(id, updatedData, file);
      navigate("/admin/course/all");
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Edit Course</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-group">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Course Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter course title"
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
            placeholder="Enter course description"
            rows="4"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="duration" className="block text-gray-700 font-medium mb-2">Duration (Months)</label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="Enter course duration"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="price" className="block text-gray-700 font-medium mb-2">Price (NPR)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="Enter course price"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Tutor" className="block text-gray-700 font-medium mb-2">Tutor Name</label>
          <select
            id="Tutor"
            name="Tutor"
            value={formData.Tutor}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="file" className="block text-gray-700 font-medium mb-2">Course Image (Optional)</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">Only upload if you want to change the existing image</p>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={btnLoading}
            className="w-full px-4 py-2 bg-blue-200 text-black font-semibold rounded-md border border-blue-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-blue-100"
          >
            {btnLoading ? "Updating..." : "Update Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;