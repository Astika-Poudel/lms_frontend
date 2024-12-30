import React from 'react';

const StudentDashboard = () => {
  return (
    <div>
      <h1>Welcome to the Student Dashboard</h1>
      <div>
        {/* You can add specific components for the student dashboard here */}
        <p>Here are your enrolled courses:</p>
        {/* Example: List of courses */}
        <ul>
          <li>Course 1</li>
          <li>Course 2</li>
          <li>Course 3</li>
        </ul>

        <p>Check your upcoming assessments:</p>
        {/* Example: List of upcoming assessments */}
        <ul>
          <li>Assessment 1</li>
          <li>Assessment 2</li>
          <li>Assessment 3</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentDashboard;
