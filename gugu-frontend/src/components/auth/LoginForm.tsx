<<<<<<< HEAD

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
=======
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
import { useAuth } from '../../contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
<<<<<<< HEAD
  const { signIn } = useAuth();
=======
  const { login } = useAuth();
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
<<<<<<< HEAD
      await signIn(email, password);
      navigate('/dashboard');
=======
      await login(email, password);
      navigate('/');
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
<<<<<<< HEAD
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold mb-8 text-primary text-center">Welcome Back</h2>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
=======
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-primary">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
<<<<<<< HEAD
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
=======
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
<<<<<<< HEAD
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium">
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
=======
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
        >
          Login
        </button>
      </form>
<<<<<<< HEAD
      
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.998 12c0-6.628-5.372-12-11.999-12C5.372 0 0 5.372 0 12c0 5.988 4.388 10.952 10.124 11.852v-8.384H7.078v-3.469h3.046V9.356c0-3.008 1.792-4.669 4.532-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.384c5.736-.9 10.124-5.864 10.124-11.853z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Facebook</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary hover:text-primary-dark font-medium">
          Sign up
        </Link>
      </div>
=======
>>>>>>> 000a952a6c49a2de13f68bc1fb38cce32acb1548
    </div>
  );
}