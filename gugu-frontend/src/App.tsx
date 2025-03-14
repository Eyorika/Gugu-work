import { Routes, Route, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import Home from './pages/Home';
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

function App() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Employer protected routes */}
          <Route element={
            <ProtectedRoute requiredRole={UserRole.Employer}>
              <Outlet />
            </ProtectedRoute>
          }>
            <Route path="/employer">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployerDashboard />} />
              <Route path="jobs" element={<EmployerJobPost />} />
              <Route 
                path="applications/:jobId" 
                element={
                  <JobApplications 
                    jobId={jobId ?? ''} 
                    onClose={() => navigate('/employer/dashboard')} 
                  />
                } 
              />
            </Route>
          </Route>

          {/* Worker protected routes */}
          <Route element={
            <ProtectedRoute requiredRole={UserRole.Worker}>
              <Outlet />
            </ProtectedRoute>
          }>
            <Route path="/worker">
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<WorkerDashboard />} />
              <Route 
                path="applications" 
                element={
                  <JobApplications 
                    jobId="" 
                    onClose={() => navigate('/worker/dashboard')} 
                  />
                } 
              />
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/employer-dashboard" element={<Navigate to="/employer/dashboard" replace />} />
          <Route path="/worker-dashboard" element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;