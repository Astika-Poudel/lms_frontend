import React, { useState } from "react";

const CreateCourse = () => {

  const [courseName, setCourseName] = useState("");
  const [tutor, setTutor] = useState("");
  const [description, setDescription] = useState("");


  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Course Created:", { courseName, tutor, description });

    
    setCourseName("");
    setTutor("");
    setDescription("");
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-[#134e4a] mb-4">Create New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="courseName" className="block text-lg font-semibold">
            Course Name
          </label>
          <input
            type="text"
            id="courseName"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="tutor" className="block text-lg font-semibold">
            Tutor
          </label>
          <input
            type="text"
            id="tutor"
            value={tutor}
            onChange={(e) => setTutor(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-semibold">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-700"
        >
          Create Course
        </button>
      </form>
    </div>
  );
};

export default CreateCourse;
