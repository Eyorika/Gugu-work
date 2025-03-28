import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { JobPost, ApplicationStatus } from '../../../lib/types';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import JobFilters, { Filters } from '../../../components/others/JobFilters';
import { div } from 'framer-motion/client';
import ApplicationForm from '../../../components/applications/ApplicationForm';

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

export interface JobWithStatus extends Omit<JobPost, 'salary'> {
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


/*interface JobData {
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
}*/


type SortOrder = 'newest' | 'oldest' | 'today' | 'this-week' | 'this-month';

export default function WorkerDashboard() {
  const [jobs, setJobs] = useState<JobWithStatus[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobSortOrder] = useState<SortOrder>('newest');
  const [applicationSortOrder, setApplicationSortOrder] = useState<SortOrder>('newest');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    location: '',
    minSalary: '',
    sort: 'newest'
  });
  const [currentJobPage, setCurrentJobPage] = useState(1);
  const [currentApplicationPage, setCurrentApplicationPage] = useState(1);
  const [jobsPerPage] = useState(9);
  const [applicationsPerPage] = useState(9);
  const { user } = useAuth();

  useEffect(() => {
    console.log('WorkerDashboard useEffect - User ID:', user?.id);
    if (user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;
    const subscription = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (isMounted) loadData();
      })
      .subscribe();
  
    return () => {
      if (isMounted) {
        subscription.unsubscribe();
      }
      isMounted = false;
    };
  }, []);

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

  // Optimize the loadData function
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Combine both queries into a single Promise.all
      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase
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
            employer:profiles(id, company_name, username)
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        
        supabase
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
              employer:profiles(company_name, username)
            )
          `)
          .eq('worker_id', user?.id)
      ]);
  
      // Handle errors
      if (jobsResponse.error) throw jobsResponse.error;
      if (applicationsResponse.error) throw applicationsResponse.error;
  
      // Fix the processedJobs mapping
      const processedJobs = (jobsResponse.data || []).map(job => {
        const applications = (applicationsResponse.data || [])
          .filter(app => app.job_id === job.id)
          .map(app => ({
            id: app.id,
            job_id: app.job_id,
            worker_id: app.worker_id,
            status: app.status,
            created_at: app.created_at
          }));
  
        const employerData = Array.isArray(job.employer) ? job.employer[0] : job.employer;
  
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
          applications: applications,
          employer: {
            id: employerData?.id || '',
            company_name: employerData?.company_name || 'Unknown Company',
            username: employerData?.username || ''
          }
        } as JobWithStatus;
      });
  
      // Fix the processedApplications mapping
      const processedApplications = (applicationsResponse.data || [])
        .filter(app => app.jobs)
        .map(app => {
          const jobData = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
          const employerData = Array.isArray(jobData.employer) ? jobData.employer[0] : jobData.employer;
          
          return {
            id: jobData.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            hourly_rate: jobData.hourly_rate || 0, // Ensure hourly_rate is always present
            employer_id: jobData.employer_id,
            created_at: app.created_at,
            applicationStatus: app.status,
            employer: {
              company_name: employerData?.company_name || 'Unknown Company'
            }
          } as ApplicationWithJob;
        });
  
      setJobs(processedJobs);
      setApplications(processedApplications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithStatus | null>(null);

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

      // Find the job and show application form
      const job = jobs.find(job => job.id === jobId);
      if (job) {
        setSelectedJob(job);
        setShowApplicationForm(true);
      } else {
        throw new Error('Job not found');
      }
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

  const applyFilters = (jobs: JobWithStatus[]) => {
    return jobs.filter(job => {
      const matchesSearch = !filters.search || 
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search.toLowerCase());

      const matchesLocation = !filters.location ||
        job.location.toLowerCase().includes(filters.location.toLowerCase());

      const matchesSalary = !filters.minSalary ||
        job.hourly_rate >= parseFloat(filters.minSalary);

      return matchesSearch && matchesLocation && matchesSalary;
    });
  };
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = applyFilters(filterByTime(jobs, jobSortOrder));
  const filteredApplications = filterByTime(applications, applicationSortOrder);

  const totalJobPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const totalApplicationPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  const indexOfLastJob = currentJobPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const indexOfLastApplication = currentApplicationPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Application Form Overlay */}
      {showApplicationForm && selectedJob && (
        <ApplicationForm
          job={selectedJob}
          onClose={() => setShowApplicationForm(false)}
          onSubmit={() => {
            loadData();
            setShowApplicationForm(false);
          }}
        />
      )}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
        <div className="flex gap-4">
          <Link
            to="/worker/profile/edit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit Profile
          </Link>
          <Link 
            to="/testimonials" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Testimonials
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Applications Section */}
        <div className="lg:col-span-1">
          <section className="bg-white p-6 rounded-lg shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">My Applications</h2>
              <div className="relative">
                <select
                  value={applicationSortOrder}
                  onChange={(e) => setApplicationSortOrder(e.target.value as SortOrder)}
                  className="appearance-none bg-white border border-gray-200 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {currentApplications.length > 0 ? (
              <div className="space-y-4">
                {currentApplications.map(application => (
                  <div key={application.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{application.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.applicationStatus)}`}>
                        {application.applicationStatus.charAt(0).toUpperCase() + application.applicationStatus.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{application.employer?.company_name || 'Unknown Company'}</p>
                    <p className="text-sm text-gray-500 mb-2">{application.location}</p>
                    <p className="text-sm text-primary font-medium mb-2">${application.hourly_rate.toFixed(2)} / hour</p>
                    <p className="text-xs text-gray-400">Applied {formatDate(application.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't applied to any jobs yet.</p>
              </div>
            )}
            
            {totalApplicationPages > 1 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: totalApplicationPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentApplicationPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${currentApplicationPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
        
        {/* Available Jobs Section */}
        <div className="lg:col-span-2">
          <section className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Available Jobs</h2>
            </div>
            <JobFilters
              filters={filters}
              setFilters={setFilters}
              className="mb-4"
            />
            <div className="grid gap-4 md:grid-cols-2">
              {currentJobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-gray-600 mb-2">{job.location}</p>
                    <p className="text-primary font-medium mb-2">${job.hourly_rate ? job.hourly_rate.toFixed(2) : 'N/A'} / hour</p>
                    <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Posted {formatDate(job.created_at || '')}</span>
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={job.applicationStatus !== null}
                        className={`px-4 py-2 rounded text-sm font-medium ${job.applicationStatus !== null
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-primary-dark'}`}
                      >
                        {job.applicationStatus !== null ? 'Applied' : 'Apply Now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalJobPages > 1 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: totalJobPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentJobPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${currentJobPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

        {/* Pagination Controls */}
        <div className="mt-6 space-y-4">
          {totalJobPages > 1 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Jobs Page</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalJobPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentJobPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${currentJobPage === pageNum
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}

          {totalApplicationPages > 1 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Applications Page</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalApplicationPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentApplicationPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${currentApplicationPage === pageNum
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}