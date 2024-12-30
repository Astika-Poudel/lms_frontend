import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../../context/UserContext";

const Register = () => {
  const navigate = useNavigate();
  const { btnLoading, registerUser } = UserData("");
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");

  const submitHandler = async (e) => {
    e.preventDefault();
    await registerUser(firstname, lastname, username, email, password, role, navigate);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white text-gray-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-teal-800">
          Sign Up
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
              Firstname
            </label>
            <div className="mt-2">
              <input
                type="text"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
              Lastname
            </label>
            <div className="mt-2">
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <div className="mt-2">
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 outline-teal-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:outline-teal-500 sm:text-sm"
              >
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
                <option value="Tutor">Tutor</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={btnLoading}
              className="flex w-full justify-center rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
            >
              {btnLoading ? "Please wait..." : "Register"}
            </button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-teal-500 hover:text-teal-400">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
