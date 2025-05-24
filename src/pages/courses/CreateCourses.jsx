import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const CreateCourses = () => {
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
                        Create New Course
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        <div className="form-group">
                            <label htmlFor="title" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
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
                                placeholder="Enter course description"
                                rows="4"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="category" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                                Category
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
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
                            <label htmlFor="duration" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
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
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="price" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
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
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="Tutor" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                                Tutor Name
                            </label>
                            <select
                                id="Tutor"
                                name="Tutor"
                                value={formData.Tutor}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
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
                            <label htmlFor="file" className="block text-gray-700 font-medium mb-2 text-sm sm:text-base lg:text-lg">
                                Course Image
                            </label>
                            <input
                                type="file"
                                id="file"
                                onChange={handleFileChange}
                                required
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#134e4a] text-sm sm:text-base"
                            />
                        </div>

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={btnLoading}
                                className="w-full sm:w-auto px-6 py-2 bg-[#134e4a] text-white font-semibold rounded-md hover:bg-[#0f3b36] focus:outline-none focus:ring-2 focus:ring-[#134e4a] disabled:bg-[#0f3b36] disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base"
                            >
                                {btnLoading ? "Creating..." : "Create Course"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateCourses;