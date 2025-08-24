import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { useTheme } from "./context/ThemeContext.jsx";

// Public pages
import Home from "./pages/Home.jsx";
import JobsList from "./pages/JobsList.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Authenticated pages
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";

// Jobseeker
import MyApplications from "./pages/MyApplications.jsx";

// Employer
import PostJob from "./pages/PostJob.jsx";
import EmployerJobs from "./pages/EmployerJobs.jsx";
import EmployerVerification from "./pages/EmployerVerification.jsx";
import ManageApplicants from "./pages/ManageApplicants.jsx";

// Admin
import AdminVerifications from "./pages/AdminVerifications.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";

export default function App() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#031c26] text-white" : "bg-white text-gray-900"}`}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated (any role incl. admin) */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute roles={["jobseeker", "employer", "admin"]}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["jobseeker", "employer", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Jobseeker */}
          <Route
            path="/applications"
            element={
              <ProtectedRoute roles={["jobseeker"]}>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          {/* Employer */}
          <Route
            path="/employer/post-job"
            element={
              <ProtectedRoute roles={["employer"]}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/verify"
            element={
              <ProtectedRoute roles={["employer"]}>
                <EmployerVerification />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/:id/applicants"
            element={
              <ProtectedRoute roles={["employer"]}>
                <ManageApplicants />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminVerifications />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
