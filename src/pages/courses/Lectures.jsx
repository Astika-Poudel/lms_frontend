import React, { useEffect } from "react";
import { CourseData } from "../../context/CourseContext";


const Lecture = ({ lectureId }) => {
  const { lecture, fetchLecture, loading } = CourseData();

  useEffect(() => {
    fetchLecture(lectureId); 
  }, [fetchLecture, lectureId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!lecture) {
    return <div>No lecture found.</div>;
  }

  return (
    <div className="lecture-details">
      <h2>{lecture.title}</h2>
      <p>{lecture.description}</p>
      <p>Duration: {lecture.duration} Minutes</p>
      <p>Instructor: {lecture.instructor}</p>
    </div>
  );
};

export default Lecture;
