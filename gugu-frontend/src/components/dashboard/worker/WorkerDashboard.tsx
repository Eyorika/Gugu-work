import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost, ApplicationStatus } from '../../../lib/types';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  created_at: string;
}

interface EmployerProfile {
  id: string;
  company_name: string;
  username: string;
}

interface JobWithStatus extends Omit<JobPost, 'salary'> {
  applicationStatus: ApplicationStatus | null;
  applications: Application[];
  employer: EmployerProfile;
  hourly_rate: number;
}

interface ApplicationWithJob extends Omit<JobPost, 'status' | 'salary'> {
  applicationStatus: ApplicationStatus;
  created_at: string;
  employer?: {
    company_name: string;
  };
  hourly_rate: number;
}

interface JobResponse {
  id: string;
  title: string;
  description: string;
  location: string;
  hourly_rate: number;
  status: string;
  created_at: string;
  employer_id: string;
  employer: EmployerProfile;
}

interface JobData {
  id: string;
  title: string;
  description: string;
  location: string;
  hourly_rate: number;
  employer_id: string;
  created_at: string;
  employer: {
    company_name: string;
  };
}

interface ApplicationResponse {
  id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  created_at: string;
  jobs: JobData;
}

type SortOrder = 'newest' | 'oldest' | 'today' | 'this-week' | 'this-month';

export default function WorkerDashboard() {
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobSortOrder, setJobSortOrder] = useState<SortOrder>('newest');
  const [applicationSortOrder, setApplicationSortOrder] = useState<SortOrder>('newest');
  const { user } = useAuth();

  useEffect(() => {
    console.log('WorkerDashboard useEffect - User ID:', user?.id);
    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

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

  const filterByTime = (items: any[], sortOrder: SortOrder, dateField: string = 'created_at') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (sortOrder) {
      case 'today':
        return items.filter(item => new Date(item[dateField]!) >= today);
      case 'this-week':
        return items.filter(item => new Date(item[dateField]!) >= thisWeek);
      case 'this-month':
        return items.filter(item => new Date(item[dateField]!) >= thisMonth);
      case 'newest':
        return [...items].sort((a, b) => 
          new Date(b[dateField]!).getTime() - new Date(a[dateField]!).getTime()
        );
      case 'oldest':
        return [...items].sort((a, b) => 
          new Date(a[dateField]!).getTime() - new Date(b[dateField]!).getTime()
        );
      default:
        return items;
    }
  };

  const loadData = async () => {
    try {
      console.log('WorkerDashboard - Starting data load');
      setLoading(true);
      setError(null);

      // First, fetch all open jobs
      console.log('WorkerDashboard - Fetching jobs...');
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          hourly_rate,
          status,
          created_at,
          employer_id,
          employer:profiles(
            id,
            company_name,
            username
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        throw new Error('Failed to fetch jobs');
      }

      console.log('Jobs fetched:', jobsData?.length, jobsData);

      // Then fetch the worker's applications
      console.log('WorkerDashboard - Fetching applications...');
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          worker_id,
          status,
          created_at,
          jobs(
            id,
            title,
            description,
            location,
            hourly_rate,
            employer_id,
            created_at,
            employer:profiles(
              company_name,
              username
            )
          )
        `)
        .eq('worker_id', user?.id);

      if (applicationsError) {
        console.error('Error fetching applications:', applicationsError);
        throw new Error('Failed to fetch applications');
      }

      console.log('Applications fetched:', applicationsData?.length, applicationsData);

      // Type guard function to ensure data shape
      const isValidJobData = (data: any): data is JobResponse => {
        return data && 
               typeof data.id === 'string' && 
               data.employer && 
               typeof data.employer.company_name === 'string';
      };

      const isValidApplicationData = (data: any): data is ApplicationResponse => {
        return data && 
               typeof data.id === 'string' && 
               data.jobs && 
               typeof data.jobs.id === 'string' &&
               typeof data.jobs.title === 'string' &&
               typeof data.jobs.description === 'string' &&
               typeof data.jobs.location === 'string' &&
               typeof data.jobs.hourly_rate === 'number' &&
               typeof data.jobs.employer_id === 'string' &&
               data.jobs.employer &&
               typeof data.jobs.employer.company_name === 'string';
      };

      // Process jobs with application status
      const processedJobs = (jobsData || []).map(job => {
        const applications = (applicationsData || [])
          .filter(app => app.job_id === job.id);
        
        // Get the employer data - handle potential array response
        const employerData = Array.isArray(job.employer) ? job.employer[0] : job.employer;
        
        // Ensure employer data is properly structured
        const employer: EmployerProfile = {
          id: employerData?.id || '',
          company_name: employerData?.company_name || 'Unknown Company',
          username: employerData?.username || ''
        };

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          hourly_rate: job.hourly_rate,
          status: job.status,
          created_at: job.created_at,
          employer_id: job.employer_id,
          applicationStatus: applications[0]?.status || null,
          applications: applications.map(app => ({
            id: app.id,
            job_id: app.job_id,
            worker_id: app.worker_id,
            status: app.status,
            created_at: app.created_at
          })),
          employer
        } as JobWithStatus;
      });

      console.log('Processed jobs:', processedJobs.length, processedJobs);

      // Process applications with job details
      const processedApplications = (applicationsData || [])
        .filter(app => app.jobs)
        .map(app => {
          const jobData = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          const employerData = Array.isArray(jobData.employer) ? jobData.employer[0] : jobData.employer;
          
          return {
            id: jobData.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            hourly_rate: jobData.hourly_rate,
            employer_id: jobData.employer_id,
            created_at: app.created_at,
            applicationStatus: app.status,
            employer: {
              company_name: employerData?.company_name || 'Unknown Company'
            }
          } as ApplicationWithJob;
        });

      console.log('Processed applications:', processedApplications.length, processedApplications);

      setJobs(processedJobs);
      setApplications(processedApplications);
    } catch (err) {
      console.error('WorkerDashboard - Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      setError(null);
      
      // Check if already applied
      const existingApplication = jobs.find(job => 
        job.id === jobId && job.applicationStatus !== null
      );
      
      if (existingApplication) {
        throw new Error('You have already applied for this job');
      }

      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          worker_id: user?.id,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (applicationError) throw applicationError;
      
      await loadData();
    } catch (err) {
      console.error('Error applying for job:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply for job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  const filteredJobs = filterByTime(jobs, jobSortOrder);
  const filteredApplications = filterByTime(applications, applicationSortOrder);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Worker Dashboard</h1>
        <Link
          to="/worker/profile/edit"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
        >
          Edit Profile
        </Link>
      </div>
      
      {/* Available Jobs Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Available Jobs</h2>
          <select
            className="border rounded px-3 py-1 text-sm"
            onChange={(e) => setJobSortOrder(e.target.value as SortOrder)}
            value={jobSortOrder}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="today">Posted Today</option>
            <option value="this-week">Posted This Week</option>
            <option value="this-month">Posted This Month</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {job.employer?.company_name}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </p>
                <p className="text-blue-600 font-medium flex items-center gap-2">
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
              <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
              <div className="flex justify-between items-center">
                {job.applicationStatus ? (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    job.applicationStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                    job.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    job.applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.applicationStatus.charAt(0).toUpperCase() + job.applicationStatus.slice(1)}
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(job.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No jobs available
            </div>
          )}
        </div>
      </section>

      {/* Applications Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Applications</h2>
          <select
            className="border rounded px-3 py-1 text-sm"
            onChange={(e) => setApplicationSortOrder(e.target.value as SortOrder)}
            value={applicationSortOrder}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="today">Applied Today</option>
            <option value="this-week">Applied This Week</option>
            <option value="this-month">Applied This Month</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications.map(application => (
            <div key={application.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">{application.title}</h3>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {application.location}
                </p>
                <p className="text-blue-600 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ${application.hourly_rate}/hr
                </p>
                <p className="text-gray-500 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Applied {formatDate(application.created_at!)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  application.applicationStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                  application.applicationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                  application.applicationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                </span>
              </div>
            </div>
          ))}
          {filteredApplications.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No applications found
            </div>
          )}
        </div>
      </section>
    </div>
  );
}