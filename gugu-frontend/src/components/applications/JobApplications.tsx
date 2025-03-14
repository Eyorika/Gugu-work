import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Application, ApplicationStatus, UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  jobId: string;
  onClose: () => void;
}

const JobApplications = ({ jobId, onClose }: Props) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role, user } = useAuth();

  useEffect(() => {
    fetchApplications();
  }, [jobId, role, user?.id]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
  
      if (!user?.id) {
        setError('Authentication required');
        return;
      }
  
      //  base query
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
            first_name,
            last_name,
            email,
            role,
            skills,
            hourly_rate
          ),
          jobs!job_id(
            id,
            title,
            description,
            location,
            salary,
            employer_id,
            employer:profiles!jobs_employer_id_fkey(
              company_name
            )
          )
        `);
  
      //   role-specific filters
      if (role === UserRole.Worker) {
        query = query.eq('worker_id', user.id);
      } else if (role === UserRole.Employer) {
        query = query
          .eq('job_id', jobId)
          .eq('jobs.employer_id', user.id);
      }
  

      const { data, error: fetchError } = await query
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    const formattedData: Application[] = (data || []).map((app: any) => ({
      id: app.id,
      status: app.status,
      created_at: app.created_at,
      job_id: app.job_id,
      worker_id: app.worker_id,
      worker: app.worker ? {
        id: app.worker.id,
        first_name: app.worker.first_name,
        last_name: app.worker.last_name,
        email: app.worker.email,
        role: app.worker.role,
        skills: app.worker.skills,
        hourly_rate: app.worker.hourly_rate
      } : undefined,
      jobs: app.jobs ? {
        id: app.jobs.id,
        title: app.jobs.title,
        description: app.jobs.description,
        location: app.jobs.location,
        salary: app.jobs.salary,
        employer_id: app.jobs.employer_id,
        employer: app.jobs.employer ? {
          company_name: app.jobs.employer.company_name
        } : undefined
      } : undefined
    }));


     setApplications(formattedData);

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to fetch applications');
  } finally {
    setLoading(false);
  }
};


  const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setError(null);

      // Verify user has permission to update
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
                    {application.worker?.first_name} {application.worker?.last_name}
                  </h3>
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