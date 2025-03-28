import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import Sidebar from './components/common/Sidebar';
import Home from './pages/Home';
import { SidebarProvider } from './contexts/SidebarContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployerDashboard from './components/dashboard/employer/EmployerDashboard';
import WorkerDashboard from './components/dashboard/worker/WorkerDashboard';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import JobApplications from './components/applications/JobApplications';
import { UserRole } from './lib/types';
import Unauthorized from './pages/Unauthorized';
import EmployerJobPost from './components/dashboard/employer/EmployerJobPost';
import Profile from './components/profile/Profile';
import ProfileForm from './components/profile/ProfileForm';
import TestimonialPage from './components/TestimonialPage';
import MessagingPage from './components/messaging/MessagingPage';
import { MessagingProvider } from './contexts/MessagingContext';
import { NotificationProvider } from './contexts/NotificationContext';
function App() {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <NotificationProvider>
        <MessagingProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Navigation />
              <main className="flex-1 overflow-y-auto px-4 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Employer protected routes */}
          <Route element={<ProtectedRoute requiredRole={UserRole.Employer} />}>
            <Route path="/employer">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployerDashboard />} />
              <Route path="jobs" element={<EmployerJobPost />} />
              <Route path="jobs/:id" element={<EmployerJobPost />} />

              <Route path="applications/:jobId" element={<JobApplications onClose={() => navigate('/employer/dashboard')} />} />
              <Route path="profile">
                <Route index element={<Profile />} />
                <Route path="edit" element={<ProfileForm />} />
              </Route>
              <Route path="messages" element={<MessagingPage />} />
            </Route>
          </Route>
          

          {/* Worker protected routes */}
          <Route element={<ProtectedRoute requiredRole={UserRole.Worker} />}>
            <Route path="/worker">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route path="applications">
                <Route index element={<JobApplications onClose={() => navigate('/worker/dashboard')} />} />
              </Route>
              <Route path="profile">
                <Route index element={<Profile />} />
                <Route path="edit" element={<ProfileForm />} />
              </Route>
              <Route path="messages" element={<MessagingPage />} />
            </Route>
          </Route>

          {/* Common profile routes (if needed) */}
          <Route element={<ProtectedRoute />}>
          <Route path="/testimonials" element={<TestimonialPage />} />

            <Route path="/profile" element={<Navigate to="/employer/profile" replace />} />
          </Route>

          {/* Redirects */}
          <Route path="/employer-dashboard" element={<Navigate to="/employer/dashboard" replace />} />
          <Route path="/worker-dashboard" element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

   
              </main>
            </div>
          </div>
        </MessagingProvider>
      </NotificationProvider>
    </SidebarProvider>
  );
}

export default App;