import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost, Testimonial } from '../../../lib/types';

import JobStats from '../../jobs/JobStats';
import JobApplications from '../../applications/JobApplications';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import JobPostModal from '../../jobs/JobPostModal';

type SortOrder = 'newest' | 'oldest' | 'today' | 'this-week' | 'this-month';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [view, setView] = useState<'list' | 'form' | 'applications'>('list');
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const { user } = useAuth();

  useEffect(() => {

    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, content, created_at, profiles:user_id (full_name, role)')
        .eq('approved', true)
        .limit(2);
  
      if (!error && data) {
        setTestimonials(data as unknown as Testimonial[]);
      }
    };
    
    fetchTestimonials();
  
    console.log('EmployerDashboard useEffect - User ID:', user?.id);
    if (user?.id) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchJobs = async () => {

    try {
      console.log('EmployerDashboard - Starting jobs fetch');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('EmployerDashboard - Jobs fetched:', data?.length);
      setJobs(data || []);
    } catch (err) {
      console.error('EmployerDashboard - Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      console.log('EmployerDashboard - Setting loading to false');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterJobsByTime = (jobs: JobPost[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (sortOrder) {
      case 'today':
        return jobs.filter(job => new Date(job.created_at!) >= today);
      case 'this-week':
        return jobs.filter(job => new Date(job.created_at!) >= thisWeek);
      case 'this-month':
        return jobs.filter(job => new Date(job.created_at!) >= thisMonth);
      case 'newest':
        return [...jobs].sort((a, b) => 
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        );
      case 'oldest':
        return [...jobs].sort((a, b) => 
          new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
        );
      default:
        return jobs;
    }
  };

  const filteredJobs = filterJobsByTime(
    jobs.filter(job => statusFilter === 'all' ? true : job.status === statusFilter)
  );

  if (loading) {
    console.log('EmployerDashboard - Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    console.log('EmployerDashboard - Rendering error state:', error);
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  console.log('EmployerDashboard - Rendering dashboard with jobs count:', jobs.length);

  const deleteJob = async (jobId: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting');
    }
  };

  const handleEditJob = (job: JobPost) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  const handleCreateJob = () => {
    setSelectedJob({} as JobPost);
    setIsJobModalOpen(true);
  };

  const handleJobPostSuccess = () => {
    fetchJobs();
  };

  const updateJobStatus = async (jobId: string, status: 'open' | 'closed' | 'draft') => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    {/* Job Post Modal */}
    <JobPostModal 
      isOpen={isJobModalOpen}
      onClose={() => setIsJobModalOpen(false)}
      job={selectedJob}
      onPost={handleJobPostSuccess}
    />
    
    {/* Header Section */}
    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage your job postings and applications</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Link
          to="/employer/profile/edit"
          className="btn-secondary flex items-center justify-center px-6 py-2.5 text-sm"
        >
          <UserIcon className="w-5 h-5 mr-2" />
          Edit Profile
        </Link>
        <button
          onClick={handleCreateJob}
          className="btn-primary flex items-center justify-center px-6 py-2.5 text-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Post New Job
        </button>
      </div>
    </div>

    {/* Statistics Cards */}
    <JobStats jobs={jobs} />

    {/* Testimonials Section */}
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-xs">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Recent Testimonials
        </h2>
        <Link 
          to="/testimonials" 
          className="text-primary-600 hover:text-primary-800 font-medium flex items-center group transition-colors"
        >
          View All
          <ChevronRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {testimonials.slice(0, 2).map((testimonial) => (
          <div key={testimonial.id} className="bg-white p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <ChatIcon className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div>
                <blockquote className="text-gray-600 italic mb-4">
                  "{testimonial.content}"
                </blockquote>
                <figcaption className="text-sm font-medium text-gray-900">
                  {testimonial.profiles.full_name}
                  <span className="font-normal text-gray-500 ml-2">
                    ({testimonial.profiles.role})
                  </span>
                </figcaption>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Jobs Section */}
    {view === 'list' && (
      <section className="bg-white rounded-2xl shadow-xs p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Posted Jobs</h2>
            <p className="text-gray-500 mt-1">
              {filteredJobs.length} job{filteredJobs.length !== 1 && 's'} found
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              className="select-filter"
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed' | 'draft')}
              value={statusFilter}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            <select
              className="select-filter"
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              value={sortOrder}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="today">Posted Today</option>
              <option value="this-week">Posted This Week</option>
              <option value="this-month">Posted This Month</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <article 
            key={job.id}
            className="relative group bg-white p-6 rounded-xl shadow-xs border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all"
          >           <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {job.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`badge-${job.status}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  <select
                    value={job.status}
                    onChange={(e) => updateJobStatus(job.id, e.target.value as 'open' | 'closed' | 'draft')}
                    className="select-status"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              {/* Job Details */}
              <dl className="space-y-3 mb-4">
                <div className="flex items-center text-gray-600">
                  <LocationIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center text-primary-600">
                  <CurrencyIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  ${job.hourly_rate}/hr
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <ClockIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  Posted {formatDate(job.created_at!)}
                </div>
              </dl>

              <p className="text-gray-700 mb-4 line-clamp-3 text-sm leading-relaxed">
                {job.description}
              </p>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
    <div className="flex gap-3">
      <button
        onClick={() => handleEditJob(job)}
        className="btn-icon text-gray-600 hover:text-primary-600"
        aria-label="Edit job"
      >
        <PencilIcon className="w-5 h-5" />
      </button>
                  <button 
                    onClick={() => deleteJob(job.id)} 
                    className="btn-icon text-gray-600 hover:text-red-600"
                    aria-label="Delete job"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => { setSelectedJob(job); setView('applications') }}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  View Applications
                </button>
              </div>
            </article>
          ))}

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <BriefcaseIcon className="w-16 h-16 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No jobs found. Start by posting a new job!</p>
              <button
                onClick={() => setView('form')}
                className="btn-primary mt-4 px-6 py-2.5"
              >
                Post First Job
              </button>
            </div>
          )}
        </div>
      </section>
    )}
      {view === 'applications' && selectedJob && (
        <JobApplications 
          job={selectedJob} 
          onClose={() => {
            setView('list');
            setSelectedJob(null);
          }} 
        />
      )} 
    </div>
  );
}

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);



// Add these icon components at the bottom of your file
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CurrencyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
    />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);