import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Application, ApplicationStatus, UserRole } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

interface ApplicationDetail extends Application {
  cover_letter?: string;
  resume_url?: string;
  cosigner_name?: string;
  cosigner_email?: string;
  cosigner_address?: string;
  agreement_accepted?: boolean;
  agreement_signed_at?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
}

const ApplicationDetailModal = ({ isOpen, onClose, applicationId }: Props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const { role, user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (applicationId) {
        fetchApplicationDetail(applicationId);
      }
    } else {
      // Add a small delay before fully removing the modal from DOM to allow for animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, applicationId]);

  const fetchApplicationDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('Authentication required');
      }

      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          job_id,
          worker_id,
          cover_letter,
          resume_url,
          cosigner_name,
          cosigner_email,
          cosigner_address,
          agreement_accepted,
          agreement_signed_at,
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
        `)
        .eq('id', id);

      // For employers, ensure they can only see applications for their jobs
      if (role === UserRole.Employer) {
        query = query.eq('jobs.employer_id', user.id);
      }
      
      // For workers, ensure they can only see their own applications
      if (role === UserRole.Worker) {
        query = query.eq('worker_id', user.id);
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Application not found');

      console.log('Application detail fetched:', data);

      // Format the application data
      const formattedData: ApplicationDetail = {
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        job_id: data.job_id,
        worker_id: data.worker_id,
        cover_letter: data.cover_letter,
        resume_url: data.resume_url,
        cosigner_name: data.cosigner_name,
        cosigner_email: data.cosigner_email,
        cosigner_address: data.cosigner_address,
        agreement_accepted: data.agreement_accepted,
        agreement_signed_at: data.agreement_signed_at,
        worker: data.worker && data.worker.length > 0 ? {
          id: data.worker[0].id,
          email: data.worker[0].email,
          role: data.worker[0].role,
          skills: data.worker[0].skills,
          hourly_rate: data.worker[0].hourly_rate,
          full_name: data.worker[0].full_name || 'Anonymous'
        } : undefined,
        jobs: data.jobs && data.jobs.length > 0 ? {
          id: data.jobs[0].id,
          title: data.jobs[0].title,
          description: data.jobs[0].description,
          location: data.jobs[0].location,
          salary: data.jobs[0].hourly_rate, // Changed hourly_rate to salary to match the type definition
          employer_id: data.jobs[0].employer_id,
          employer: data.jobs[0].employer && data.jobs[0].employer.length > 0 ? {
            company_name: data.jobs[0].employer[0].company_name
          } : undefined
        } : undefined
      };

      setApplication(formattedData);
    } catch (err) {
      console.error('Error fetching application detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-yellow-100/50', label: 'Pending' },
    accepted: { color: 'bg-green-100 text-green-800 border border-green-300 shadow-green-100/50', label: 'Accepted' },
    rejected: { color: 'bg-red-100 text-red-800 border border-red-300 shadow-red-100/50', label: 'Rejected' },
    withdrawn: { color: 'bg-gray-100 text-gray-800 border border-gray-300 shadow-gray-100/50', label: 'Withdrawn' },
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform ${isOpen ? 'scale-100' : 'scale-95'} transition-transform duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex justify-between items-center bg-white p-4 border-b z-10">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700 drop-shadow-sm">
            Application Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-md animate-scale-in flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary shadow-md"></div>
              <p className="text-gray-500 animate-pulse">Loading application details...</p>
            </div>
          ) : application ? (
            <div className="space-y-8">
              {/* Application Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {role === UserRole.Employer ? application.worker?.full_name : application.jobs?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {role === UserRole.Employer 
                      ? `Applied for: ${application.jobs?.title}` 
                      : `at ${application.jobs?.employer?.company_name}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    Applied on {new Date(application.created_at!).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${statusConfig[application.status].color} flex items-center justify-center min-w-[90px]`}>
                  {statusConfig[application.status].label}
                </span>
              </div>

              {/* Cover Letter */}
              <div>
                <h4 className="text-md font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Cover Letter
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {application.cover_letter || 'No cover letter provided'}
                </div>
              </div>

              {/* Resume */}
              {application.resume_url && (
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Resume
                  </h4>
                  <div className="flex items-center">
                    <a 
                      href={application.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Resume
                    </a>
                  </div>
                </div>
              )}

              {/* Co-signer Information */}
              <div>
                <h4 className="text-md font-semibold mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Co-signer Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{application.cosigner_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{application.cosigner_email || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{application.cosigner_address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Worker Information (for employers only) */}
              {role === UserRole.Employer && application.worker && (
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Worker Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{application.worker.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{application.worker.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Hourly Rate</p>
                      <p className="font-medium">ETB {application.worker.hourly_rate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Worker Skills (for employers only) */}
              {role === UserRole.Employer && application.worker?.skills && (
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Skills
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

              {/* Job Description (for workers only) */}
              {role === UserRole.Worker && application.jobs?.description && (
                <div>
                  <h4 className="text-md font-semibold mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Job Description
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {application.jobs.description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No application details found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;