import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ApplicationStatus, UserRole, JobPost } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessaging } from '../../contexts/MessagingContext';
import ShareOverlay from '../common/ShareOverlay';

interface WorkerProfile {
  id: string;
  email: string;
  role: string;
  skills: string[];
  hourly_rate: number;
  full_name: string;
}

interface JobWithEmployer {
  id: string;
  title: string;
  description: string;
  location: string;
  hourly_rate: number;
  employer_id: string;
  employer?: {
    company_name: string;
  };
}

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  job_id: string;
  worker_id: string;
  worker?: WorkerProfile;
  jobs?: JobWithEmployer;
}

interface Props {
  onClose: () => void;
  job?: JobPost;
}

const JobApplications = ({ onClose, job }: Props) => {
  const { jobId } = useParams<{ jobId?: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareOverlayOpen, setShareOverlayOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: '', description: '', url: '' });
  const { role, user } = useAuth();
  const { startConversation } = useMessaging();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch applications either by jobId param or job prop
    const targetJobId = jobId || job?.id;
    if (user?.id) {
      fetchApplications(targetJobId);
    } else {
      setLoading(false);
    }
  }, [jobId, job?.id, role, user?.id]);

  const fetchApplications = async (targetJobId?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('Authentication required');
        return;
      }

      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job_id,
          worker_id,
          worker:profiles!worker_id(
            id,
            email,
            role,
            skills,
            hourly_rate,
            full_name
          ),
          jobs!job_id(
            id,
            title,
            description,
            location,
            hourly_rate,
            employer_id,
            employer:profiles!employer_id(
              company_name
            )
          )
        `);

      // If we have a specific job (either from props or URL params)
      if (targetJobId) {
        query = query.eq('job_id', targetJobId);
      }

      // For employers, ensure they can only see applications for their jobs
      if (role === UserRole.Employer) {
        query = query.eq('jobs.employer_id', user.id);
      }

      const { data, error: fetchError } = await query
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('Applications fetched:', data);

      const formattedData: Application[] = (data || []).map((app: any) => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        job_id: app.job_id,
        worker_id: app.worker_id,
        worker: app.worker ? {
          id: app.worker.id,
          email: app.worker.email,
          role: app.worker.role,
          skills: app.worker.skills,
          hourly_rate: app.worker.hourly_rate,
          full_name: app.worker.full_name || 'Anonymous'
        } : undefined,
        jobs: app.jobs ? {
          id: app.jobs.id,
          title: app.jobs.title,
          description: app.jobs.description,
          location: app.jobs.location,
          hourly_rate: app.jobs.hourly_rate,
          employer_id: app.jobs.employer_id,
          employer: app.jobs.employer ? {
            company_name: app.jobs.employer.company_name
          } : undefined
        } : undefined
      }));

      console.log('Formatted applications:', formattedData);
      setApplications(formattedData);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setError(null);

      const application = applications.find(app => app.id === applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      if (role === UserRole.Worker && user?.id !== application.worker_id) {
        throw new Error('Unauthorized to update this application');
      }

      if (role === UserRole.Employer && user?.id !== application.jobs?.employer_id) {
        throw new Error('Unauthorized to update this application');
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application status');
    }
  };

  const handleMessage = async (application: Application) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to send messages');
      }

      const workerId = application.worker_id;
      const employerId = application.jobs?.employer_id;

      if (!workerId || !employerId) {
        throw new Error('Missing required user information');
      }

      // Start or get existing conversation
      await startConversation(workerId, employerId, application.id);
      
      // Navigate to messages page
      navigate(role === UserRole.Employer ? '/employer/messages' : '/worker/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    }
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-yellow-100/50', label: 'Pending' },
    accepted: { color: 'bg-green-100 text-green-800 border border-green-300 shadow-green-100/50', label: 'Accepted' },
    rejected: { color: 'bg-red-100 text-red-800 border border-red-300 shadow-red-100/50', label: 'Rejected' },
    withdrawn: { color: 'bg-gray-100 text-gray-800 border border-gray-300 shadow-gray-100/50', label: 'Withdrawn' },
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary shadow-md"></div>
        <p className="text-gray-500 animate-pulse">Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg animate-scale-in border border-gray-100">
      {/* Share Overlay */}
      <ShareOverlay 
        isOpen={shareOverlayOpen}
        onClose={() => setShareOverlayOpen(false)}
        title={shareData.title}
        description={shareData.description}
        url={shareData.url}
      />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700 drop-shadow-sm">
          {role === UserRole.Employer ? 'Job Applications' : 'My Applications'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-all duration-200 transform hover:scale-110 hover:shadow-sm"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-md animate-scale-in flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="space-y-6">
        {applications.length === 0 ? (
          <div className="text-gray-500 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No applications found
          </div>
        ) : (
          applications.map(application => (
            <div key={application.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 backdrop-blur-sm transform hover:-translate-y-1 hover:border-primary/30">
              <div className="flex justify-between items-start mb-3">
                <div>
                  {role === UserRole.Employer ? (
                    <>
                      <h3 className="font-medium">
                        {application.worker?.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {application.worker?.email}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-medium">
                        {application.jobs?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        at {application.jobs?.employer?.company_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {application.jobs?.location}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-600">
                    Applied {new Date(application.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${statusConfig[application.status].color} flex items-center justify-center min-w-[90px]`}>
                  {statusConfig[application.status].label}
                </span>
              </div>

              {role === UserRole.Employer && application.worker?.skills && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2 text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skills:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {application.worker.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-sm font-medium shadow-sm hover:bg-blue-100 transition-all duration-200 transform hover:scale-105">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {role === UserRole.Worker && application.jobs?.description && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">Job Description:</h4>
                  <p className="text-gray-600 text-sm line-clamp-3">{application.jobs.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm font-medium bg-gray-50 px-3 py-1.5 rounded-lg inline-block border border-gray-100 shadow-sm">
                  <span className="text-gray-500">Hourly Rate:</span> <span className="text-primary font-bold">ETB {role === UserRole.Employer ? application.worker?.hourly_rate : application.jobs?.hourly_rate}</span>
                </p>
                
                <div className="flex items-center space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-all duration-200 transform hover:scale-110"
                    title="Message"
                    onClick={() => handleMessage(application)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  
                  <button
                    className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-all duration-200 transform hover:scale-110"
                    title="Share"
                    onClick={() => {
                      const jobTitle = role === UserRole.Employer 
                        ? `${application.worker?.full_name}'s Application` 
                        : application.jobs?.title || 'Job Application';
                      
                      const description = role === UserRole.Employer
                        ? `Check out ${application.worker?.full_name}'s application on GUGU Work!`
                        : `Check out this job at ${application.jobs?.employer?.company_name} on GUGU Work!`;
                      
                      setShareData({
                        title: jobTitle,
                        description,
                        url: window.location.href
                      });
                      setShareOverlayOpen(true);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  
                  {/* Employer can accept/reject pending applications */}
                  {(role === UserRole.Employer && application.status === 'pending') && (
                    <select
                      value={application.status}
                      onChange={(e) => updateStatus(application.id, e.target.value as ApplicationStatus)}
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent shadow-md hover:border-primary transition-all cursor-pointer bg-white hover:shadow-lg"
                    >
                      {Object.entries(statusConfig)
                        .filter(([status]) => {
                          return status === 'pending' || status === 'accepted' || status === 'rejected';
                        })
                        .map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.label}
                          </option>
                        ))}
                    </select>
                  )}
                  
                  {/* Worker can only withdraw their pending applications */}
                  {(role === UserRole.Worker && application.status === 'pending') && (
                    <select
                      value={application.status}
                      onChange={(e) => updateStatus(application.id, e.target.value as ApplicationStatus)}
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent shadow-md hover:border-primary transition-all cursor-pointer bg-white hover:shadow-lg"
                    >
                      {Object.entries(statusConfig)
                        .filter(([status]) => {
                          return status === 'pending' || status === 'withdrawn';
                        })
                        .map(([status, config]) => (
                          <option key={status} value={status}>
                            {config.label}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobApplications;