import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { EnrollData } from "../../context/enrollContext";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enrollInCourse } = EnrollData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const hasVerified = useRef(false); // Prevent multiple verifications

  useEffect(() => {
    const verifyPayment = async () => {
      if (hasVerified.current) {
        console.log("Payment verification already attempted, skipping...");
        return;
      }

      hasVerified.current = true;
      try {
        const allParams = {};
        for (const [key, value] of searchParams.entries()) {
          allParams[key] = value;
        }
        console.log("All Search Params:", allParams);

        const dataParam = searchParams.get("data");
        if (!dataParam) {
          setError("Missing payment data from eSewa.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        console.log("Token:", token);

        if (!token) {
          setError("Authentication token missing. Please log in again.");
          setLoading(false);
          navigate("/login");
          return;
        }

        const { data } = await axios.get("http://localhost:7001/api/payment/verify-esewa", {
          params: { data: dataParam },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          const courseId = data.courseId;
          console.log("Course ID from verify-esewa:", courseId);

          if (!courseId || typeof courseId !== "string" || !courseId.match(/^[0-9a-fA-F]{24}$/)) {
            setError("Invalid course ID received from payment verification.");
            setTimeout(() => navigate("/payment-failure"), 2000);
            return;
          }

          console.log("Calling enrollInCourse from Success for course:", courseId);
          await enrollInCourse(courseId);
          setSuccess(true);
          setTimeout(() => navigate("/student/courses"), 3000);
        } else {
          setError("Payment verification failed.");
          setTimeout(() => navigate("/payment-failure"), 2000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error.response?.data || error.message);
        setError(error.response?.data?.error || "Payment verification failed. Please try again.");
        setTimeout(() => navigate("/payment-failure"), 2000);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, enrollInCourse]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        {loading ? (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </>
        ) : success ? (
          <>
            <h2 className="text-green-600 text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-700 mb-4">You are now enrolled in the course.</p>
            <button
              onClick={() => navigate("/student/courses")}
              className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
            >
              Go to My Courses
            </button>
          </>
        ) : (
          <>
            <h2 className="text-red-600 text-2xl font-bold mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/student/course/all")}
              className="bg-[#134e4a] text-white px-6 py-2 rounded-lg hover:bg-[#0c3c38] transition duration-300"
            >
              Back to Courses
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Success;