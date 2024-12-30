import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const Verify = () => {
  const [otp, setOtp] = useState("");
  const { btnLoading, verifyOtp } = UserData();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    await verifyOtp(Number(otp), navigate);
  };

  return (
    <div className="auth-page flex items-center justify-center min-h-screen bg-teal-50">
      <div className="auth-form bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-teal-900 mb-6 text-center">Verify Account</h2>
        <form onSubmit={submitHandler} className="space-y-4">
          <div className="form-group">
            <label htmlFor="otp" className="block text-sm font-semibold text-teal-700">OTP</label>
            <input
              type="number"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full p-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            disabled={btnLoading}
            type="submit"
            className={`w-full py-2 px-4 rounded-md text-white font-semibold ${btnLoading ? 'bg-gray-400' : 'bg-black hover:bg-teal-500'} transition-colors`}
          >
            {btnLoading ? "Please Wait..." : "Verify"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Go to <Link to="/login" className="text-teal-600 hover:text-teal-800">Login</Link> page
        </p>
      </div>
    </div>
  );
};

export default Verify;
