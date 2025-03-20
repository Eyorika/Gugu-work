import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ApplicationStatus, UserRole, JobPost } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useParams } from 'react-router-dom';

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
  const { role, user } = useAuth();

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
            employer:profiles!jobs_employer_id_fkey(
              company_name
            )
          )
        `);

      // Apply filters based on role and job ID
      if (role === UserRole.Worker) {
        query = query.eq('worker_id', user.id);
      } else if (role === UserRole.Employer) {
        if (!targetJobId) {
          // If no job ID is provided for employer, show all applications for their jobs
          query = query.eq('jobs.employer_id', user.id);
        } else {
          // If job ID is provided, show applications for that specific job
          query = query
            .eq('job_id', targetJobId)
            .eq('jobs.employer_id', user.id);
        }
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

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    withdrawn: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {role === UserRole.Employer ? 'Job Applications' : 'My Applications'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No applications found
          </div>
        ) : (
          applications.map(application => (
            <div key={application.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">
                    {application.worker?.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {application.worker?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {application.jobs?.title} at {application.jobs?.employer?.company_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Applied {new Date(application.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusConfig[application.status].color}`}>
                  {statusConfig[application.status].label}
                </span>
              </div>

              {application.worker?.skills && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-1">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.worker.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-gray-600">
                  Hourly Rate: ${application.worker?.hourly_rate}
                </p>
                
                {((role === UserRole.Employer && application.status === 'pending') ||
                  (role === UserRole.Worker && application.status === 'pending')) && (
                  <select
                    value={application.status}
                    onChange={(e) => updateStatus(application.id, e.target.value as ApplicationStatus)}
                    className="border rounded p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {Object.entries(statusConfig)
                      .filter(([status]) => {
                        if (role === UserRole.Worker) {
                          return status === 'pending' || status === 'withdrawn';
                        }
                        return status === 'pending' || status === 'accepted' || status === 'rejected';
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
          ))
        )}
      </div>
    </div>
  );
};

export default JobApplications;