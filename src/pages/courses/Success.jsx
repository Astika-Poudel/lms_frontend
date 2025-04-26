import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Log all query parameters to see what eSewa is sending
        const allParams = {};
        for (const [key, value] of searchParams.entries()) {
          allParams[key] = value;
        }
        console.log("All Search Params:", allParams);

        // Check for the 'data' parameter
        const dataParam = searchParams.get("data");
        if (!dataParam) {
          setError("Invalid payment details. Missing 'data' parameter.");
          setLoading(false);
          return;
        }

        // Decode the Base64-encoded 'data' parameter
        let decodedData;
        try {
          decodedData = JSON.parse(atob(dataParam));
        } catch (decodeError) {
          console.error("Error decoding data parameter:", decodeError);
          setError("Failed to decode payment details.");
          setLoading(false);
          return;
        }

        console.log("Decoded Data:", decodedData);

        // Extract transaction details from decoded data
        // Adjust these keys based on eSewa's actual response (common keys: transaction_code, amount, refId)
        const transaction_uuid = decodedData.transaction_uuid || decodedData.transaction_code || decodedData.oid;
        const amount = decodedData.total_amount || decodedData.amount || decodedData.amt;
        const refId = decodedData.refId || decodedData.refid || decodedData.referenceId;

        console.log("Extracted Params:", { transaction_uuid, amount, refId });

        // Check if extracted parameters are present
        if (!transaction_uuid || !amount || !refId) {
          setError("Invalid payment details. Missing required transaction details.");
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        console.log("Token:", token);

        if (!token) {
          setError("Authentication token missing. Please log in again.");
          setLoading(false);
          return;
        }

        // Send verification request to backend
        const { data } = await axios.get("http://localhost:7001/api/payment/verify-esewa", {
          params: { transaction_uuid, amount, refId },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          // Enroll the user in the course
          await enrollInCourse(data.courseId);
          setSuccess(true);
          setTimeout(() => navigate("/student/courses"), 3000);
        } else {
          setError("Payment verification failed.");
        }
      } catch (error) {
        console.error("Error verifying payment:", error.response?.data || error.message);
        setError(error.response?.data?.error || "Payment verification failed. Please try again.");
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