import React from "react";
import { useNavigate } from "react-router-dom";

const Failure = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h2 className="text-red-600 text-2xl font-bold mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-4">Your payment could not be processed. Please try again.</p>
        <button
          onClick={() => navigate("/student/course/all")}
          className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
        >
          Back to Courses
        </button>
      </div>
    </div>
  );
};

export default Failure;