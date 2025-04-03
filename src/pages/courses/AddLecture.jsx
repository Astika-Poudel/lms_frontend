import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CourseData } from "../../context/CourseContext";

const AddLecture = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Initialize useNavigate
  const { addLecture, btnLoading } = CourseData();

  // State to manage multiple lecture forms
  const [lectureForms, setLectureForms] = useState([
    { title: "", description: "", file: null },
  ]);

  useEffect(() => {
    if (!id) {
      console.error("Course ID is undefined");
    }
  }, [id]);

  // Handle input changes for each lecture form
  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedForms = [...lectureForms];
    updatedForms[index][name] = value;
    setLectureForms(updatedForms);
  };

  // Handle file changes for each lecture form
  const handleFileChange = (index, e) => {
    const updatedForms = [...lectureForms];
    updatedForms[index].file = e.target.files[0];
    setLectureForms(updatedForms);
  };

  // Add a new lecture form
  const addNewLectureForm = () => {
    setLectureForms([...lectureForms, { title: "", description: "", file: null }]);
  };

  // Handle form submission for all lectures
  const handleSubmit = (e) => {
    e.preventDefault();

    let isValid = true;

    lectureForms.forEach((form, index) => {
      if (!form.file) {
        alert(`Please upload a video file for Lecture ${index + 1}.`);
        isValid = false;
      }

      if (id && isValid) {
        addLecture(id, { title: form.title, description: form.description }, form.file);
      } else {
        alert("Course ID is missing.");
        isValid = false;
      }
    });

    // If all lectures are submitted successfully, navigate to the course details page
    if (isValid) {
      navigate(`/admin/course-detail/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Add Lectures to Course</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {lectureForms.map((form, index) => (
          <div key={index} className="space-y-4 border-b pb-4">
            <h3 className="text-lg font-medium text-gray-700">Lecture {index + 1}</h3>
            <div className="form-group">
              <label htmlFor={`title-${index}`} className="block text-gray-700 font-medium mb-2">
                Lecture Title
              </label>
              <input
                type="text"
                id={`title-${index}`}
                name="title"
                value={form.title}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="Enter lecture title"
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`description-${index}`} className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                id={`description-${index}`}
                name="description"
                value={form.description}
                onChange={(e) => handleInputChange(index, e)}
                placeholder="Enter lecture description"
                rows="4"
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor={`file-${index}`} className="block text-gray-700 font-medium mb-2">
                Lecture Video
              </label>
              <input
                type="file"
                id={`file-${index}`}
                onChange={(e) => handleFileChange(index, e)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={addNewLectureForm}
            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Add Another Lecture
          </button>
          <button
            type="submit"
            disabled={btnLoading}
            className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {btnLoading ? "Adding..." : "Submit All Lectures"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLecture;
