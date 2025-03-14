import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost } from '../../../lib/types';
import JobPostForm from '../../jobs/JobPostForm';
import JobStats from '../../jobs/JobStats';
import JobApplications from '../../applications/JobApplications';

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [view, setView] = useState<'list' | 'form' | 'applications'>('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'draft'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }
  
 
 
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          applications:applications(count)
        `)
        .eq('employer_id', user.id)
        .order('created_at', { ascending: sortOrder === 'oldest' });
  
      if (jobsError) throw jobsError;
  
       
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          worker:profiles!worker_id(
            id,
            first_name,
            last_name
          )
        `)
        .in('job_id', jobsData?.map(j => j.id) || []);
  
      // Combine the data
      const combinedData = jobsData?.map(job => ({
        ...job,
        application_count: job.applications?.[0]?.count || 0,
        applications: applicationsData?.filter(app => app.job_id === job.id) || []
      })) || [];
  
      setJobs(combinedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const filteredJobs = jobs.filter(job => {
    if (statusFilter === 'all') return true;
    return job.status === statusFilter;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Employer Dashboard</h1>
        <div className="space-x-4">
          <button onClick={() => setView('form')} className="btn-primary">
            Post New Job
          </button>
          <button onClick={() => setView('list')} className="btn-secondary">
            View Jobs
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
              fetchJobs();
              setView('list');
              setSelectedJob(null);
            }}
            onCancel={() => {
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
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                value={sortOrder}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
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
                    {job.salary}
                  </p>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                
                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => {
                      setSelectedJob(job);
                      setView('applications');
                    }}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    {(job.applications as any[])?.length || 0} Applications
                  </button>
                  <div className="space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedJob(job);
                        setView('form');
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
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
        <JobApplications jobId={selectedJob.id} onClose={() => setView('list')} />
      )}
    </div>
  );
}