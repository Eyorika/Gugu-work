import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserRole } from '../lib/types';
import * as Yup from 'yup';

interface Testimonial {
  id: string;
  content: string;
  role: UserRole;
  created_at: string;
  approved: boolean;
  profiles: {
    full_name: string;
    photo_url?: string;
    role?: UserRole;
  };
}

export default function TestimonialPage() {
  const { user, role } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const testimonialsPerPage = 6;

  useEffect(() => {
    fetchTestimonials(currentPage);
    if (role === 'employer') {
      fetchPendingTestimonials();
    }
  }, [currentPage, role]);

  const fetchTestimonials = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      // Calculate pagination range
      const from = (page - 1) * testimonialsPerPage;
      const to = from + testimonialsPerPage - 1;

      // Get total count for pagination
      const { count } = await supabase
        .from('testimonials')
        .select('id', { count: 'exact' })
        .eq('approved', true);

      // Fetch paginated testimonials
      const { data, error } = await supabase
        .from('testimonials')
        .select(`
          id,
          content,
          role,
          created_at,
          approved,
          profiles:user_id (full_name, photo_url, role)
        `)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      if (data) {
        setTestimonials(data as unknown as Testimonial[]);
        setTotalPages(Math.ceil((count || 0) / testimonialsPerPage));
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('Failed to load testimonials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTestimonials = async () => {
    if (role !== 'employer') return;
    
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select(`
          id,
          content,
          role,
          created_at,
          approved,
          profiles:user_id (full_name, photo_url, role)
        `)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setPendingTestimonials(data as unknown as Testimonial[]);
      }
    } catch (err) {
      console.error('Error fetching pending testimonials:', err);
    }
  };

  const validateTestimonial = (content: string) => {
    try {
      const schema = Yup.string()
        .required('Testimonial content is required')
        .min(10, 'Testimonial must be at least 10 characters')
        .max(500, 'Testimonial cannot exceed 500 characters');
      
      schema.validateSync(content);
      return null;
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        return err.message;
      }
      return 'Invalid testimonial content';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    
    if (!user) {
      setFormError('You must be logged in to submit a testimonial');
      return;
    }
    
    const validationError = validateTestimonial(newTestimonial);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert([{
          user_id: user.id,
          content: newTestimonial.trim(),
          role: role, // Use the role from AuthContext instead of user.role
          approved: false // All testimonials require approval
        }]);

      if (error) throw error;
      
      setNewTestimonial('');
      setSuccessMessage('Your testimonial has been submitted for approval. Thank you!');
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      setFormError('Failed to submit testimonial. Please try again.');
    }
  };

  const handleApprove = async (id: string) => {
    if (role !== 'employer') return;
    
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ approved: true })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setPendingTestimonials(prev => prev.filter(t => t.id !== id));
      fetchTestimonials(currentPage);
    } catch (err) {
      console.error('Error approving testimonial:', err);
    }
  };

  const handleReject = async (id: string) => {
    if (role !== 'employer') return;
    
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setPendingTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error rejecting testimonial:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Testimonials</h1>
      
      {/* Submission Form */}
      {user && (
        <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Share Your Experience</h2>
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <textarea
              value={newTestimonial}
              onChange={(e) => setNewTestimonial(e.target.value)}
              className="w-full p-4 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Share your experience with GUGU..."
              rows={4}
            />
            {formError && (
              <div className="text-red-500 mb-4">{formError}</div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {newTestimonial.length}/500 characters
              </span>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Testimonial
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Approval Section */}
      {role === 'employer' && pendingTestimonials.length > 0 && (
        <div className="mb-12 bg-yellow-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Pending Testimonials</h2>
          <div className="space-y-6">
            {pendingTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center mb-3">
                  <img
                    src={testimonial.profiles.photo_url || '/avatar-placeholder.png'}
                    className="w-10 h-10 rounded-full mr-3"
                    alt={testimonial.profiles.full_name}
                  />
                  <div>
                    <h3 className="font-semibold">{testimonial.profiles.full_name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{testimonial.profiles.role}</p>
                  </div>
                </div>
                <p className="text-gray-800 mb-3">"{testimonial.content}"</p>
                <p className="text-xs text-gray-500 mb-4">
                  Submitted on {new Date(testimonial.created_at).toLocaleDateString()}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(testimonial.id)}
                    className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(testimonial.id)}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 text-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading testimonials...</p>
          </div>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-red-500">
            {error}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No testimonials available yet.
          </div>
        ) : (
          testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.profiles.photo_url || '/avatar-placeholder.png'}
                  className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-gray-200"
                  alt={testimonial.profiles.full_name}
                />
                <div>
                  <h3 className="font-semibold">{testimonial.profiles.full_name}</h3>
                  <p className="text-gray-600 capitalize">{testimonial.profiles.role}</p>
                </div>
              </div>
              <p className="text-gray-800 mb-4 italic">"{testimonial.content}"</p>
              <p className="text-sm text-gray-500">
                {new Date(testimonial.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-12">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-md ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}