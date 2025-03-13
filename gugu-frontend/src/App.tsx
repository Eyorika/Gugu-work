import { Routes, Route } from 'react-router-dom';
import Navigation from './components/common/Navigation';
import Home from './pages/Home';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployerDashboard from './components/dashboard/employer/EmployerDashboard';
import WorkerDashboard from './components/dashboard/worker/WorkerDashboard';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import { UserRole } from './lib/types';

function App() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />

          <Route path="/employer-dashboard" element={
            <ProtectedRoute requiredRole={UserRole.Employer}>
              <EmployerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/worker-dashboard" element={
            <ProtectedRoute requiredRole={UserRole.Worker}>
              <WorkerDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;