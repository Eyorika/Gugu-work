import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../lib/types';


interface SignupData {
  email: string;
  password: string;
  full_name: string;
  address: string;
  role: UserRole;
  companyName: string; 
  skills: string[];          
  hourlyRate: number;        
}

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [full_name] = useState('');
  const [address] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Worker);
  const [error, setError] = useState('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const signupData: SignupData = {
        email,
        password,
        full_name,
        address,
        role,
        companyName: role === UserRole.Employer ? 'My Company' : '',
        skills: role === UserRole.Worker ? [] : [],
        hourlyRate: role === UserRole.Worker ? 0 : 0
      };
  
      await signUp(signupData);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl border border-gray-100/50">
    <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      Join Our Community
    </h2>
    
    {error && (
      <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400"
            placeholder="••••••••"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-medium mb-4">Select Your Role</label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              role === UserRole.Worker 
                ? 'border-blue-500 bg-blue-50/50 shadow-inner' 
                : 'border-gray-200 hover:border-blue-200'
            }`}>
              <input
                type="radio"
                name="role"
                value={UserRole.Worker}
                checked={role === UserRole.Worker}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 mb-2 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  👷
                </div>
                <span className="font-medium text-gray-700">Worker</span>
                <span className="text-sm text-gray-500 mt-1">Looking for work</span>
              </div>
            </label>

            <label className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
              role === UserRole.Employer 
                ? 'border-purple-500 bg-purple-50/50 shadow-inner' 
                : 'border-gray-200 hover:border-purple-200'
            }`}>
              <input
                type="radio"
                name="role"
                value={UserRole.Employer}
                checked={role === UserRole.Employer}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 mb-2 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  👔
                </div>
                <span className="font-medium text-gray-700">Employer</span>
                <span className="text-sm text-gray-500 mt-1">Hiring talent</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
      >
        Get Started
      </button>
    </form>

    <div className="mt-8 text-center text-sm text-gray-600">
      Already have an account?{' '}
      <Link 
        to="/login" 
        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        Log in here
      </Link>
    </div>

    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Google</span>
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.998 12c0-6.628-5.372-12-11.999-12C5.372 0 0 5.372 0 12c0 5.988 4.388 10.952 10.124 11.852v-8.384H7.078v-3.469h3.046V9.356c0-3.008 1.792-4.669 4.532-4.669 1.313 0 2.686.234 2.686.234v2.953H15.83c-1.49 0-1.955.925-1.955 1.874V12h3.328l-.532 3.469h-2.796v8.384c5.736-.9 10.124-5.864 10.124-11.853z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Facebook</span>
        </button>
      </div>
    </div>
  </div>
);
}
