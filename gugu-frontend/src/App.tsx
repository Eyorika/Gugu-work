<<<<<<< HEAD
import { Routes, Route } from 'react-router-dom';
=======
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
import Navigation from './components/common/Navigation';
import Home from './pages/Home';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import ProtectedRoute from './components/common/ProtectedRoute';
import EmployerDashboard from './components/dashboard/employer/EmployerDashboard';
import WorkerDashboard from './components/dashboard/worker/WorkerDashboard';
<<<<<<< HEAD
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
=======
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
import { UserRole } from './lib/types';

function App() {
  return (
<<<<<<< HEAD
    <>
=======
    <Router>
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
<<<<<<< HEAD
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />

=======
          
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
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
<<<<<<< HEAD
    </>
=======
    </Router>
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  );
}

export default App;