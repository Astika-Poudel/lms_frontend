import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import "./index.css";
import { UserContextProvider } from './context/UserContext.jsx';
import { CourseContextProvider } from './context/CourseContext.jsx';
import { EnrollContextProvider } from './context/enrollContext.jsx';
import { NotificationContextProvider } from './context/NotificationContext.jsx';
import { TutorContextProvider } from './context/TutorContext.jsx';
import { BrowserRouter } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";

export const LMS_Backend = "http://localhost:7001";

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <UserContextProvider>
    <CourseContextProvider>
      <EnrollContextProvider>
        <NotificationContextProvider>
          <TutorContextProvider>
            <App />
          </TutorContextProvider>
        </NotificationContextProvider>
      </EnrollContextProvider>
    </CourseContextProvider>
  </UserContextProvider>
  </BrowserRouter>
);
