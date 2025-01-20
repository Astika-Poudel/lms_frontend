import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    
    navigate("/student/course/all");
  }, [navigate]);

  return null; 
};

export default StudentDashboard;
