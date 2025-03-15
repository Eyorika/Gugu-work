import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost, Application } from '../../../lib/types';
import JobFilters from '../../others/JobFilters';
import ApplicationStatus from '../../dashboard/worker/ApplicationStatus';
import type { Filters } from '../../others/JobFilters';

export default function WorkerDashboard() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    location: '',
    minSalary: '',
    sort: 'newest'
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchJobs(), fetchApplications()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      let query = supabase
        .from('jobs')
        .select(`
          *,
          employer:profiles!jobs_employer_id_fkey(
            id,
            company_name,
            city
          ),
          applications!jobs_id_fkey(
            id,
            status,
            worker_id
          )
        `)
        .eq('status', 'open');

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.minSalary) {
        query = query.gte('salary', filters.minSalary);
      }
      
      query = query.order('created_at', { 
        ascending: filters.sort === 'oldest' 
      });

      const { data, error: jobsError } = await query;
      
      if (jobsError) {
        throw jobsError;
      }

      //  ////////////////////////////
      const jobsWithApplicationStatus = data?.map(job => ({
        ...job,
        hasApplied: job.applications?.some((app: Application) => app.worker_id === user.id) || false
      })) || [];

      setJobs(jobsWithApplicationStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching jobs');
    }
  };

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
    
      if (!user) {
        setError('Authentication required');
        return;
  
      
      }

      const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!left(
          id,
          title,
          location,
          salary,
          status,
          employer:profiles!jobs_employer_id_fkey(
            company_name,
            city
          )
        )
      `)
      .eq('worker_id', user.id)
      .order('created_at', { ascending: false });

      if (error) throw error;

    const validData = data?.filter(app => app.jobs !== null) || [];
    setApplications(validData);

      //setApplications(data || []);
    } catch (err) {
      console.error('Application fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    }
  };


  const applyForJob = async (jobId: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          worker_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (applicationError) {
        throw applicationError;
      }

      await Promise.all([fetchJobs(), fetchApplications()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply for job');
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    try {
      setError(null);
      const { error: withdrawError } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (withdrawError) {
        throw withdrawError;
      }

      await Promise.all([fetchJobs(), fetchApplications()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw application');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-4">Worker Dashboard</h1>
        <JobFilters filters={filters} setFilters={setFilters} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Jobs */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <p className="text-gray-500">No jobs found matching your criteria</p>
                {filters.search || filters.location || filters.minSalary ? (
                  <button
                    onClick={() => setFilters({ search: '', location: '', minSalary: '', sort: 'newest' })}
                    className="mt-4 text-primary hover:text-primary-dark"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <div className="text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {job.employer?.company_name}
                        </p>
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </p>
                        <p className="flex items-center gap-2 text-primary font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.salary}
                        </p>
                      </div>
                    </div>
                    {job.hasApplied ? (
                      <ApplicationStatus jobId={job.id} />
                    ) : (
                      <button
                        onClick={() => applyForJob(job.id)}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 mt-4">{job.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Applications */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">My Applications</h2>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-gray-500 text-center py-6">
                No applications yet
              </div>
            ) : (
              applications.map(app => (
                <div key={app.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">{app.jobs?.title}</h4>
                      <p className="text-sm text-gray-600">{app.jobs?.employer?.company_name}</p>
                      <p className="text-sm text-gray-600">{app.jobs?.location}</p>
                      <p className="text-sm text-primary">{app.jobs?.salary}</p>
                      <span className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    {app.status === 'pending' && (
                      <button
                        onClick={() => app.id && withdrawApplication(app.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}