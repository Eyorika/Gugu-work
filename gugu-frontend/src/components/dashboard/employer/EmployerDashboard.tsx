import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost } from '../../../lib/types';
import JobPostForm from '../../jobs/JobPostForm';
import JobStats from '../../jobs/JobStats';
import JobApplications from '../../applications/JobApplications';
import { Route } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

type SortOrder = 'newest' | 'oldest' | 'today' | 'this-week' | 'this-month';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'applications'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const { user } = useAuth();

  useEffect(() => {
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employer Dashboard</h1>
        <div className="space-x-4">
          <Link
            to="/employer/profile/edit"
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Edit Profile
          </Link>
          <button onClick={() => setView('form')} className="btn-primary">
            Post New Job
          </button>
        </div>
      </div>

      <JobStats jobs={jobs} />

      {view === 'form' && (
        <div className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {selectedJob ? 'Edit Job' : 'Post New Job'}
          </h2>
          <JobPostForm 
            job={selectedJob}
            onPost={() => {
              console.log('Job posted/updated successfully');
              fetchJobs();
              setView('list');
              setSelectedJob(null);
            }}
            onCancel={() => {
              console.log('Cancelling job form');
              setView('list');
              setSelectedJob(null);
            }}
          />
        </div>
      )}

      {view === 'list' && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Posted Jobs</h2>
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-1 text-sm"
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed' | 'draft')}
                value={statusFilter}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              <select
                className="border rounded px-3 py-1 text-sm"
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
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow mb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' :
                      job.status === 'closed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <select
                      value={job.status}
                      onChange={(e) => updateJobStatus(job.id, e.target.value as 'open' | 'closed' | 'draft')}
                      className="text-sm border rounded p-1"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </p>
                  <p className="text-primary font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${job.hourly_rate}/hr
                  </p>
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posted {formatDate(job.created_at!)}
                  </p>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                
                <div className="flex justify-between items-center mt-4">
                  <button 
                    onClick={() => {
                      console.log('Edit button clicked for job:', job);
                      setSelectedJob(job);
                      setView('form');
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteJob(job.id)} 
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No jobs found
              </div>
            )}
          </div>
        </div>
      )}
      {view === 'applications' && selectedJob && (
        <JobApplications job={selectedJob} onClose={() => setView('list')} />
      )}
    </div>
  );
}